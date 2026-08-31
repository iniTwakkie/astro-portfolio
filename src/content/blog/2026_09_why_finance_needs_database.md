---
title: "Why Every Finance Team Eventually Needs a Database"
description: "Excel is useful; using Excel as the system of record is the problem. When spreadsheets stop scaling, what a database actually buys a finance team — and how to get there."
date: 2026-08-31
tags: ["database", "excel", "finance", "sql", "spreadsheets", "data modelling", "fpa"]
published: true
---

I have never once argued that a finance team should stop using Excel. I've argued one narrower thing, and it's the whole point of this post: **Excel is useful; using Excel as the system of record is the problem.**

Most finance teams don't need to abandon spreadsheets. They need to stop *being* a spreadsheet.

## The point where spreadsheets stop scaling

There's a moment every growing finance team hits, and it's almost never about row counts. It's about three things at once:

1. **Multiple people, one version.** "Which file is the latest?" is not a data question, it's a governance failure.
2. **Logic hidden in cells.** The formula that reclassifies something, or the hidden reference tab, is carrying a finance decision nobody can see, version, or audit.
3. **Everybody rebuilding the same thing.** Three reports each re-derive "revenue, but adjusted", and they stop agreeing, and someone spends a month "reconciling the reports" instead of answering the question.

The tell isn't a red freeze pane. It's when **a person's job becomes managing the file instead of managing the numbers.**

## What a database actually buys you

Concrete, not abstract:

**A shared source of truth.** One place the data lives, that everyone reads. "Which version is right?" stops being a question because there's only one.

**Repeatability.** Same inputs → same number, every time. When a report says £42,000, the next person who runs it gets £42,000 and can trace where it came from.

**Auditability.** Every row has a source, a timestamp, a trail. You can explain a number five months later, which matters in finance in a way it doesn't anywhere else.

**Separation of data from presentation.** This is the big one. The number lives in the database; Excel (or a dashboard) merely *displays* it. Change the display, the number is untouched. Change the number, every display updates — instead of chasing six workbooks.

```text
Spreadsheet as system of record       Database as system of record
──────────────────────────────        ─────────────────────────────
data + formula + formatting           data (in the database)
    all welded together               formula (in queries, once)
                                      formatting (in reports)
```

## What belongs in a database vs what stays in spreadsheets

This is the question everyone skips. The answer I've landed on:

| Belongs in the database | Stays in a spreadsheet |
| --- | --- |
| transactions, journals, ledger facts | scenario modelling, what-ifs |
| master data (accounts, customers) | commentary, review, annotations |
| the grain-level truth (every line) | the *working* copy a person edits |
| the mapping / hierarchy decisions | ad-hoc analysis, once-off exploration |

The rule that keeps it sane:

> Use spreadsheets for thinking. Use the database for truth.

Budgeting and forecasting, for example, stay collaborative and subjective — that's spreadsheet territory, or at least a very friendly UI. But the *actuals* they're measured against should come from one auditable source.

## A practical migration path for a small finance team

You don't need a data engineering project. You need a sequence:

1. **Pick one thing.** Don't migrate the world. Choose the single dataset that's causing the most pain — likely actuals, or a key reconciliation.
2. **Get it into a database.** For most Xero/QuickBooks shops this is a sync (Fivetran, a connector, or a scheduled export) into something like Postgres or SQL Server.
3. **Build the view of it you always hand-build in Excel.** That's the "manage the numbers" view.
4. **Point the spreadsheet at the view.** Excel can query a database directly (Power Query makes this almost pleasant). Now the spreadsheet displays the database instead of *being* the source.
5. **Add one control.** A grain check, a total that must match, a "last refreshed" timestamp. Just one, until it's part of the rhythm.

Slow, boring, and compounding. That is exactly the right way for finance to adopt infrastructure.

## Why SQL often beats Python as the next skill

A quick aside, because it comes up every time I have this conversation: for an accountant, SQL produces leverage much faster than Python.

SQL is *exactly* the job. It's how you talk to that database above — filtering, joining, aggregating, validating. A day of SQL practice and you can stop fighting Excel's limits on the exact problems you have, not the ones a course assumed.

Python is a real tool, but it solves a different problem (automation, scraping, irregular transformation) that you hit later. Earliest leverage, in order:

```text
Excel → Power Query → SQL → data modelling → (then) Python
```

If someone tells you "learn Python to be a modern accountant," ask whether what you actually need is the SQL step no one mentioned first.

## The uncomfortable summary

The teams that struggle most aren't the ones using spreadsheets badly. They're the ones where the spreadsheet *has become the accounting system* — an inseparable tangle of data and formula that nobody inside can unpick and nobody outside can trust.

The fix isn't a mandate from IT. It's one dataset, in one database, read by one spreadsheet that now behaves.

Every finance team eventually needs a database — usually the day a number that "must be right" can't be explained.