---
title: "Star Schema for Finance: How I Model Xero Accounting Data"
description: "Choosing the journal line as the grain, handling Xero's journal-versioning quirk, joining Sheets facts to dimensions, and why a clean model makes DAX dramatically simpler."
date: 2026-09-12
tags: ["star schema", "xero", "data modelling", "sql", "powerbi", "dimensional modelling", "warehouse"]
published: true
---

If you've only ever reported straight out of an accounting system, "star schema" sounds like architecture porn. It isn't. It's the difference between a report set that takes an afternoon to change and one that takes a week.

This is how I model Xero accounting data in a star schema — and the two decisions that matter most: **the grain**, and **how you handle the fact that Xero journals are never edited, only re-issued.**

## The grain comes first

Every modelling book says it and every modeller is tempted to ignore it: **define the grain before you touch a table.** The grain is the answer to "what does one row mean?"

For Xero finance data, the obvious candidate is almost always wrong at first. It is **not the journal**. A journal can have multiple lines, so posting several accounts gets mashed together. It is **not the invoice** either — invoices have line items that map to different accounts and tracking categories.

The right grain for a *facts* table is:

```text
the journal line  (journal_line_id)
```

Why the journal line wins:

- it's the level where **account** is resolved (each line has one account code)
- it's the level where **tracking categories** attach (via `journal_line_has_tracking_category`)
- it's the level where **amounts** go positive/negative for the P&L
- it's the finest level Xero's journals endpoint gives you, so nothing is lost by going finer — there isn't anything finer

Once the grain is locked, everything downstream — dimensions, aggregates, DAX — is mechanical. Every design failure I've seen in finance modelling traces back to skipping this step.

## The Xero quirk that breaks naive models

Here's the part that catches everyone. **Xero never mutates a journal.** If someone edits or voids a transaction, Xero does not go back and change the original journal. It appends:

1. a **reversal journal** — negating the old state
2. a **replacement journal** — the new state

All of them share the same `source_id`, each with a higher `journal_number`.

So your raw `journal` and `journal_line` tables contain **every historical version of every transaction**. If you report straight from them, you double-count: the original invoice line, its reversal, and its replacement all sit in the table, netting to the right answer only by accident — and usually not even then.

This is the single most common reason a "simple Power BI on Xero" model produces numbers that don't match the trial balance.

## Keep everything, surface the current state

There are two honest ways to serve this. I've built both, in different systems.

### Approach A: "Latest line wins"

The fact table stays **append-only** — every version retained for audit — and a view surfaces only the latest journal per source:

```sql
SELECT * FROM (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY [source_id], [journal_line_id]
               ORDER BY [journal_number] DESC
           ) AS _rn
    FROM fact_journals
) ranked
WHERE _rn = 1;
```

The join-based equivalent (`MAX(journal_number)` per `source_id`) is the same rule, and on SQL Server it's the index-friendlier form when your covering index is keyed on `(source_id, journal_number DESC)` — SQL Server can answer it with an ordered scan and no sort.

The critical design point: **this is a view on top of an append-only table, not a destructive update.** The warehouse keeps full history as audit evidence; reporting just never reads the superseded rows.

### Approach B: "Every journal counts"

There's a more subtle option I came to later: **sum the complete canonical journal stream and don't filter at all.**

This sounds wrong until you check it. Xero's own Profit & Loss report effectively nets out each reversal+replacement pair — and when I compared summing *every* canonical journal line against Xero's P&L across 60 months, it matched **exactly** at account/month grain. The "latest line wins" resolver, by contrast, did not.

So the pattern that emerged:

- **Storage** keeps every version, always.
- **Served actuals** sum the entire canonical stream (Xero's reports do the same thing implicitly).
- **Drill-through** collapses the balancing history on demand — group the clicked cell's lines by source, sum the history, drop zero-net groups — and shows you the current state.

Both approaches start from the same place: **never let history get silently overwritten, and never let history leak into reports by accident.**

## Handling reversals and noise

Beyond versioning, both systems filter out genuine noise so a number means something:

- Drop sources whose lines net to ~zero (`ABS(SUM(net_amount)) > 0.01` is a pure reversal and carries no information).
- Exclude non-current document statuses at the source: `invoice.status NOT IN ('VOIDED','DELETED')`, `bank_transaction.status = 'AUTHORISED'`.
- A configurable noise-rule table can catch recurring journals (accruals, prepayments, deferred income) that roll through every month — but only exclude a journal when **every one of its lines** matches a rule, so a mixed journal stays visible.

## From raw Xero tables to fact and dimension tables

Xero gives raw, API-shaped tables. They are **source data**, not a model. The conversion is a small number of views.

### Actuals, budget and forecast: same shape, separate facts

Star-schema purists keep one wide fact table. Finance has a problem with that: actuals, budget and forecast have **different natural sources and grains**. Actuals arrive from Xero via a sync. Budget comes from a planning sheet. Forecast comes from another one. Forcing them into one table means padding the grain and lying about which source a row genuinely came from.

So I keep three fact tables that share the same shape:

```text
FactActuals   -- grain: journal line, from Xero
FactBudget    -- grain: account x month (from Sheets)
FactForecast  -- grain: account x month (from Sheets)
```

Same dimensions, same amount column, same keys. **Compatible but separate.** That one decision is what makes a rolling forecast easy to build later.

In practice the Sheets facts arrive **unpivoted** — the planning spreadsheet is months-as-columns (wide), and Power Query turns it into month × value (tall) before it joins the model:

```m
// budget from Sheets: wide "month as column" → tall
#"Unpivoted Columns" = Table.UnpivotOtherColumns(
    #"Promoted Headers",
    {"tc1","tc2","coa_g2","coa_g3","account_id","year","Contact","Account","Total"},
    "Attribute", "Value")
```

One honest caveat from building this for real: the Sheets facts join to the tracking/contact **dimensions by name** (`tc1` → `OptionName`, `Contact` → `name`), while the Xero actuals join by **ID**. It works because the planning sheet is maintained by the same team that set the names up — but it's a seam. The right fix is giving the sheet the same UUIDs, so nothing depends on a name staying put (see the identity note below).

## Mapping tables: the dimension you don't get from the API

Here's the dirty secret of modelling accounting systems: **the mapping from "Xero account" to "P&L line" is not in Xero.** The finance team's operational chart of accounts, billing groupings, and the way entities roll up exist only in people's heads (or one fragile Excel tab).

In a star schema, that becomes a small, versionable table — not DAX. One row per account, with as many mapping levels as your reporting needs:

```sql
CREATE TABLE mapping_coa (
    account_id VARCHAR(256) PRIMARY KEY,
    mapping1   VARCHAR(256),
    mapping2   VARCHAR(256),
    mapping3   VARCHAR(256),
    mapping4   VARCHAR(256),
    mapping5   VARCHAR(256)
);
```

I use the same pattern for journal-level exceptions, fixed assets, tracking categories, and entities. Why not do this in Power BI? Because six reports each re-implementing "account 5000 is staff costs" is exactly how you get six different P&Ls. Fix it once, in the warehouse.

A note on naming: **the Xero UUID is the anchor, not the name.** Users rename accounts and tracking options all the time, and a rename must never change what a row *is*. Resolve names from the dimension tables at report time (dimension-first, ingested snapshot as fallback), and never put a name in a key, a join, or a `GROUP BY`. If a manual journal has no contact in Xero, give it a synthetic sentinel UUID rather than letting a label ("Finance Journals") become identity.

One more honest confession, because I build this the other way too: on the reporting side, some of my EBITDA measures reach into the mapping columns directly in DAX rather than via a separate hierarchy table:

```dax
ebitda_act =
    CALCULATE([SumACT_YTD], vw_r_dim_accounts[mapping5] = "EBITDA")
    /
    CALCULATE([SumACT_YTD], vw_r_dim_accounts[mapping2] = "1. Revenue")
```

That works, and it's compact. The reason I prefer the table version is it keeps the hierarchy **discoverable and single-owned** — six reports each filtering on `mapping5` are fine today, but the moment a hierarchy rule changes you want one place to edit it, not a search across measures. Start with the mapping table; reach for `CALCULATE(...[mappingN] = ...)` sparingly.

## The tracking category pivot

Xero's tracking categories are a natural dimension, but the source shape is awkward: a bridge table (`journal_line_has_tracking_category`) with one row *per tracking-category option* on a line, not one row per journal line.

Feeding that straight to Power BI multiplies rows and breaks the grain. The fix is a view that **pivots to one tracking column per journal line**. Most Xero orgs use two categories — the ones I work with are **Department** and **Activity/Project** — so the pivot lands them as two columns on the fact:

```sql
SELECT
  jlhtc.journal_line_id,
  MAX(IIF(mtc.IsTracking1 = 1, tco.name, NULL)) AS tracking1_option_name,
  MAX(IIF(mtc.IsTracking2 = 1, tco.name, NULL)) AS tracking2_option_name
FROM journal_line_has_tracking_category jlhtc
LEFT JOIN mapping_tc1tc2 mtc ON mtc.tracking_category_id = jlhtc.tracking_category_id
LEFT JOIN tracking_category_option tco ON jlhtc.tracking_category_option_id = tco.tracking_option_id
GROUP BY jlhtc.journal_line_id;
```

`mapping_tc1tc2` declares which categories are "the" Tracking 1 and "the" Tracking 2 for the organisation — in our case Department and Activity/Project. If an organisation only uses one category, the model doesn't invent an empty second one.

The payoff is real: "how much did the marketing department spend on the rebrand project" becomes a filter on two columns instead of a join through a bridge table that multiplies every line.

## Preventing journal-line duplication

A finance fact table must never double-count. Sources of duplication to guard against:

- **Same journal reached via multiple paths** (e.g. joined from an invoice *and* from the journal). I anchor views on a single table (`journal_line`) and push everything else out through left joins, so a line is visited exactly once.
- **Version history** (the Xero quirk above). Either collapse to latest per source in a view, or sum the whole stream — never both, never neither.
- **Deleted / voided journals.** Xero's API doesn't reliably return deleted journal lines, so treat journal history as **append-only with soft-delete flags**, not a destructive upsert that erases the past.

The cardinality test that has to pass:

```sql
SELECT journal_line_id
FROM FactActuals
GROUP BY journal_line_id
HAVING COUNT(*) > 1;
```

Returns nothing. Ever. (The append-only history table is exempt by design — this test is for the *served* fact layer.)

## Accounts, dates, contacts... the boring (and correct) dimensions

Once the grain is fixed, the dimensions become boring — which is the whole point:

- **DimAccount** — account_id, code, name, type; fed by `mapping_coa` for the additional reporting levels
- **DimDate** — one row per day, with month/quarter/year columns (a real date table, not the "email me a month list" version)
- **DimTracking** — from the pivot above
- **DimEntity** — organisation/tenant, so multi-entity data gets a proper foreign key
- **DimContact** — customer / supplier name

Each joins 1-to-many to every fact table, from the dimension side.

## Why this makes DAX (and sanity) simpler

Everyone's first Power BI model is one big table with 47 columns and a `CALCULATE` mess. Swap to a star schema and the same reports become almost trivial:

```dax
Actuals = SUM(FactActuals[Amount])
Budget  = SUM(FactBudget[Amount])
```

Filter by account, date or tracking at the visual level and the relationships do the work. Budget-vs-actual variance stops being a bespoke expression and becomes a visual-level comparison.

The deeper payoff: **when a report needs a new cut, you add a dimension, not a report.** Marketing asks for "new customer vs existing customer"? That's a column on an existing dimension — not a rebuild.

## One performance rule worth stealing

If your fact table is large and your warehouse is constrained (I've run this on Azure SQL Basic, 10 DTU, where I/O is the bottleneck), the single covering index does the heavy lifting. Key columns `(source_id, journal_number DESC)` for the latest-line dedup, every other column `INCLUDE`d — so the engine answers any query from the index alone, with no key lookups and no extra indexes. It's the difference between a report that pages and a report that just returns.

## The costs, honestly

Dimensional modelling has a learning curve and it feels like bureaucracy on a tiny dataset. My honest take:

- With a small single-entity set and a handful of reports, straight Power BI on Xero is *faster to stand up*. The star schema pays off when reports multiply, or when anything is multi-entity, or when you need actuals + budget + forecast in one view.
- Every mapping table is a governance object that needs an owner, or it rots.
- It demands a little SQL comfort. I'd argue that's a feature, not a cost — it's the skill that unlocks the whole approach.

## Practical starting points

1. **Decide what one row means before you build anything.** For Xero, that's the journal line.
2. **Decide how you handle journal versioning up front.** Append-only history + a latest-line view, or append-only history + sum-everything. What you must not do is neither — or silently overwriting history.
3. **Check your served fact table has one row per grain.** Run the duplicate test after every new source joins the model.
4. **Put mappings in tables.** If you find yourself writing `IF(account = "5000", ...)` in DAX, you're building a mapping table the hard way.
5. **Keep actual/budget/forecast as same-shaped separate facts.**
6. **Anchor on UUIDs, look up names.**