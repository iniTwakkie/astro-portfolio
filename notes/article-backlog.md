# Article backlog

This is the working editorial backlog for future posts on danienell.com. It is
kept outside `src/content/blog`, so none of these ideas are published until a
finished article is moved into the blog collection.

## Editorial direction

Position the blog around a finance leader and builder working at the
intersection of finance, data, and software.

Suggested mix:

- 60% finance, data, and systems
- 25% software, homelab, and infrastructure
- 15% DIY, personal experiments, and unusual builds

Suggested future topics:

- **Finance Engineering** — Xero, FP&A, Power BI, modelling, SQL, and automation
- **Building Software** — dplan, CardCode, FastAPI, React, and PostgreSQL
- **Homelab** — Proxmox, Docker, Tailscale, UniFi, and networking
- **Projects & Experiments** — DIY, household automation, personal finance, and
  other builds

The connecting idea is that Danie builds systems: finance systems, software,
servers, and physical things.

## Next 10 articles

### 1. How I Built a Modern FP&A Stack with Xero, SQL, Power BI and Google Sheets

**Priority:** Flagship

**Core argument:** Xero is the source of truth, but not the analytical layer. A
modern FP&A stack separates ingestion, modelling, human input, and reporting.

**Architecture:**

```text
Xero ------+
           |
HubSpot ---+-- Fivetran --> SQL --> Power BI
           |                  ^
           |                  |
Google Sheets -- Budget / Forecast
```

**Outline:**

- The limitations of static monthly management accounts
- Why SQL sits between the source systems and Power BI
- Why Power BI does not query Xero directly
- Normalising Xero journal data
- Chart-of-accounts and tracking-category mappings
- Actual, budget, and forecast fact tables
- Dimensional modelling and the star schema
- Rolling forecast calculations in DAX
- Transaction-level drill-through and Xero backlinks
- HubSpot reconciliation controls
- What I would change if I rebuilt the stack

**Positioning:** An accountant who can design finance systems, not merely a
finance professional who knows Power BI.

### 2. How I Automated Sales Commissions Across HubSpot, Xero and Google Sheets

**Priority:** Flagship

**Core argument:** The spreadsheet was not the real problem; the underlying data
architecture was.

**System:** HubSpot -> Xero -> Fivetran -> SQL -> Make.com -> Apps Script ->
Google Sheets.

**Outline:**

- The operational problem and why a spreadsheet alone could not solve it
- Combining CRM and accounting data
- Reconciling HubSpot deals to Xero invoices
- Building the central SQL model
- Supporting reporting hierarchies and multiple commercial roles
- Quota attainment, accelerators, and commission rules
- Using Google Sheets as the familiar user interface
- Keeping calculation and data logic centrally governed
- Controls, exception handling, and lessons learned

### 3. Why Every Finance Team Eventually Needs a Database

**Priority:** High

**Core argument:** Excel is useful; using Excel as the system of record is the
problem.

**Outline:**

- The point at which spreadsheets stop scaling
- Auditability, repeatability, and a shared source of truth
- What belongs in a database and what should remain in spreadsheets
- A practical migration path for a small finance team
- Why SQL often gives accountants more immediate leverage than Python

**Alternative title:** Excel Isn't the Problem — Using Excel as a Database Is

### 4. Star Schema for Finance: How I Model Xero Accounting Data

**Priority:** High; strong niche search topic

**Outline:**

- Choosing the grain: the journal line
- Fact tables and dimensions for finance data
- Accounts, entities, dates, contacts, and tracking categories
- Reporting hierarchies and mapping tables
- Preventing journal-line duplication
- Actual, budget, and forecast modelling
- Why a clean model makes DAX and reporting simpler

### 5. Why I Still Use Google Sheets in a Modern FP&A Stack

**Priority:** High; practical and mildly contrarian

**Core argument:** Use databases for governed data and Sheets for human
interaction. Sheets is the UI, not the database.

```text
                   +-- Power BI
                   |
Xero --> SQL warehouse
                   |
                   +-- Google Sheets
                          ^
                          |
                      human input
```

**Outline:**

- Why eliminating spreadsheets is the wrong goal
- Where Sheets excels: input, review, collaboration, and familiarity
- Where Sheets fails: governance, scale, and system-of-record logic
- Separating calculations from interaction
- How budgets and forecasts flow into the warehouse
- Guardrails that keep the model reliable

### 6. Building dplan, Part 1: Why I'm Building My Own FP&A Platform

**Priority:** High; start before the product is finished

**Outline:**

- The workflow problems dplan is intended to solve
- Why existing tools and spreadsheets were not enough
- Product principles for actuals, budgets, rolling forecasts, and scenarios
- Why React, TypeScript, FastAPI, and PostgreSQL
- Xero connectivity and transaction drill-through
- The boundary between a personal project and a viable product
- What success looks like for the first version

### 7. Xero -> Fivetran -> SQL: Building a Finance Data Warehouse

**Priority:** High

**Outline:**

- Why put a warehouse between Xero and reporting
- Fivetran versus building a custom Xero ETL
- Understanding and normalising the source tables
- Modelling journals and tracking categories
- Mapping and slowly changing finance structures
- Data quality and reconciliation checks
- Serving Power BI and Google Sheets from the same governed layer

### 8. How I Built Rolling Forecasts in Power BI

**Priority:** High

**Outline:**

- Actuals, budgets, forecasts, and rolling forecasts
- Automatically backfilling completed periods with actuals
- Designing compatible fact tables
- Key DAX calculations and filter context
- Handling year boundaries and forecast versions
- Drill-through and validation
- What should live in SQL versus Power BI

### 9. Accountants Should Learn SQL Before Python

**Priority:** High; good LinkedIn companion article

**Core progression:**

```text
Excel -> Power Query -> SQL -> Data modelling -> Python -> Software engineering
```

**Outline:**

- Why SQL solves common finance problems quickly
- Querying, joining, aggregating, and validating finance data
- How SQL teaches data structure and grain
- When Python becomes the better tool
- A practical learning path for accountants

### 10. Finance Teams Don't Need More Dashboards — They Need Better Data Models

**Priority:** High; opinion/positioning article

**Core comparison:**

```text
Fragile: Xero -> Power BI -> hundreds of lines of DAX

Better:  Xero -> warehouse -> clean facts and dimensions -> simple DAX -> Power BI
```

**Outline:**

- Why dashboards often expose rather than solve data problems
- The cost of hiding business logic inside reports
- Account mappings, reporting hierarchies, tracking mappings, and entity
  relationships
- What belongs in the data layer
- Why clean models make reporting faster, simpler, and more trustworthy

## Finance data warehouse series

The warehouse material can also be published as a linked series:

1. Why I Put a Database Between Xero and Power BI
2. How I Model Xero Journals in SQL
3. Designing a Star Schema for Accounting Data
4. Handling Xero Tracking Categories in a Data Warehouse
5. Building Management Accounts on Top of the Model

## Building dplan series

1. Why I'm Building dplan
2. Designing the Database
3. Integrating Xero
4. Modelling Actuals
5. Building Budgets and Forecasts
6. Designing a Rolling Forecast Engine
7. What I Got Wrong

The series should document the build while it is happening rather than waiting
for the product to be complete.

## Additional long-form ideas

- Stop Building Management Accounts in Excel: How I Built Mine in Power BI
- Building a Finance Data Warehouse from Xero: What I Learned
- Why Finance Teams Should Learn Data Modelling, Not Just Power BI
- Xero -> Fivetran -> SQL -> Power BI: My Finance Data Pipeline
- Reconciling HubSpot Deals Against Xero Invoices Automatically
- What Learning Software Engineering Changed About How I Work in Finance
- The Modern FP&A Tech Stack I'd Build From Scratch
- Should Finance Teams Build Their Own Software?
- The Difference Between a Finance Analyst and a Finance Engineer
- What Does a Finance Engineer Actually Do?
- Why Accountants Make Surprisingly Good Data Engineers

## Finance Engineering Notes

Short, focused posts of roughly 500–1,000 words:

- Combining multiple `IMPORTRANGE`s in Google Sheets
- Commenting complex Google Sheets formulas
- Building Xero transaction hyperlinks from Power BI
- Modelling Xero tracking categories
- Fixing journal-line duplication
- SQL views versus Power BI transformations
- Fivetran versus writing a custom Xero ETL
- Power BI Gateway and self-hosted databases
- Connecting Power BI Service to PostgreSQL
- Handling slowly changing finance mappings
- Budget versus forecast versus rolling forecast modelling
- Why journal line ID should be the grain of the fact table

## Article template

Use this structure when turning a backlog item into a draft:

1. The business problem
2. Constraints and requirements
3. Architecture
4. Key design decisions and reasoning
5. Implementation
6. Controls and validation
7. Trade-offs
8. Result
9. What I would change next time

Where useful, create a shorter LinkedIn version that presents the core lesson
and links to the full technical walkthrough on danienell.com.
