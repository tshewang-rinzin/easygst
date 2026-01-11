import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  index,
  uniqueIndex,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// USER MANAGEMENT
// ============================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),

  // Email Verification
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: varchar('verification_token', { length: 255 }),
  verificationTokenExpiry: timestamp('verification_token_expiry'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  // Business Information (DRC Compliance)
  businessName: varchar('business_name', { length: 255 }),
  tpn: varchar('tpn', { length: 20 }).unique(), // Tax Payer Number
  gstNumber: varchar('gst_number', { length: 20 }), // GST Registration Number
  licenseNumber: varchar('license_number', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  dzongkhag: varchar('dzongkhag', { length: 100 }), // District in Bhutan
  postalCode: varchar('postal_code', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),

  // Banking & Currency
  defaultCurrency: varchar('default_currency', { length: 3 }).notNull().default('BTN'), // BTN, INR, USD
  // DEPRECATED: Use bankAccounts table instead for multiple bank accounts
  bankName: varchar('bank_name', { length: 100 }),
  bankAccountNumber: varchar('bank_account_number', { length: 50 }),
  bankAccountName: varchar('bank_account_name', { length: 100 }),
  bankBranch: varchar('bank_branch', { length: 100 }),

  // Invoice Settings
  invoicePrefix: varchar('invoice_prefix', { length: 20 }).default('INV'),
  invoiceTerms: text('invoice_terms'), // Default terms & conditions
  invoiceFooter: text('invoice_footer'),
  logoUrl: text('logo_url'),

  // Tax Settings
  defaultGstRate: numeric('default_gst_rate', { precision: 5, scale: 2 }).notNull().default('0'), // Default GST rate for all products
  gstRegistered: boolean('gst_registered').notNull().default(false), // Whether business is GST registered
});

export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  invitationToken: varchar('invitation_token', { length: 255 }).unique(),
  invitationTokenExpiry: timestamp('invitation_token_expiry'),
  acceptedAt: timestamp('accepted_at'),
  lastEmailSentAt: timestamp('last_email_sent_at'),
  emailSentCount: integer('email_sent_count').notNull().default(1),
});

// Bank Accounts - Multiple accounts per team with QR codes
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Bank Details
  bankName: varchar('bank_name', { length: 100 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  accountName: varchar('account_name', { length: 100 }).notNull(), // Account holder name
  branch: varchar('branch', { length: 100 }),
  accountType: varchar('account_type', { length: 50 }), // savings, current, etc.

  // Payment Method Association
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // bank_transfer, mbob, mpay, etc.

  // QR Code for payment
  qrCodeUrl: text('qr_code_url'), // Base64 data URL or external URL

  // Settings
  isDefault: boolean('is_default').notNull().default(false), // Default account for invoices
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').default(0), // Display order

  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamBankIdx: index('team_bank_idx').on(table.teamId),
  teamDefaultBankIdx: index('team_default_bank_idx').on(table.teamId, table.isDefault),
}));

// Payment Methods - Dynamic payment methods per team
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Payment Method Details
  code: varchar('code', { length: 50 }).notNull(), // mbob, mpay, epay, cash, cheque, bank_transfer, etc.
  name: varchar('name', { length: 100 }).notNull(), // Display name
  description: text('description'),

  // Settings
  isEnabled: boolean('is_enabled').notNull().default(true),
  sortOrder: integer('sort_order').default(0),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamMethodIdx: index('team_method_idx').on(table.teamId),
  teamCodeIdx: index('team_code_idx').on(table.teamId, table.code),
}));

// ============================================================
// INVOICE SYSTEM
// ============================================================

// Customers/Clients
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Customer Details
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  mobile: varchar('mobile', { length: 20 }), // For SMS/WhatsApp
  tpn: varchar('tpn', { length: 20 }), // Tax Payer Number (optional for non-registered)

  // Address
  address: text('address'),
  city: varchar('city', { length: 100 }),
  dzongkhag: varchar('dzongkhag', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),

  // Metadata
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  teamCustomerIdx: index('team_customer_idx').on(table.teamId),
  customerEmailIdx: index('customer_email_idx').on(table.email),
}));

// Suppliers/Vendors
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Supplier Details
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  mobile: varchar('mobile', { length: 20 }),
  tpn: varchar('tpn', { length: 20 }), // Tax Payer Number
  gstNumber: varchar('gst_number', { length: 20 }), // Supplier's GST Number

  // Address
  address: text('address'),
  city: varchar('city', { length: 100 }),
  dzongkhag: varchar('dzongkhag', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),

  // Banking (for payments)
  bankName: varchar('bank_name', { length: 100 }),
  bankAccountNumber: varchar('bank_account_number', { length: 50 }),
  bankAccountName: varchar('bank_account_name', { length: 100 }),

  // Metadata
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  teamSupplierIdx: index('team_supplier_idx').on(table.teamId),
  supplierEmailIdx: index('supplier_email_idx').on(table.email),
}));

// Product Categories (Master Data per Team)
export const productCategories = pgTable('product_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Category Details
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),

  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamCategoryIdx: index('team_category_idx').on(table.teamId),
  categoryNameIdx: index('category_name_idx').on(table.teamId, table.name),
}));

// Units of Measurement
export const units = pgTable('units', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(), // piece, kg, liter, hour, etc.
  abbreviation: varchar('abbreviation', { length: 20 }).notNull(), // pcs, kg, L, hr, etc.
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamUnitIdx: index('team_unit_idx').on(table.teamId),
  teamUnitNameIdx: uniqueIndex('team_unit_name_idx').on(table.teamId, table.name),
}));

// Tax Classifications (GST Categories)
export const taxClassifications = pgTable('tax_classifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  code: varchar('code', { length: 50 }).notNull(), // STANDARD, ZERO_RATED, EXEMPT, etc.
  name: varchar('name', { length: 100 }).notNull(), // Standard-Rated, Zero-Rated, Exempt
  description: text('description'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull(), // 5.00, 0.00, etc.
  canClaimInputCredits: boolean('can_claim_input_credits').notNull().default(true), // true for Standard & Zero-Rated, false for Exempt
  color: varchar('color', { length: 50 }).default('blue'), // blue, green, gray for badges
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamClassificationIdx: index('team_classification_idx').on(table.teamId),
  teamClassificationCodeIdx: uniqueIndex('team_classification_code_idx').on(table.teamId, table.code),
}));

// Products/Services
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Product Details
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sku: varchar('sku', { length: 100 }), // Stock Keeping Unit
  unit: varchar('unit', { length: 50 }).default('piece'), // piece, kg, liter, hour, etc.

  // Pricing (stored in team's default currency)
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),

  // Tax Configuration
  defaultTaxRate: numeric('default_tax_rate', { precision: 5, scale: 2 }).notNull().default('0'), // 0, 30, 50
  isTaxExempt: boolean('is_tax_exempt').notNull().default(false),
  gstClassification: varchar('gst_classification', { length: 20 }).notNull().default('STANDARD'), // STANDARD, ZERO_RATED, EXEMPT

  // Categorization
  categoryId: uuid('category_id').references(() => productCategories.id),
  category: varchar('category', { length: 100 }), // Kept for backward compatibility and manual entry

  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  teamProductIdx: index('team_product_idx').on(table.teamId),
  productSkuIdx: index('product_sku_idx').on(table.sku),
}));

// Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),

  // Invoice Identification
  publicId: uuid('public_id').defaultRandom().notNull().unique(), // UUID for public verification URL
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(), // INV-2026-0001
  invoiceDate: timestamp('invoice_date').notNull().defaultNow(),
  dueDate: timestamp('due_date'),

  // Financial
  currency: varchar('currency', { length: 3 }).notNull().default('BTN'),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(), // Sum of line items before tax
  totalTax: numeric('total_tax', { precision: 15, scale: 2 }).notNull().default('0'),
  totalDiscount: numeric('total_discount', { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(), // Final amount

  // Payment Tracking
  amountPaid: numeric('amount_paid', { precision: 15, scale: 2 }).notNull().default('0'),
  amountDue: numeric('amount_due', { precision: 15, scale: 2 }).notNull(),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, sent, viewed, partial, paid, overdue, cancelled
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('unpaid'), // unpaid, partial, paid

  // Terms & Notes
  paymentTerms: text('payment_terms'),
  notes: text('notes'), // Internal notes
  customerNotes: text('customer_notes'), // Visible to customer
  termsAndConditions: text('terms_and_conditions'),

  // Delivery Tracking
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  lastReminderSentAt: timestamp('last_reminder_sent_at'),

  // Compliance & Audit (Immutability)
  isLocked: boolean('is_locked').notNull().default(false), // Lock after sending to prevent edits
  lockedAt: timestamp('locked_at'),
  lockedBy: uuid('locked_by').references(() => users.id),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamInvoiceIdx: index('team_invoice_idx').on(table.teamId),
  invoiceNumberIdx: uniqueIndex('invoice_number_idx').on(table.teamId, table.invoiceNumber),
  publicIdIdx: uniqueIndex('invoice_public_id_idx').on(table.publicId),
  customerInvoiceIdx: index('customer_invoice_idx').on(table.customerId),
  invoiceStatusIdx: index('invoice_status_idx').on(table.status),
  invoiceDateIdx: index('invoice_date_idx').on(table.invoiceDate),
}));

// Invoice Items (Line Items)
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id), // Nullable - can be ad-hoc items

  // Item Details (denormalized for immutability)
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).notNull().default('1'),
  unit: varchar('unit', { length: 50 }),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),

  // Pricing Breakdown
  lineTotal: numeric('line_total', { precision: 15, scale: 2 }).notNull(), // quantity * unitPrice
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 15, scale: 2 }).default('0'),

  // Tax Configuration (PER ITEM - allows override)
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  isTaxExempt: boolean('is_tax_exempt').notNull().default(false),
  gstClassification: varchar('gst_classification', { length: 20 }).notNull().default('STANDARD'), // STANDARD, ZERO_RATED, EXEMPT

  // Final
  itemTotal: numeric('item_total', { precision: 15, scale: 2 }).notNull(), // lineTotal - discount + tax

  // Display Order
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  invoiceItemIdx: index('invoice_item_idx').on(table.invoiceId),
}));

// Invoice Adjustments (discounts, late fees, credits, debits)
export const invoiceAdjustments = pgTable('invoice_adjustments', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),

  // Adjustment Details
  adjustmentType: varchar('adjustment_type', { length: 50 }).notNull(), // discount, late_fee, credit_note, debit_note, bank_charges, other
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // Positive for charges/debits, negative for discounts/credits
  description: text('description').notNull(),

  // Reference
  referenceNumber: varchar('reference_number', { length: 100 }),
  adjustmentDate: timestamp('adjustment_date').notNull().defaultNow(),

  // Notes
  notes: text('notes'),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamAdjustmentIdx: index('team_adjustment_idx').on(table.teamId),
  invoiceAdjustmentIdx: index('invoice_adjustment_idx').on(table.invoiceId),
  adjustmentDateIdx: index('adjustment_date_idx').on(table.adjustmentDate),
}));

// Payments
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id),

  // Payment Details
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  paymentDate: timestamp('payment_date').notNull().defaultNow(),

  // Payment Method
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // cash, bank_transfer, online, cheque, etc.
  paymentGateway: varchar('payment_gateway', { length: 50 }), // stripe, razorpay, etc. for online
  transactionId: varchar('transaction_id', { length: 255 }), // External reference

  // Banking Details
  bankName: varchar('bank_name', { length: 100 }),
  chequeNumber: varchar('cheque_number', { length: 50 }),

  // Adjustments (discounts, late fees, bank charges, etc.)
  adjustmentAmount: numeric('adjustment_amount', { precision: 15, scale: 2 }).default('0.00'), // Positive for fees, negative for discounts
  adjustmentReason: varchar('adjustment_reason', { length: 100 }), // discount, late_fee, bank_charges, currency_conversion, other

  // Notes
  notes: text('notes'),
  receiptNumber: varchar('receipt_number', { length: 50 }),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamPaymentIdx: index('team_payment_idx').on(table.teamId),
  invoicePaymentIdx: index('invoice_payment_idx').on(table.invoiceId),
  paymentDateIdx: index('payment_date_idx').on(table.paymentDate),
}));

// Tax Settings (for different tax rates and compliance)
export const taxSettings = pgTable('tax_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Tax Configuration
  taxName: varchar('tax_name', { length: 100 }).notNull(), // "GST - Luxury", "GST - Standard", "GST - Essential"
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull(),
  taxType: varchar('tax_type', { length: 50 }).notNull().default('gst'),

  // Categorization
  category: varchar('category', { length: 100 }), // luxury, mid_tier, essential
  description: text('description'),

  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamTaxIdx: index('team_tax_idx').on(table.teamId),
}));

// Invoice Delivery Log (Email, WhatsApp, SMS tracking)
export const invoiceDeliveries = pgTable('invoice_deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),

  // Delivery Details
  deliveryMethod: varchar('delivery_method', { length: 20 }).notNull(), // email, whatsapp, sms
  recipient: varchar('recipient', { length: 255 }).notNull(), // email or phone number

  // Status
  status: varchar('status', { length: 20 }).notNull(), // sent, delivered, failed, bounced
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at'),
  failedAt: timestamp('failed_at'),
  errorMessage: text('error_message'),

  // External References
  externalId: varchar('external_id', { length: 255 }), // Provider's message ID

  // Metadata
  metadata: jsonb('metadata'), // Additional provider-specific data
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  invoiceDeliveryIdx: index('invoice_delivery_idx').on(table.invoiceId),
  deliveryMethodIdx: index('delivery_method_idx').on(table.deliveryMethod),
}));

// Invoice Sequence (for gap-free sequential numbering - concurrency safe)
export const invoiceSequences = pgTable('invoice_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' })
    .unique(),

  // Sequence Control
  year: integer('year').notNull(), // 2026
  lastNumber: integer('last_number').notNull().default(0),

  // Locking for concurrency
  lockedAt: timestamp('locked_at'),
  lockedBy: varchar('locked_by', { length: 100 }),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamYearIdx: uniqueIndex('team_year_idx').on(table.teamId, table.year),
}));

// ============================================================
// PURCHASE SYSTEM (Supplier Bills)
// ============================================================

// Supplier Bills (Purchase Invoices)
export const supplierBills = pgTable('supplier_bills', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id),

  // Bill Identification
  billNumber: varchar('bill_number', { length: 50 }).notNull(), // BILL-2026-0001 or Supplier's invoice number
  billDate: timestamp('bill_date').notNull().defaultNow(),
  dueDate: timestamp('due_date'),

  // Financial
  currency: varchar('currency', { length: 3 }).notNull().default('BTN'),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  totalTax: numeric('total_tax', { precision: 15, scale: 2 }).notNull().default('0'),
  totalDiscount: numeric('total_discount', { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),

  // Payment Tracking
  amountPaid: numeric('amount_paid', { precision: 15, scale: 2 }).notNull().default('0'),
  amountDue: numeric('amount_due', { precision: 15, scale: 2 }).notNull(),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, received, partial, paid, overdue, cancelled
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('unpaid'), // unpaid, partial, paid

  // Terms & Notes
  paymentTerms: text('payment_terms'),
  notes: text('notes'),
  termsAndConditions: text('terms_and_conditions'),

  // Compliance & Audit
  isLocked: boolean('is_locked').notNull().default(false),
  lockedAt: timestamp('locked_at'),
  lockedBy: uuid('locked_by').references(() => users.id),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamBillIdx: index('team_bill_idx').on(table.teamId),
  billNumberIdx: uniqueIndex('bill_number_idx').on(table.teamId, table.billNumber),
  supplierBillIdx: index('supplier_bill_idx').on(table.supplierId),
  billStatusIdx: index('bill_status_idx').on(table.status),
  billDateIdx: index('bill_date_idx').on(table.billDate),
}));

// Supplier Bill Items (Line Items for purchases)
export const supplierBillItems = pgTable('supplier_bill_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  billId: uuid('bill_id')
    .notNull()
    .references(() => supplierBills.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),

  // Item Details
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).notNull().default('1'),
  unit: varchar('unit', { length: 50 }),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),

  // Pricing Breakdown
  lineTotal: numeric('line_total', { precision: 15, scale: 2 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 15, scale: 2 }).default('0'),

  // Tax Configuration (Input GST - can be claimed)
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  isTaxExempt: boolean('is_tax_exempt').notNull().default(false),
  gstClassification: varchar('gst_classification', { length: 20 }).notNull().default('STANDARD'),

  // Final
  itemTotal: numeric('item_total', { precision: 15, scale: 2 }).notNull(),

  // Display Order
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  billItemIdx: index('bill_item_idx').on(table.billId),
}));

// Supplier Bill Sequence (for gap-free sequential numbering)
export const supplierBillSequences = pgTable('supplier_bill_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' })
    .unique(),

  // Sequence Control
  year: integer('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),

  // Locking for concurrency
  lockedAt: timestamp('locked_at'),
  lockedBy: varchar('locked_by', { length: 100 }),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamBillYearIdx: uniqueIndex('team_bill_year_idx').on(table.teamId, table.year),
}));

// Supplier Bill Adjustments (discounts, late fees, credits, debits)
export const supplierBillAdjustments = pgTable('supplier_bill_adjustments', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  billId: uuid('bill_id')
    .notNull()
    .references(() => supplierBills.id, { onDelete: 'cascade' }),

  // Adjustment Details
  adjustmentType: varchar('adjustment_type', { length: 50 }).notNull(), // discount, late_fee, credit_note, debit_note, bank_charges, other
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // Positive for charges/debits, negative for discounts/credits
  description: text('description').notNull(),

  // Reference
  referenceNumber: varchar('reference_number', { length: 100 }),
  adjustmentDate: timestamp('adjustment_date').notNull().defaultNow(),

  // Notes
  notes: text('notes'),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamBillAdjustmentIdx: index('team_bill_adjustment_idx').on(table.teamId),
  billAdjustmentIdx: index('bill_adjustment_idx').on(table.billId),
  billAdjustmentDateIdx: index('bill_adjustment_date_idx').on(table.adjustmentDate),
}));

// Supplier Payments
export const supplierPayments = pgTable('supplier_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  billId: uuid('bill_id')
    .references(() => supplierBills.id), // Nullable for advances

  // Payment Details
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  paymentDate: timestamp('payment_date').notNull().defaultNow(),

  // Allocation tracking (for advances)
  allocatedAmount: numeric('allocated_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  unallocatedAmount: numeric('unallocated_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),

  // Payment Type & Advance Support
  paymentType: varchar('payment_type', { length: 20 }).notNull().default('payment'), // 'payment' or 'advance'
  advanceNumber: varchar('advance_number', { length: 50 }), // For advance-type payments: ADV-S-YYYY-NNNN

  // Payment Method
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentGateway: varchar('payment_gateway', { length: 100 }),
  transactionId: varchar('transaction_id', { length: 255 }),

  // Banking Details
  bankName: varchar('bank_name', { length: 100 }),
  chequeNumber: varchar('cheque_number', { length: 50 }),

  // Notes
  notes: text('notes'),
  receiptNumber: varchar('receipt_number', { length: 50 }),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamSupplierPaymentIdx: index('team_supplier_payment_idx').on(table.teamId),
  billPaymentIdx: index('bill_payment_idx').on(table.billId),
  supplierPaymentDateIdx: index('supplier_payment_date_idx').on(table.paymentDate),
  advanceNumberSupplierIdx: index('advance_number_supplier_idx').on(table.advanceNumber),
  paymentTypeSupplierIdx: index('payment_type_supplier_idx').on(table.paymentType),
}));

// Supplier Payment Allocations (linking payments to bills)
export const supplierPaymentAllocations = pgTable('supplier_payment_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  supplierPaymentId: uuid('supplier_payment_id')
    .notNull()
    .references(() => supplierPayments.id, { onDelete: 'cascade' }),
  billId: uuid('bill_id')
    .notNull()
    .references(() => supplierBills.id),

  // Allocation amount
  allocatedAmount: numeric('allocated_amount', { precision: 15, scale: 2 }).notNull(),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamSupplierPaymentAllocationIdx: index('team_supplier_payment_allocation_idx').on(table.teamId),
  supplierPaymentAllocationIdx: index('supplier_payment_allocation_idx').on(table.supplierPaymentId),
  billAllocationIdx: index('bill_allocation_idx').on(table.billId),
}));

// Supplier Advance Sequences (for gap-free advance numbering)
export const supplierAdvanceSequences = pgTable('supplier_advance_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' })
    .unique(),
  year: integer('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),
  lockedAt: timestamp('locked_at'),
  lockedBy: varchar('locked_by', { length: 100 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamSupplierAdvanceYearIdx: uniqueIndex('team_supplier_advance_year_idx').on(table.teamId, table.year),
}));

// ============================================================
// GST RETURNS & PERIOD LOCKS
// ============================================================

export const gstReturns = pgTable('gst_returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Return identification
  returnNumber: varchar('return_number', { length: 50 }).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  returnType: varchar('return_type', { length: 20 }).notNull(), // 'monthly', 'quarterly', 'annual'

  // Status tracking
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft', 'filed', 'approved', 'amended'

  // GST amounts (all in default currency)
  outputGst: numeric('output_gst', { precision: 15, scale: 2 }).notNull().default('0.00'),
  inputGst: numeric('input_gst', { precision: 15, scale: 2 }).notNull().default('0.00'),
  netGstPayable: numeric('net_gst_payable', { precision: 15, scale: 2 }).notNull().default('0.00'),

  // Adjustments
  adjustments: numeric('adjustments', { precision: 15, scale: 2 }).default('0.00'),
  previousPeriodBalance: numeric('previous_period_balance', { precision: 15, scale: 2 }).default('0.00'),
  penalties: numeric('penalties', { precision: 15, scale: 2 }).default('0.00'),
  interest: numeric('interest', { precision: 15, scale: 2 }).default('0.00'),
  totalPayable: numeric('total_payable', { precision: 15, scale: 2 }).notNull().default('0.00'),

  // Filing details
  filingDate: timestamp('filing_date'),
  dueDate: timestamp('due_date').notNull(),
  filedBy: uuid('filed_by').references(() => users.id),

  // Breakdown details (stored as JSON)
  salesBreakdown: jsonb('sales_breakdown'), // { standard: {...}, zeroRated: {...}, exempt: {...} }
  purchasesBreakdown: jsonb('purchases_breakdown'),

  // Notes and metadata
  notes: text('notes'),
  amendments: jsonb('amendments'), // Track amendment history

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  teamPeriodIdx: index('gst_returns_team_period_idx').on(table.teamId, table.periodStart, table.periodEnd),
  returnNumberIdx: uniqueIndex('gst_returns_return_number_idx').on(table.teamId, table.returnNumber),
}));

export const gstPeriodLocks = pgTable('gst_period_locks', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Period information
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  periodType: varchar('period_type', { length: 20 }).notNull(), // 'monthly', 'quarterly', 'annual'

  // Lock details
  lockedAt: timestamp('locked_at').notNull().defaultNow(),
  lockedBy: uuid('locked_by')
    .notNull()
    .references(() => users.id),
  reason: text('reason'),

  // Associated return (optional)
  gstReturnId: uuid('gst_return_id').references(() => gstReturns.id),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  teamPeriodIdx: uniqueIndex('gst_period_locks_team_period_idx').on(table.teamId, table.periodStart, table.periodEnd),
}));

// ============================================================
// CUSTOMER PAYMENTS (Receive Payment with Allocation)
// ============================================================

export const customerPayments = pgTable('customer_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),

  // Payment Details
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  paymentDate: timestamp('payment_date').notNull().defaultNow(),

  // Allocation tracking
  allocatedAmount: numeric('allocated_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  unallocatedAmount: numeric('unallocated_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),

  // Payment Type & Advance Support
  paymentType: varchar('payment_type', { length: 20 }).notNull().default('payment'), // 'payment' or 'advance'
  advanceNumber: varchar('advance_number', { length: 50 }), // For advance-type payments: ADV-C-YYYY-NNNN

  // Payment Method
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentGateway: varchar('payment_gateway', { length: 100 }),
  transactionId: varchar('transaction_id', { length: 255 }),

  // Banking Details
  bankName: varchar('bank_name', { length: 255 }),
  chequeNumber: varchar('cheque_number', { length: 50 }),

  // Receipt
  receiptNumber: varchar('receipt_number', { length: 50 }),

  // Notes
  notes: text('notes'),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamCustomerPaymentIdx: index('team_customer_payment_idx').on(table.teamId),
  customerPaymentIdx: index('customer_payment_idx').on(table.customerId),
  customerPaymentDateIdx: index('customer_payment_date_idx').on(table.paymentDate),
  receiptNumberIdx: index('receipt_number_idx').on(table.receiptNumber),
  advanceNumberCustomerIdx: index('advance_number_customer_idx').on(table.advanceNumber),
  paymentTypeCustomerIdx: index('payment_type_customer_idx').on(table.paymentType),
}));

export const paymentAllocations = pgTable('payment_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  customerPaymentId: uuid('customer_payment_id')
    .notNull()
    .references(() => customerPayments.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id),

  // Allocation amount
  allocatedAmount: numeric('allocated_amount', { precision: 15, scale: 2 }).notNull(),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamPaymentAllocationIdx: index('team_payment_allocation_idx').on(table.teamId),
  customerPaymentAllocationIdx: index('customer_payment_allocation_idx').on(table.customerPaymentId),
  invoiceAllocationIdx: index('invoice_allocation_idx').on(table.invoiceId),
}));

// Customer Advance Sequences (for gap-free advance numbering)
export const customerAdvanceSequences = pgTable('customer_advance_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' })
    .unique(),
  year: integer('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),
  lockedAt: timestamp('locked_at'),
  lockedBy: varchar('locked_by', { length: 100 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamCustomerAdvanceYearIdx: uniqueIndex('team_customer_advance_year_idx').on(table.teamId, table.year),
}));

// ============================================================
// RELATIONS
// ============================================================

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  customers: many(customers),
  suppliers: many(suppliers),
  products: many(products),
  invoices: many(invoices),
  supplierBills: many(supplierBills),
  payments: many(payments),
  supplierPayments: many(supplierPayments),
  customerPayments: many(customerPayments),
  paymentAllocations: many(paymentAllocations),
  taxSettings: many(taxSettings),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  team: one(teams, {
    fields: [customers.teamId],
    references: [teams.id],
  }),
  invoices: many(invoices),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  team: one(teams, {
    fields: [products.teamId],
    references: [teams.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  team: one(teams, {
    fields: [invoices.teamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  deliveries: many(invoiceDeliveries),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  team: one(teams, {
    fields: [payments.teamId],
    references: [teams.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const taxSettingsRelations = relations(taxSettings, ({ one }) => ({
  team: one(teams, {
    fields: [taxSettings.teamId],
    references: [teams.id],
  }),
}));

export const invoiceDeliveriesRelations = relations(invoiceDeliveries, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceDeliveries.invoiceId],
    references: [invoices.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  team: one(teams, {
    fields: [suppliers.teamId],
    references: [teams.id],
  }),
  supplierBills: many(supplierBills),
}));

export const supplierBillsRelations = relations(supplierBills, ({ one, many }) => ({
  team: one(teams, {
    fields: [supplierBills.teamId],
    references: [teams.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierBills.supplierId],
    references: [suppliers.id],
  }),
  items: many(supplierBillItems),
  payments: many(supplierPayments),
  adjustments: many(supplierBillAdjustments),
}));

export const supplierBillItemsRelations = relations(supplierBillItems, ({ one }) => ({
  bill: one(supplierBills, {
    fields: [supplierBillItems.billId],
    references: [supplierBills.id],
  }),
  product: one(products, {
    fields: [supplierBillItems.productId],
    references: [products.id],
  }),
}));

export const supplierPaymentsRelations = relations(supplierPayments, ({ one, many }) => ({
  team: one(teams, {
    fields: [supplierPayments.teamId],
    references: [teams.id],
  }),
  bill: one(supplierBills, {
    fields: [supplierPayments.billId],
    references: [supplierBills.id],
  }),
  allocations: many(supplierPaymentAllocations),
}));

export const supplierBillAdjustmentsRelations = relations(supplierBillAdjustments, ({ one }) => ({
  team: one(teams, {
    fields: [supplierBillAdjustments.teamId],
    references: [teams.id],
  }),
  bill: one(supplierBills, {
    fields: [supplierBillAdjustments.billId],
    references: [supplierBills.id],
  }),
}));

export const supplierPaymentAllocationsRelations = relations(supplierPaymentAllocations, ({ one }) => ({
  team: one(teams, {
    fields: [supplierPaymentAllocations.teamId],
    references: [teams.id],
  }),
  supplierPayment: one(supplierPayments, {
    fields: [supplierPaymentAllocations.supplierPaymentId],
    references: [supplierPayments.id],
  }),
  bill: one(supplierBills, {
    fields: [supplierPaymentAllocations.billId],
    references: [supplierBills.id],
  }),
}));

export const supplierAdvanceSequencesRelations = relations(supplierAdvanceSequences, ({ one }) => ({
  team: one(teams, {
    fields: [supplierAdvanceSequences.teamId],
    references: [teams.id],
  }),
}));

export const customerAdvanceSequencesRelations = relations(customerAdvanceSequences, ({ one }) => ({
  team: one(teams, {
    fields: [customerAdvanceSequences.teamId],
    references: [teams.id],
  }),
}));

export const customerPaymentsRelations = relations(customerPayments, ({ one, many }) => ({
  team: one(teams, {
    fields: [customerPayments.teamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [customerPayments.customerId],
    references: [customers.id],
  }),
  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({ one }) => ({
  team: one(teams, {
    fields: [paymentAllocations.teamId],
    references: [teams.id],
  }),
  customerPayment: one(customerPayments, {
    fields: [paymentAllocations.customerPaymentId],
    references: [customerPayments.id],
  }),
  invoice: one(invoices, {
    fields: [paymentAllocations.invoiceId],
    references: [invoices.id],
  }),
}));

export const gstReturnsRelations = relations(gstReturns, ({ one, many }) => ({
  team: one(teams, {
    fields: [gstReturns.teamId],
    references: [teams.id],
  }),
  filedByUser: one(users, {
    fields: [gstReturns.filedBy],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [gstReturns.createdBy],
    references: [users.id],
  }),
  periodLocks: many(gstPeriodLocks),
}));

export const gstPeriodLocksRelations = relations(gstPeriodLocks, ({ one }) => ({
  team: one(teams, {
    fields: [gstPeriodLocks.teamId],
    references: [teams.id],
  }),
  lockedByUser: one(users, {
    fields: [gstPeriodLocks.lockedBy],
    references: [users.id],
  }),
  gstReturn: one(gstReturns, {
    fields: [gstPeriodLocks.gstReturnId],
    references: [gstReturns.id],
  }),
}));

// ============================================================
// TYPE EXPORTS
// ============================================================

// User types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Team types
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

// Activity & Invitations
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

// Bank Account types
export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;

// Payment Method types
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;

// Customer types
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// Supplier types
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

// Unit types
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;

// Tax Classification types
export type TaxClassification = typeof taxClassifications.$inferSelect;
export type NewTaxClassification = typeof taxClassifications.$inferInsert;

// Product types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// Invoice types
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

// Supplier Bill types
export type SupplierBill = typeof supplierBills.$inferSelect;
export type NewSupplierBill = typeof supplierBills.$inferInsert;
export type SupplierBillItem = typeof supplierBillItems.$inferSelect;
export type NewSupplierBillItem = typeof supplierBillItems.$inferInsert;

// Payment types
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// Supplier Payment types
export type SupplierPayment = typeof supplierPayments.$inferSelect;
export type NewSupplierPayment = typeof supplierPayments.$inferInsert;

// Customer Payment types
export type CustomerPayment = typeof customerPayments.$inferSelect;
export type NewCustomerPayment = typeof customerPayments.$inferInsert;
export type PaymentAllocation = typeof paymentAllocations.$inferSelect;
export type NewPaymentAllocation = typeof paymentAllocations.$inferInsert;

// Supplier Payment Allocation types
export type SupplierPaymentAllocation = typeof supplierPaymentAllocations.$inferSelect;
export type NewSupplierPaymentAllocation = typeof supplierPaymentAllocations.$inferInsert;

// Supplier Bill Adjustment types
export type SupplierBillAdjustment = typeof supplierBillAdjustments.$inferSelect;
export type NewSupplierBillAdjustment = typeof supplierBillAdjustments.$inferInsert;

// Tax types
export type TaxSetting = typeof taxSettings.$inferSelect;
export type NewTaxSetting = typeof taxSettings.$inferInsert;

// Delivery types
export type InvoiceDelivery = typeof invoiceDeliveries.$inferSelect;
export type NewInvoiceDelivery = typeof invoiceDeliveries.$inferInsert;

// Sequence types
export type InvoiceSequence = typeof invoiceSequences.$inferSelect;
export type NewInvoiceSequence = typeof invoiceSequences.$inferInsert;
export type CustomerAdvanceSequence = typeof customerAdvanceSequences.$inferSelect;
export type NewCustomerAdvanceSequence = typeof customerAdvanceSequences.$inferInsert;
export type SupplierAdvanceSequence = typeof supplierAdvanceSequences.$inferSelect;
export type NewSupplierAdvanceSequence = typeof supplierAdvanceSequences.$inferInsert;

// GST Return types
export type GstReturn = typeof gstReturns.$inferSelect;
export type NewGstReturn = typeof gstReturns.$inferInsert;
export type GstPeriodLock = typeof gstPeriodLocks.$inferSelect;
export type NewGstPeriodLock = typeof gstPeriodLocks.$inferInsert;

// Complex types with relations
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export type InvoiceWithDetails = Invoice & {
  customer: Customer;
  items: (InvoiceItem & { product: Product | null })[];
  payments: Payment[];
};

export type SupplierBillWithDetails = SupplierBill & {
  supplier: Supplier;
  items: (SupplierBillItem & { product: Product | null })[];
  payments: SupplierPayment[];
};

// ============================================================
// GLOBAL SETTINGS
// ============================================================

// Email Settings (Global - single row for app-wide email configuration)
export const emailSettings = pgTable('email_settings', {
  id: uuid('id').defaultRandom().primaryKey(),

  // SMTP Configuration
  smtpHost: varchar('smtp_host', { length: 255 }),
  smtpPort: integer('smtp_port'),
  smtpUser: varchar('smtp_user', { length: 255 }),
  smtpPassword: text('smtp_password'), // Encrypted in practice
  smtpSecure: boolean('smtp_secure').default(false), // true for port 465

  // Email Settings
  emailFrom: varchar('email_from', { length: 255 }),
  emailFromName: varchar('email_from_name', { length: 100 }),
  emailEnabled: boolean('email_enabled').notNull().default(false),

  // TLS Settings
  tlsRejectUnauthorized: boolean('tls_reject_unauthorized').default(true),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type EmailSettings = typeof emailSettings.$inferSelect;
export type NewEmailSettings = typeof emailSettings.$inferInsert;

// ============================================================
// ENUMS
// ============================================================

export enum ActivityType {
  // Auth & Account
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',

  // Team Management
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  INVITE_USER = 'INVITE_USER',
  CANCEL_INVITATION = 'CANCEL_INVITATION',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',

  // Invoice Operations
  CREATE_INVOICE = 'CREATE_INVOICE',
  SEND_INVOICE = 'SEND_INVOICE',
  EDIT_INVOICE = 'EDIT_INVOICE',
  DELETE_INVOICE = 'DELETE_INVOICE',
  VIEW_INVOICE = 'VIEW_INVOICE',

  // Payment Operations
  RECORD_PAYMENT = 'RECORD_PAYMENT',
  DELETE_PAYMENT = 'DELETE_PAYMENT',

  // Document Operations
  GENERATE_PDF = 'GENERATE_PDF',

  // Customer & Product Operations
  CREATE_CUSTOMER = 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER = 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER = 'DELETE_CUSTOMER',
  CREATE_PRODUCT = 'CREATE_PRODUCT',
  UPDATE_PRODUCT = 'UPDATE_PRODUCT',
  DELETE_PRODUCT = 'DELETE_PRODUCT',

  // Bank Account Operations
  CREATE_BANK_ACCOUNT = 'CREATE_BANK_ACCOUNT',
  UPDATE_BANK_ACCOUNT = 'UPDATE_BANK_ACCOUNT',
  DELETE_BANK_ACCOUNT = 'DELETE_BANK_ACCOUNT',

  // Payment Method Operations
  CREATE_PAYMENT_METHOD = 'CREATE_PAYMENT_METHOD',
  UPDATE_PAYMENT_METHOD = 'UPDATE_PAYMENT_METHOD',
  DELETE_PAYMENT_METHOD = 'DELETE_PAYMENT_METHOD',
}
