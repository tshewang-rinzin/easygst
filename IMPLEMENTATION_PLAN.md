# Implementation Plan: Bhutan Sales Tax Invoice System for SMEs

## Executive Summary

Transform this Next.js SaaS starter into a production-ready invoice management system compliant with Bhutan's Sales Tax regulations (Department of Revenue and Customs). Replace Stripe subscriptions with comprehensive invoice functionality.

## Key Requirements

✅ **Replace Stripe entirely** - Remove subscription system, build pure invoice management
✅ **One-time invoices** - Not recurring subscriptions
✅ **Hybrid payments** - Both manual tracking AND online payment integration
✅ **Sales Tax compliance** - Bhutan uses Sales Tax (0%/30%/50%), NOT GST
✅ **Multi-currency** - Support BTN, INR, USD
✅ **Multi-channel delivery** - Email, WhatsApp, SMS
✅ **Tax flexibility** - Tax-exempt items, per-item tax overrides
✅ **Smart entry** - Autocomplete, dynamic product catalog

## Bhutan Tax System Context

⚠️ **IMPORTANT**: Bhutan uses **Sales Tax**, NOT GST:
- **Tax Rates**: 50% (luxury), 30% (mid-tier), 0% (essentials)
- **Tax Authority**: Department of Revenue and Customs (DRC)
- **Mandatory Fields**: Business TPN, sequential invoice numbers, tax breakdown
- **Compliance**: Gap-free numbering, 5-7 year retention, immutability after sending

---

## Current Progress

### ✅ Phase 1: Database Foundation (COMPLETED)

**Status**: All database tables created and migrated

#### 1.1 Schema Changes

**File**: `/lib/db/schema.ts`

**REMOVED from teams table:**
- stripeCustomerId
- stripeSubscriptionId
- stripeProductId
- planName
- subscriptionStatus

**ADDED to teams table:**
```typescript
// Business Information (DRC Compliance)
businessName: varchar('business_name', { length: 255 }),
tpn: varchar('tpn', { length: 20 }).unique(), // Tax Payer Number
licenseNumber: varchar('license_number', { length: 50 }),
address: text('address'),
city: varchar('city', { length: 100 }),
dzongkhag: varchar('dzongkhag', { length: 100 }), // District
postalCode: varchar('postal_code', { length: 20 }),
phone: varchar('phone', { length: 20 }),
email: varchar('email', { length: 255 }),
website: varchar('website', { length: 255 }),

// Banking & Currency
defaultCurrency: varchar('default_currency', { length: 3 }).default('BTN'),
bankName: varchar('bank_name', { length: 100 }),
bankAccountNumber: varchar('bank_account_number', { length: 50 }),
bankAccountName: varchar('bank_account_name', { length: 255 }),
bankBranch: varchar('bank_branch', { length: 100 }),

// Invoice Settings
invoicePrefix: varchar('invoice_prefix', { length: 20 }).default('INV'),
invoiceTerms: text('invoice_terms'),
invoiceFooter: text('invoice_footer'),
logoUrl: text('logo_url')
```

#### 1.2 New Tables Created

1. **customers** - Client information with TPN
   - Fields: teamId, name, contactPerson, email, phone, mobile, tpn, address, city, dzongkhag, postalCode, notes
   - Indexes: teamId, email

2. **products** - Product/service catalog
   - Fields: teamId, name, description, sku, unit, unitPrice, defaultTaxRate, isTaxExempt, category, isActive
   - Indexes: teamId, sku

3. **invoices** - Main invoice records
   - Fields: teamId, customerId, invoiceNumber, invoiceDate, dueDate, currency, subtotal, totalTax, totalDiscount, totalAmount, amountPaid, amountDue, status, paymentStatus, isLocked
   - Unique index: (teamId, invoiceNumber)

4. **invoiceItems** - Line items with per-item tax override
   - Fields: invoiceId, productId, description, quantity, unit, unitPrice, discountPercent, discountAmount, taxRate, taxAmount, isTaxExempt, itemTotal, sortOrder

5. **payments** - Payment tracking
   - Fields: teamId, invoiceId, amount, currency, paymentDate, paymentMethod, paymentGateway, transactionId, bankName, chequeNumber, notes, receiptNumber

6. **taxSettings** - Tax rate configurations
   - Fields: teamId, taxName, taxRate, taxType, category, isDefault, isActive

7. **invoiceDeliveries** - Email/WhatsApp/SMS tracking
   - Fields: invoiceId, deliveryMethod, recipient, status, sentAt, deliveredAt, failedAt, externalId, errorMessage

8. **invoiceSequences** - Gap-free numbering (concurrency-safe)
   - Fields: teamId, year, lastNumber, lockedAt, lockedBy

#### 1.3 Migration Status

- ✅ Manual migration created: `lib/db/migrations/0001_invoice_system.sql`
- ✅ Migration applied successfully
- ✅ All Stripe columns removed
- ✅ All new tables created with indexes

### ✅ Phase 2: Core Modules (COMPLETED)

#### 2.1 Business Settings Module

**Files created:**
- ✅ `/lib/teams/actions.ts` - Business settings CRUD
- ✅ `/app/(dashboard)/dashboard/business/page.tsx` - Settings UI
- ✅ `/components/ui/textarea.tsx` - Missing UI component

**Features:**
- Configure TPN, business name, address, banking details
- Set default currency, invoice prefix, terms & conditions
- Three-section form: Business Info, Banking Details, Invoice Settings

#### 2.2 Customer Management Module

**Files created:**
- ✅ `/lib/customers/validation.ts` - Zod schemas
- ✅ `/lib/customers/actions.ts` - CRUD server actions
- ✅ `/lib/customers/queries.ts` - Database queries
- ✅ `/app/(dashboard)/customers/page.tsx` - Customer list with search
- ✅ `/app/(dashboard)/customers/new/page.tsx` - Create customer
- ✅ `/app/(dashboard)/customers/[id]/page.tsx` - Edit customer with delete
- ✅ `/components/customers/customer-form.tsx` - Reusable form
- ✅ `/app/api/customers/[id]/route.ts` - API endpoint

**Features:**
- Create/edit/delete customers (soft delete)
- Track customer TPN, contact info (phone/mobile for SMS/WhatsApp), address
- Search by name, email, mobile
- Activity logging for all operations

#### 2.3 Product Catalog Module

**Files created:**
- ✅ `/lib/products/validation.ts` - Zod schemas
- ✅ `/lib/products/actions.ts` - CRUD server actions
- ✅ `/lib/products/queries.ts` - Database queries with search
- ✅ `/app/(dashboard)/products/page.tsx` - Product list with search
- ✅ `/app/(dashboard)/products/new/page.tsx` - Create product
- ✅ `/app/(dashboard)/products/[id]/page.tsx` - Edit product with delete
- ✅ `/components/products/product-form.tsx` - Three-section form
- ✅ `/app/api/products/[id]/route.ts` - API endpoint

**Features:**
- Manage products/services with SKU, unit price, description, category
- Set default tax rate (0%, 30%, 50%) or tax-exempt flag
- 12 unit options: piece, box, kg, g, liter, ml, meter, hour, day, month, service, other
- Search by name, SKU, description

#### 2.4 Navigation & Layout

**Files modified:**
- ✅ `/app/(dashboard)/layout.tsx` - Sidebar navigation with 7 sections
- ✅ `/app/page.tsx` - Public home page (moved from dashboard)
- ✅ `/middleware.ts` - Updated to protect all dashboard routes

**Navigation Menu:**
- Dashboard
- Invoices
- Customers
- Products
- Payments
- Reports
- Settings (Business Settings)

#### 2.5 Stripe Cleanup

**Files deleted:**
- ✅ `/lib/payments/stripe.ts`
- ✅ `/app/api/stripe/` directory
- ✅ `/app/(dashboard)/pricing/` directory

**Files modified:**
- ✅ `/lib/payments/actions.ts` - Replaced with placeholder for Phase 4
- ✅ `/app/(login)/actions.ts` - Removed checkout redirects
- ✅ `/lib/db/seed.ts` - Removed Stripe product creation
- ✅ `/package.json` - Removed stripe package

**Dependencies added:**
- @react-pdf/renderer (4.3.2)
- decimal.js (10.6.0)
- resend (6.6.0)
- twilio (5.11.1)

---

## 📋 Phase 3: Invoice Engine (NEXT - IN PROGRESS)

### 3.1 Core Invoice Logic

**Critical files to create:**

#### `/lib/invoices/numbering.ts`
- Generate sequential invoice numbers (INV-2026-0001)
- Use database transaction with row-level locking (`SELECT FOR UPDATE`)
- Ensures gap-free numbering even with concurrent requests
```typescript
export async function generateInvoiceNumber(
  teamId: number,
  prefix: string = 'INV'
): Promise<string> {
  // 1. Start transaction
  // 2. Lock invoiceSequences row for this team/year
  // 3. Get lastNumber, increment by 1
  // 4. Update lastNumber in database
  // 5. Commit transaction
  // 6. Return formatted number: INV-2026-0001
}
```

#### `/lib/invoices/calculations.ts`
- Calculate line totals: quantity × unitPrice
- Apply discounts: subtotal × discountPercent / 100
- Calculate tax: (subtotal - discount) × taxRate / 100
- Support tax-exempt items and per-item tax overrides
- Aggregate invoice totals: subtotal, totalTax, totalDiscount, totalAmount
```typescript
export function calculateLineItem(item: {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate: number;
  isTaxExempt: boolean;
}): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  itemTotal: number;
}

export function calculateInvoiceTotals(items: InvoiceItem[]): {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
}
```

#### `/lib/invoices/validation.ts`
- Zod schemas for invoice and invoice items
- Validate tax rates (0-100%), quantities (>0), prices (≥0)
- Ensure at least one invoice item
```typescript
export const invoiceItemSchema = z.object({
  productId: z.number().optional(),
  description: z.string().min(1).max(500),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().min(0).max(100),
  isTaxExempt: z.boolean().default(false),
  unit: z.string().max(50).default('piece')
});

export const invoiceSchema = z.object({
  customerId: z.number(),
  invoiceDate: z.date(),
  dueDate: z.date().optional(),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  items: z.array(invoiceItemSchema).min(1),
  paymentTerms: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  customerNotes: z.string().max(1000).optional()
});
```

#### `/lib/invoices/actions.ts`
- `createInvoice()` - Generate number, calculate totals, create invoice + items in transaction
- `updateInvoice()` - Only allow if status = 'draft' and not locked
- `sendInvoice()` - Lock invoice (set isLocked = true), update status to 'sent'
- `deleteInvoice()` - Soft delete (only drafts)
```typescript
export const createInvoice = validatedActionWithUser(
  invoiceSchema,
  async (data, _, user) => {
    const team = await getTeamForUser();

    // 1. Generate invoice number (concurrency-safe)
    const invoiceNumber = await generateInvoiceNumber(team.id, team.invoicePrefix);

    // 2. Calculate all line items
    const calculatedItems = data.items.map(calculateLineItem);

    // 3. Calculate invoice totals
    const totals = calculateInvoiceTotals(calculatedItems);

    // 4. Create invoice + items in transaction
    await db.transaction(async (tx) => {
      const [invoice] = await tx.insert(invoices).values({
        teamId: team.id,
        customerId: data.customerId,
        invoiceNumber,
        ...totals,
        status: 'draft',
        paymentStatus: 'unpaid'
      }).returning();

      await tx.insert(invoiceItems).values(
        calculatedItems.map((item, index) => ({
          invoiceId: invoice.id,
          ...item,
          sortOrder: index
        }))
      );
    });

    // 5. Log activity
    // 6. Revalidate paths
    return { success: 'Invoice created', invoiceId: invoice.id };
  }
);
```

#### `/lib/invoices/queries.ts`
- `getInvoices()` - List with filters (status, date range, customer)
- `getInvoiceWithDetails()` - Full invoice with customer, items, payments (for display/PDF)
- `getOverdueInvoices()` - Where dueDate < now() AND paymentStatus != 'paid'
```typescript
export async function getInvoiceWithDetails(id: number) {
  const team = await getTeamForUser();

  const [invoice] = await db
    .select({
      invoice: invoices,
      customer: customers,
      items: invoiceItems,
      payments: payments
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
    .leftJoin(payments, eq(invoices.id, payments.invoiceId))
    .where(and(
      eq(invoices.id, id),
      eq(invoices.teamId, team.id)
    ));

  return invoice;
}
```

### 3.2 Invoice UI

**Files to create:**

#### `/app/(dashboard)/invoices/page.tsx`
- Invoice list with filters (status, date range, customer)
- Grid or table view showing:
  - Invoice number, customer name, date, due date
  - Total amount, amount due, status badges
  - Quick actions: View, Edit, Send, Mark as Paid
- Search by invoice number, customer name
- Status filter: All, Draft, Sent, Viewed, Paid, Overdue, Cancelled

#### `/app/(dashboard)/invoices/new/page.tsx`
- Create invoice form
- Customer selector (autocomplete)
- Dynamic line items (add/remove rows)
- Product autocomplete per row
- Real-time total calculation
- Payment terms, customer notes, internal notes

#### `/app/(dashboard)/invoices/[id]/page.tsx`
- View invoice with full details
- Customer info, line items table, totals breakdown
- Payment history
- Delivery tracking (email/WhatsApp/SMS sent)
- Actions: Edit (if draft), Send, Download PDF, Record Payment, Delete

#### `/app/(dashboard)/invoices/[id]/edit/page.tsx`
- Edit invoice (only if status = 'draft' and not locked)
- Same form as create
- Pre-filled with existing data

#### `/components/invoices/invoice-form.tsx`
- Main form component (reusable for create/edit)
- Customer selector with autocomplete
- Date pickers for invoice date, due date
- Currency selector (BTN, INR, USD)
- Line items section with dynamic rows
- Payment terms textarea
- Customer notes textarea
- Internal notes textarea

#### `/components/invoices/invoice-item-row.tsx`
- Single line item row component
- Product autocomplete (searches catalog + history)
- Quantity, unit, unit price inputs
- Discount percent input
- Tax rate select with override
- Tax-exempt checkbox
- Calculated subtotal, tax, total (read-only)
- Remove row button

#### `/components/invoices/product-autocomplete.tsx`
- Search dropdown for products
- Shows: Product name, SKU, unit price
- Filters catalog + recent invoice items
- Suggests adding new items to catalog
- On select: populates description, unit, price, tax rate

**Features:**
- Dynamic line items (add/remove rows)
- Product autocomplete with suggestions from catalog + history
- Per-item tax override (can change tax rate for specific items)
- Tax-exempt checkbox per item
- Real-time total calculation (using calculations.ts)
- "Add to catalog" prompt for new items
- Multi-currency selector
- Payment terms, customer notes, internal notes
- Validation: at least 1 item, valid quantities/prices

---

## 📋 Phase 4: PDF & Payments (PENDING)

### 4.1 PDF Generation

**Dependencies installed:**
- ✅ @react-pdf/renderer (4.3.2)
- ✅ decimal.js (10.6.0)

**Files to create:**

#### `/lib/pdf/templates/invoice-template.tsx`
- DRC-compliant PDF layout using @react-pdf/renderer
- Header: Business logo, name, TPN, address, contact
- Invoice details: Number, date, due date, type
- Customer section: Name, TPN, address, contact
- Line items table with columns:
  - Description
  - Qty
  - Unit
  - Unit Price
  - Discount
  - Tax Rate
  - Tax Amount
  - Total
- Totals section:
  - Subtotal
  - Total Discount
  - Tax breakdown by rate (0%, 30%, 50%)
  - Grand Total
- Payment info: Terms, bank details, currency
- Footer: Terms & conditions, authorized signature

#### `/lib/pdf/generator.ts`
- PDF generation function
- Accepts invoice with full details
- Returns PDF buffer or stream
```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceTemplate } from './templates/invoice-template';

export async function generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  const pdfDoc = <InvoiceTemplate invoice={invoice} />;
  return await renderToBuffer(pdfDoc);
}
```

#### `/app/api/invoices/[id]/pdf/route.ts`
- PDF download API endpoint
- Generates PDF on-demand
- Sets proper headers for download
- Tracks PDF generation in activity logs
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoice = await getInvoiceWithDetails(parseInt(params.id));
  const pdfBuffer = await generateInvoicePDF(invoice);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    }
  });
}
```

**PDF must include (DRC compliance):**
- Business: Name, TPN, License Number, Address, Contact
- Invoice: Number, Date, Due Date, Type
- Customer: Name, TPN (if applicable), Address
- Line items table with all required columns
- Totals: Subtotal, Total Discount, Total Tax (breakdown by rate), Grand Total
- Payment: Terms, Bank Details, Currency
- Footer: Terms & Conditions, Authorized Signature

### 4.2 Payment Recording

**File to update:**
- `/lib/payments/actions.ts` - Currently has placeholders

**New payment actions:**
```typescript
export const recordPayment = validatedActionWithUser(
  paymentSchema,
  async (data, _, user) => {
    const { invoiceId, amount, paymentMethod, paymentDate, ...rest } = data;

    // 1. Get invoice
    const invoice = await getInvoiceById(invoiceId);

    // 2. Validate payment doesn't exceed amountDue
    if (amount > parseFloat(invoice.amountDue)) {
      return { error: 'Payment exceeds amount due' };
    }

    // 3. Create payment record
    await db.insert(payments).values({
      teamId: team.id,
      invoiceId,
      amount: amount.toString(),
      paymentMethod,
      paymentDate,
      ...rest
    });

    // 4. Update invoice amounts
    const newAmountPaid = parseFloat(invoice.amountPaid) + amount;
    const newAmountDue = parseFloat(invoice.totalAmount) - newAmountPaid;
    const newPaymentStatus = newAmountDue === 0 ? 'paid' : 'partial';
    const newStatus = newAmountDue === 0 ? 'paid' : invoice.status;

    await db.update(invoices).set({
      amountPaid: newAmountPaid.toString(),
      amountDue: newAmountDue.toString(),
      paymentStatus: newPaymentStatus,
      status: newStatus
    }).where(eq(invoices.id, invoiceId));

    return { success: 'Payment recorded' };
  }
);

export const deletePayment = validatedActionWithUser(
  deletePaymentSchema,
  async (data, _, user) => {
    // Reverse payment amounts on invoice
    // Delete payment record
    // Log activity
  }
);
```

**Payment methods supported:**
- cash
- bank_transfer
- online
- cheque

**Logic:**
- Validate payment doesn't exceed amountDue
- Update invoice.amountPaid = amountPaid + newPayment
- Update invoice.amountDue = totalAmount - amountPaid
- Update invoice.paymentStatus = 'paid' | 'partial' | 'unpaid'
- If fully paid, set invoice.status = 'paid'

---

## 📋 Phase 5: Delivery Channels (PENDING)

### 5.1 Email Integration

**Dependencies installed:**
- ✅ resend (6.6.0)

**Environment variables needed:**
```env
RESEND_API_KEY=re_***
BASE_URL=http://localhost:3000
```

**Files to create:**

#### `/lib/notifications/email.ts`
- Send invoice via email using Resend
- Attach PDF invoice
- Track delivery status in invoiceDeliveries table
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(
  invoice: InvoiceWithDetails,
  recipientEmail: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // 1. Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoice);

  // 2. Generate public link
  const publicToken = await generatePublicInvoiceToken(invoice.id);
  const publicLink = `${process.env.BASE_URL}/public-invoice/${publicToken}`;

  // 3. Send email with Resend
  const { data, error } = await resend.emails.send({
    from: 'invoices@yourdomain.com',
    to: recipientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from ${invoice.team.businessName}`,
    html: `
      <h1>Invoice ${invoice.invoiceNumber}</h1>
      <p>Total: ${invoice.currency} ${invoice.totalAmount}</p>
      <p>Due Date: ${invoice.dueDate}</p>
      <p><a href="${publicLink}">View Invoice Online</a></p>
    `,
    attachments: [{
      filename: `invoice-${invoice.invoiceNumber}.pdf`,
      content: pdfBuffer
    }]
  });

  // 4. Track delivery
  await db.insert(invoiceDeliveries).values({
    invoiceId: invoice.id,
    deliveryMethod: 'email',
    recipient: recipientEmail,
    status: error ? 'failed' : 'sent',
    externalId: data?.id,
    errorMessage: error?.message
  });

  return { success: !error, messageId: data?.id, error: error?.message };
}
```

#### `/lib/invoices/tokens.ts`
- Generate secure public links for invoices
- JWT tokens with 90-day expiry
```typescript
import jwt from 'jsonwebtoken';

export async function generatePublicInvoiceToken(invoiceId: number): Promise<string> {
  const token = jwt.sign(
    { invoiceId, type: 'public-invoice' },
    process.env.AUTH_SECRET!,
    { expiresIn: '90d' }
  );
  return token;
}

export async function verifyPublicInvoiceToken(token: string): Promise<{ invoiceId: number } | null> {
  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as { invoiceId: number; type: string };
    if (decoded.type !== 'public-invoice') return null;
    return { invoiceId: decoded.invoiceId };
  } catch {
    return null;
  }
}
```

### 5.2 WhatsApp Integration

**Dependencies installed:**
- ✅ twilio (5.11.1)

**Environment variables needed:**
```env
TWILIO_ACCOUNT_SID=***
TWILIO_AUTH_TOKEN=***
WHATSAPP_PHONE_NUMBER=+975********
```

**File to create:**

#### `/lib/notifications/whatsapp.ts`
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendInvoiceWhatsApp(
  invoice: InvoiceWithDetails,
  recipientPhone: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // 1. Generate public link
  const publicToken = await generatePublicInvoiceToken(invoice.id);
  const publicLink = `${process.env.BASE_URL}/public-invoice/${publicToken}`;

  // 2. Send WhatsApp message
  const message = await client.messages.create({
    from: `whatsapp:${process.env.WHATSAPP_PHONE_NUMBER}`,
    to: `whatsapp:${recipientPhone}`,
    body: `Invoice ${invoice.invoiceNumber} from ${invoice.team.businessName}\n\nTotal: ${invoice.currency} ${invoice.totalAmount}\nDue: ${invoice.dueDate}\n\nView: ${publicLink}`
  });

  // 3. Track delivery
  await db.insert(invoiceDeliveries).values({
    invoiceId: invoice.id,
    deliveryMethod: 'whatsapp',
    recipient: recipientPhone,
    status: message.status === 'sent' ? 'sent' : 'failed',
    externalId: message.sid
  });

  return { success: true, messageId: message.sid };
}
```

### 5.3 SMS Integration

**Environment variables needed:**
```env
SMS_PHONE_NUMBER=+975********
```

**File to create:**

#### `/lib/notifications/sms.ts`
```typescript
export async function sendInvoiceSMS(
  invoice: InvoiceWithDetails,
  recipientPhone: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Similar to WhatsApp but using SMS channel
  const publicToken = await generatePublicInvoiceToken(invoice.id);
  const publicLink = `${process.env.BASE_URL}/public-invoice/${publicToken}`;

  const message = await client.messages.create({
    from: process.env.SMS_PHONE_NUMBER,
    to: recipientPhone,
    body: `Invoice ${invoice.invoiceNumber}: ${invoice.currency} ${invoice.totalAmount}. View: ${publicLink}`
  });

  await db.insert(invoiceDeliveries).values({
    invoiceId: invoice.id,
    deliveryMethod: 'sms',
    recipient: recipientPhone,
    status: message.status === 'sent' ? 'sent' : 'failed',
    externalId: message.sid
  });

  return { success: true, messageId: message.sid };
}
```

### 5.4 Public Invoice Viewer

**Files to create:**

#### `/app/public-invoice/[token]/page.tsx`
- Public view of invoice (no login required)
- Validate token, fetch invoice
- Display invoice details in read-only format
- Allow PDF download
- Track view timestamp
```typescript
export default async function PublicInvoicePage({ params }: { params: { token: string } }) {
  const verified = await verifyPublicInvoiceToken(params.token);
  if (!verified) return <div>Invalid or expired link</div>;

  const invoice = await getInvoiceWithDetails(verified.invoiceId);

  // Track view
  if (!invoice.viewedAt) {
    await db.update(invoices).set({ viewedAt: new Date() }).where(eq(invoices.id, invoice.id));
  }

  return <InvoicePublicView invoice={invoice} />;
}
```

#### `/components/invoices/send-invoice-dialog.tsx`
- Modal for sending invoice
- Checkboxes: Email, WhatsApp, SMS
- Pre-filled with customer contact info
- Send button triggers multi-channel delivery
```typescript
export function SendInvoiceDialog({ invoice, customer }: Props) {
  const [channels, setChannels] = useState({
    email: !!customer.email,
    whatsapp: !!customer.mobile,
    sms: false
  });

  async function handleSend() {
    // 1. Lock invoice
    await lockInvoice(invoice.id);

    // 2. Send via selected channels
    const results = await Promise.all([
      channels.email ? sendInvoiceEmail(invoice, customer.email) : null,
      channels.whatsapp ? sendInvoiceWhatsApp(invoice, customer.mobile) : null,
      channels.sms ? sendInvoiceSMS(invoice, customer.mobile) : null
    ]);

    // 3. Show success/failure status
  }
}
```

### 5.5 Send Invoice Flow

**File to create:**

#### `/app/api/invoices/[id]/send/route.ts`
- API endpoint for sending invoice via multiple channels
- Locks invoice (isLocked = true)
- Sends via selected channels (email/WhatsApp/SMS)
- Updates invoice status to 'sent'
- Logs deliveries in invoiceDeliveries table
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { channels } = await request.json();
  const invoiceId = parseInt(params.id);

  const invoice = await getInvoiceWithDetails(invoiceId);

  // 1. Lock invoice
  await db.update(invoices).set({
    isLocked: true,
    lockedAt: new Date(),
    status: 'sent'
  }).where(eq(invoices.id, invoiceId));

  // 2. Send via channels
  const results = {
    email: channels.email ? await sendInvoiceEmail(invoice, invoice.customer.email) : null,
    whatsapp: channels.whatsapp ? await sendInvoiceWhatsApp(invoice, invoice.customer.mobile) : null,
    sms: channels.sms ? await sendInvoiceSMS(invoice, invoice.customer.mobile) : null
  };

  // 3. Log activity
  await logActivity(invoice.teamId, user.id, ActivityType.SEND_INVOICE);

  return NextResponse.json({ success: true, results });
}
```

**UI Flow:**
1. User clicks "Send Invoice" button
2. Modal shows checkboxes: ☑ Email, ☑ WhatsApp, ☑ SMS
3. Pre-filled with customer email/mobile
4. Click "Send" → calls API that:
   - Locks invoice (isLocked = true)
   - Sends via selected channels
   - Logs deliveries in invoiceDeliveries table
   - Returns success/failure status per channel
5. Show success notification with delivery status

---

## 📋 Phase 6: Reporting (PENDING)

### 6.1 Sales Tax Report

**Files to create:**

#### `/lib/reports/sales-tax.ts`
- Report calculation logic
- Aggregates tax by rate (0%, 30%, 50%)
- Filters by date range
```typescript
export async function generateSalesTaxReport(
  teamId: number,
  startDate: Date,
  endDate: Date
) {
  // Query all paid invoices in date range
  const invoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.teamId, teamId),
      eq(invoices.paymentStatus, 'paid'),
      gte(invoices.invoiceDate, startDate),
      lte(invoices.invoiceDate, endDate)
    ));

  // Aggregate by tax rate
  const taxByRate = {
    '0': { taxableAmount: 0, taxCollected: 0, invoiceCount: 0 },
    '30': { taxableAmount: 0, taxCollected: 0, invoiceCount: 0 },
    '50': { taxableAmount: 0, taxCollected: 0, invoiceCount: 0 }
  };

  // Get all invoice items for these invoices
  // Calculate totals per tax rate

  return {
    period: { start: startDate, end: endDate },
    totalSales: sum(invoices.totalAmount),
    totalTaxableAmount: sum(taxByRate.taxableAmount),
    totalExemptAmount: taxByRate['0'].taxableAmount,
    taxByRate,
    totalTaxCollected: sum(taxByRate.taxCollected),
    invoiceCount: invoices.length
  };
}
```

#### `/app/(dashboard)/reports/sales-tax/page.tsx`
- UI for sales tax report
- Period selector (monthly, quarterly, custom)
- Display totals and breakdown
- Export to CSV/PDF button
```typescript
export default function SalesTaxReportPage() {
  return (
    <section>
      <h1>Sales Tax Report</h1>

      {/* Period Selector */}
      <div>
        <select name="period">
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* Report Display */}
      <Card>
        <h2>Total Sales: BTN {report.totalSales}</h2>

        <h3>Tax Collected Breakdown:</h3>
        <table>
          <tr>
            <th>Tax Rate</th>
            <th>Taxable Amount</th>
            <th>Tax Collected</th>
            <th>Invoices</th>
          </tr>
          <tr>
            <td>0% (Exempt)</td>
            <td>BTN {report.taxByRate['0'].taxableAmount}</td>
            <td>BTN {report.taxByRate['0'].taxCollected}</td>
            <td>{report.taxByRate['0'].invoiceCount}</td>
          </tr>
          <tr>
            <td>30%</td>
            <td>BTN {report.taxByRate['30'].taxableAmount}</td>
            <td>BTN {report.taxByRate['30'].taxCollected}</td>
            <td>{report.taxByRate['30'].invoiceCount}</td>
          </tr>
          <tr>
            <td>50%</td>
            <td>BTN {report.taxByRate['50'].taxableAmount}</td>
            <td>BTN {report.taxByRate['50'].taxCollected}</td>
            <td>{report.taxByRate['50'].invoiceCount}</td>
          </tr>
        </table>

        <h3>Total Tax Collected: BTN {report.totalTaxCollected}</h3>
      </Card>

      <Button onClick={exportToCSV}>Export to CSV</Button>
      <Button onClick={exportToPDF}>Export to PDF</Button>
    </section>
  );
}
```

#### `/app/api/reports/sales-tax/route.ts`
- API endpoint for generating report
- Accepts date range parameters
- Returns report data as JSON or CSV
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = new Date(searchParams.get('start'));
  const endDate = new Date(searchParams.get('end'));
  const format = searchParams.get('format') || 'json';

  const team = await getTeamForUser();
  const report = await generateSalesTaxReport(team.id, startDate, endDate);

  if (format === 'csv') {
    const csv = convertReportToCSV(report);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sales-tax-${startDate}-${endDate}.csv"`
      }
    });
  }

  return NextResponse.json(report);
}
```

**Report includes:**
- Period selection (monthly, quarterly, custom)
- Total sales (sum of all paid invoices)
- Taxable amount (subtotal before tax)
- Exempt amount (0% tax items)
- Tax collected breakdown:
  - 0% rate: BTN X (count)
  - 30% rate: BTN X (count)
  - 50% rate: BTN X (count)
  - Total tax: BTN X
- Invoice count
- Export to CSV/PDF for DRC filing

### 6.2 Additional Reports

**Files to create:**

#### `/app/(dashboard)/reports/revenue/page.tsx`
- Revenue over time chart
- Filter by date range, customer, product
- Group by day, week, month, quarter, year
- Line chart or bar chart

#### `/app/(dashboard)/reports/outstanding/page.tsx`
- Unpaid invoices report
- Shows all invoices with amountDue > 0
- Sort by due date (overdue first)
- Total outstanding amount
- Age analysis (0-30, 30-60, 60-90, 90+ days)

---

## Technical Decisions

### Concurrency Handling
- **Invoice numbering**: Database transaction with row lock (`SELECT FOR UPDATE`)
- **Simultaneous edits**: Optimistic locking with `updatedAt` version check

### Validation
- **Client-side**: React Hook Form + Zod resolver
- **Server-side**: validatedActionWithUser wrapper with Zod schemas
- **Database**: Drizzle ORM (parameterized queries, no SQL injection)

### Error Handling
- Server actions return: `{ error: string }` or `{ success: string, data?: any }`
- Client displays errors in red, success in green
- Detailed logging to console for debugging

### Performance
- **Indexes**: teamId, invoiceNumber, customerId, invoiceDate, status
- **SWR caching**: Client-side data with server-side fallbacks
- **Server components**: For static data (product catalog, reports)
- **Pagination**: Invoice list, customer list, payment list

### Security
- **Multi-tenancy**: All queries scope by teamId
- **Access control**: validatedActionWithUser checks user authentication
- **Public invoices**: Signed JWT tokens with 90-day expiry
- **Rate limiting**: Implement on email/SMS/WhatsApp APIs
- **Data masking**: Bank account numbers (show last 4 digits)

---

## Compliance Features

### 1. Sequential Numbering (Gap-Free)
- Use `invoiceSequences` table with database transaction
- Row-level locking: `SELECT FOR UPDATE`
- Format: INV-2026-0001 (prefix-year-number)
- Each team has separate sequence per year

### 2. Immutability
- Once invoice is sent: `isLocked = true`
- Prevent edits to locked invoices (return error)
- Only drafts can be edited
- For corrections: create credit note (future feature)

### 3. Audit Trail
- Log all operations in `activityLogs` table:
  - CREATE_INVOICE, SEND_INVOICE, EDIT_INVOICE, DELETE_INVOICE
  - RECORD_PAYMENT, GENERATE_PDF, VIEW_INVOICE
- Track: who (userId), what (action), when (timestamp), where (ipAddress)

### 4. Data Retention
- Soft delete pattern (isActive flags)
- Never hard-delete invoices, customers, products
- Minimum 5-7 year retention (configurable in team settings)

---

## Environment Setup

### Required Environment Variables

```bash
# Database
POSTGRES_URL=postgresql://user:password@host:port/database

# Authentication (existing)
AUTH_SECRET=your-secret-key

# Base URL
BASE_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_***

# WhatsApp & SMS (Twilio)
TWILIO_ACCOUNT_SID=AC***
TWILIO_AUTH_TOKEN=***
WHATSAPP_PHONE_NUMBER=+975********
SMS_PHONE_NUMBER=+975********
```

---

## Implementation Checklist

### ✅ Pre-Implementation (COMPLETED)
- [x] Backup production database
- [x] Create feature branch: `git checkout -b feature/invoice-system`
- [x] Install dependencies: `pnpm install @react-pdf/renderer resend twilio decimal.js`
- [x] Remove Stripe: `pnpm remove stripe`

### ✅ Phase 1: Database (COMPLETED)
- [x] Update schema.ts (remove Stripe, add invoice tables)
- [x] Generate migration: Manual SQL created
- [x] Review migration SQL
- [x] Run migration: `pnpm db:migrate`

### ✅ Phase 2: Core Modules (COMPLETED)
- [x] Create business settings module
- [x] Create customer CRUD (backend + UI + API)
- [x] Create product catalog (backend + UI + API)
- [x] Update navigation menu with sidebar
- [x] Remove all Stripe code and files
- [x] Fix public home page (remove sidebar)

### 🔄 Phase 3: Invoicing (IN PROGRESS)
- [ ] Implement invoice numbering (concurrency-safe)
- [ ] Implement tax calculation engine
- [ ] Create invoice validation schemas
- [ ] Create invoice CRUD actions
- [ ] Create invoice queries
- [ ] Build invoice creation form
- [ ] Add product autocomplete
- [ ] Implement dynamic catalog addition
- [ ] Create invoice list/view/edit pages

### ⏳ Phase 4: PDF & Payments (PENDING)
- [ ] Design DRC-compliant PDF template
- [ ] Implement PDF generation
- [ ] Create PDF download API
- [ ] Replace payment placeholders with real recording
- [ ] Implement invoice locking
- [ ] Add payment tracking UI

### ⏳ Phase 5: Delivery (PENDING)
- [ ] Set up Resend email integration
- [ ] Set up Twilio WhatsApp integration
- [ ] Set up Twilio SMS integration
- [ ] Create public invoice viewer
- [ ] Build send invoice dialog
- [ ] Implement delivery tracking

### ⏳ Phase 6: Reporting (PENDING)
- [ ] Build sales tax report
- [ ] Create revenue reports
- [ ] Build outstanding invoices report
- [ ] Update dashboard with metrics

### Testing
- [ ] Unit tests (calculations, validation)
- [ ] Integration tests (server actions)
- [ ] E2E tests (invoice flow)
- [ ] Manual testing with sample data

### Deployment
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## Success Criteria

✅ Can create invoices with multiple line items
✅ Tax calculations work correctly (0%, 30%, 50%, exempt)
✅ Per-item tax override functional
✅ Sequential invoice numbering with no gaps
✅ PDF generation includes all DRC-required fields
✅ Can send invoices via email, WhatsApp, SMS
✅ Payment recording updates invoice status
✅ Sales tax report accurate for DRC filing
✅ Sent invoices are immutable
✅ Audit trail tracks all operations
✅ Multi-currency support works
✅ Product autocomplete suggests from catalog + history
✅ Dynamic catalog addition prompts user

---

## Risk Mitigation

**Risk: Data loss during migration**
- Mitigation: ✅ Full database backup before migration, test on staging first

**Risk: Invoice numbering gaps due to race conditions**
- Mitigation: Database row-level locking with SELECT FOR UPDATE

**Risk: Tax calculations incorrect**
- Mitigation: Unit tests for all calculation scenarios, manual QA with accountant

**Risk: Email/SMS delivery failures**
- Mitigation: Track delivery status, retry logic, fallback to manual PDF download

**Risk: Public invoice links exploited**
- Mitigation: Signed JWT tokens with expiry, no sensitive data in URL, rate limiting

**Risk: Performance issues with large datasets**
- Mitigation: Database indexes, pagination, SWR caching, lazy loading

---

## Timeline Estimate

**Total Estimated Time**: 7 weeks (can be accelerated with multiple developers)

**Current Progress**: Week 2 (Phase 2 completed)

**Remaining Phases**:
- Phase 3: 2 weeks (Invoice Engine)
- Phase 4: 1 week (PDF & Payments)
- Phase 5: 1 week (Delivery Channels)
- Phase 6: 1 week (Reporting)
- Testing & Deployment: 1 week

**Critical Path**: Database schema → Invoice engine → PDF generation → Delivery channels

**Next Milestone**: Complete Phase 3 (Invoice Engine) - focus on invoice numbering, calculations, and UI

---

**Last Updated**: January 5, 2026
**Current Phase**: Phase 3 - Invoice Engine (In Progress)
**Next Task**: Implement invoice numbering with concurrency control
