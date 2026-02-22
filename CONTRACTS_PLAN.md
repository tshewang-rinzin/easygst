# Contracts & Project-Based Invoicing — Options & Implementation Plan

## The Problem

Currently, invoicing works well for **products** (qty × unit price). But for **services**, you need:

1. **Project-based billing** — e.g., "System Development" with progress invoicing (10%, 20%, etc.)
2. **AMC (Annual Maintenance Contracts)** — recurring periodic billing (quarterly, half-yearly, yearly)

Both require tracking a **contract value** and issuing **multiple invoices** against it over time.

---

## Option A: Unified "Contracts" Module (⭐ Recommended)

A single **Contracts** module that handles both project billing and AMC with a `type` field.

### How It Works

**Contract types:**
- `project` — One-time project with milestone/progress billing
- `amc` — Recurring maintenance contract with periodic billing

**Core concept:** A Contract has a total value. You create invoices against it, either by milestone/percentage (projects) or by billing schedule (AMC).

### Data Model

```
contracts
├── id, teamId, customerId
├── type: 'project' | 'amc'
├── contractNumber: "CTR-2026-0001"
├── name: "ERP System Development" / "Annual Server Maintenance"
├── description
├── totalValue: 1,000,000
├── currency: BTN
├── startDate, endDate
├── status: draft | active | completed | cancelled
│
├── # For AMC
├── billingFrequency: monthly | quarterly | half_yearly | yearly | custom
├── billingAmount: 250,000 (auto-calculated or manual override)
├── nextBillingDate
├── autoCreateInvoice: false (just reminders by default)
│
├── # Tax
├── taxRate, isTaxExempt
│
├── # Tracking
├── totalInvoiced: 300,000 (sum of all invoices)
├── totalPaid: 200,000
├── remainingValue: 700,000
├── completionPercent: 30%
│
├── notes, terms
├── createdAt, updatedAt, createdBy

contract_milestones (for projects)
├── id, contractId
├── name: "Phase 1 - Requirements"
├── description
├── percentage: 20 (or fixed amount)
├── amount: 200,000
├── dueDate (expected)
├── status: pending | invoiced | paid
├── invoiceId (linked when invoiced)
├── sortOrder

contract_billing_schedule (for AMC)
├── id, contractId
├── periodStart, periodEnd
├── amount: 250,000
├── status: pending | invoiced | paid
├── invoiceId (linked when invoiced)
├── dueDate
```

**Invoices table gets:**
```
contractId: uuid (nullable) — links invoice to contract
contractMilestoneId: uuid (nullable) — links to specific milestone
contractBillingScheduleId: uuid (nullable) — links to specific AMC period
```

### User Flow — Project Billing

1. **Create Contract** (type: project)
   - Customer: ABC Corp
   - Name: "ERP System Development"
   - Total Value: Nu 1,000,000
   - Add milestones:
     - Phase 1 — Requirements (20%) → Nu 200,000
     - Phase 2 — Development (40%) → Nu 400,000
     - Phase 3 — Testing (20%) → Nu 200,000
     - Phase 4 — Go-live (20%) → Nu 200,000

2. **Invoice from Contract**
   - Go to contract → Click "Create Invoice"
   - Select milestone (Phase 1) → auto-fills line item: "ERP System Development - Phase 1 - Requirements" @ Nu 200,000
   - Or enter custom percentage: 15% → Nu 150,000
   - Invoice created, linked to contract

3. **Track Progress**
   - Contract view shows: 20% invoiced, 0% paid, Nu 800,000 remaining
   - Each milestone shows status badge (pending / invoiced / paid)

### User Flow — AMC Billing

1. **Create Contract** (type: amc)
   - Customer: XYZ Ltd
   - Name: "Annual Server Maintenance 2026"
   - Total Value: Nu 120,000/year
   - Billing: Quarterly (Nu 30,000 per quarter)
   - Start: Jan 1, 2026 — End: Dec 31, 2026
   - Auto-generates 4 billing schedule entries:
     - Q1 (Jan-Mar): Nu 30,000 — Due: Jan 1
     - Q2 (Apr-Jun): Nu 30,000 — Due: Apr 1
     - Q3 (Jul-Sep): Nu 30,000 — Due: Jul 1
     - Q4 (Oct-Dec): Nu 30,000 — Due: Oct 1

2. **Invoice from AMC**
   - Go to contract → See upcoming billing periods
   - Click "Create Invoice" on Q1 → auto-creates invoice for Nu 30,000
   - Or bulk-create all 4 invoices at once

3. **Track & Renew**
   - Dashboard shows: upcoming AMC billings this month
   - When contract expires, option to "Renew" (creates new contract for next year)

### Pros
- ✅ Single module for both use cases
- ✅ Clean data model — contracts → milestones/schedules → invoices
- ✅ Full audit trail of what's invoiced vs remaining
- ✅ AMC renewal workflow
- ✅ Dashboard can show "upcoming billings" across all contracts
- ✅ Flexible — milestones can be percentage OR fixed amount
- ✅ Invoices stay linked to contracts for reporting

### Cons
- ⚠️ More complex to build (2-3 days vs 1 day for simpler options)
- ⚠️ Two sub-types in one module (but cleanly separated by `type`)

---

## Option B: Separate "Projects" + "AMC" Modules

Two independent modules with their own pages and data models.

### Projects Module
- Dedicated `/projects` section
- Project with milestones and progress tracking
- "Create Invoice from Project" button

### AMC Module
- Dedicated `/amc` or `/maintenance-contracts` section
- Contract with billing schedule
- "Create Invoice from AMC" button

### Pros
- ✅ Each module is simpler and more focused
- ✅ Easier to understand conceptually

### Cons
- ❌ Duplicate code (both need contract value tracking, invoice linking, progress calculation)
- ❌ Two separate navigation items
- ❌ Harder to get a unified "upcoming billings" view
- ❌ More tables (projects, project_milestones, amc_contracts, amc_schedules)

---

## Option C: Enhanced Invoice Form Only (Minimal)

No new module. Just add a "percentage-based" line item type to the existing invoice form.

### How It Works
- When creating an invoice, you can enter a line item like:
  - Description: "System Development - Phase 1"
  - Base Value: 1,000,000
  - Percentage: 20%
  - Calculated Amount: 200,000

### Pros
- ✅ Fastest to implement (few hours)
- ✅ No new tables or pages

### Cons
- ❌ No contract tracking — can't see "how much of this project has been invoiced"
- ❌ No AMC schedule management
- ❌ No progress visibility or renewal workflows
- ❌ Easy to over-invoice (no guard against exceeding 100%)
- ❌ Basically just a calculator, not a system

---

## Recommendation: Option A (Unified Contracts)

For a business like CloudBhutan doing both system development and AMC, Option A gives you:

1. **One place** to manage all contracts (projects + AMC)
2. **Automatic guard rails** — can't invoice more than contract value
3. **Billing reminders** — see what's due this month across all contracts
4. **Clean invoicing** — one click to create invoice from milestone or billing period
5. **Renewal workflow** — easily renew AMC contracts each year
6. **Reporting** — contract-level P&L, outstanding amounts, billing pipeline

### Implementation Phases

**Phase 1 — Database & Core (Day 1)**
- New tables: `contracts`, `contract_milestones`, `contract_billing_schedule`
- Add `contractId` to invoices table
- Migration

**Phase 2 — Contract CRUD & UI (Day 1-2)**
- Create/edit contract form (with type toggle: Project vs AMC)
- Milestone editor for projects (add/remove/reorder)
- Auto-generate billing schedule for AMC
- Contract list page with filters (type, status, customer)
- Contract detail page with progress visualization

**Phase 3 — Invoice from Contract (Day 2)**
- "Create Invoice" from contract (picks milestone or billing period)
- Auto-populate invoice line items from contract
- Validation: can't exceed remaining contract value
- Link invoice back to contract/milestone/schedule
- Update contract totals when invoice is created/paid

**Phase 4 — Dashboard & Reporting (Day 3)**
- "Upcoming Billings" widget on dashboard
- Contract summary report (active contracts, total value, invoiced, outstanding)
- AMC renewal reminders
- Overdue milestone alerts

### Navigation

```
Dashboard
├── Invoices
├── Contracts          ← NEW
│   ├── All Contracts
│   ├── Projects
│   └── AMC
├── Customers
├── Products
├── Purchases
├── Payments
├── Reports
└── Settings
```

---

## Questions Before Implementation

1. **Milestones** — Do you always define milestones upfront, or do you sometimes just invoice ad-hoc percentages as work progresses?
2. **AMC billing** — Is it always equal installments (e.g., 4 × 25%), or do you sometimes have uneven splits?
3. **Tax on contracts** — Same tax rate for all milestones/periods, or can it vary?
4. **Contract numbering** — Do you want a separate sequence (CTR-2026-0001) or is any naming fine?
5. **Renewal** — When renewing AMC, should it copy all terms from the previous contract?

---

*Awaiting your decision, Boss.*
