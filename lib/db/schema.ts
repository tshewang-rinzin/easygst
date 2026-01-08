import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// USER MANAGEMENT
// ============================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
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
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// Bank Accounts - Multiple accounts per team with QR codes
export const bankAccounts = pgTable('bank_accounts', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
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

// ============================================================
// INVOICE SYSTEM
// ============================================================

// Customers/Clients
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
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
  createdBy: integer('created_by').references(() => users.id),
}, (table) => ({
  teamCustomerIdx: index('team_customer_idx').on(table.teamId),
  customerEmailIdx: index('customer_email_idx').on(table.email),
}));

// Product Categories (Master Data per Team)
export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
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
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(), // piece, kg, liter, hour, etc.
  abbreviation: varchar('abbreviation', { length: 20 }).notNull(), // pcs, kg, L, hr, etc.
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamUnitIdx: index('team_unit_idx').on(table.teamId),
  teamUnitNameIdx: uniqueIndex('team_unit_name_idx').on(table.teamId, table.name),
}));

// Tax Classifications (GST Categories)
export const taxClassifications = pgTable('tax_classifications', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
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
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamClassificationIdx: index('team_classification_idx').on(table.teamId),
  teamClassificationCodeIdx: uniqueIndex('team_classification_code_idx').on(table.teamId, table.code),
}));

// Products/Services
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
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
  categoryId: integer('category_id').references(() => productCategories.id),
  category: varchar('category', { length: 100 }), // Kept for backward compatibility and manual entry

  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
}, (table) => ({
  teamProductIdx: index('team_product_idx').on(table.teamId),
  productSkuIdx: index('product_sku_idx').on(table.sku),
}));

// Invoices
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),

  // Invoice Identification
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
  lockedBy: integer('locked_by').references(() => users.id),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamInvoiceIdx: index('team_invoice_idx').on(table.teamId),
  invoiceNumberIdx: uniqueIndex('invoice_number_idx').on(table.teamId, table.invoiceNumber),
  customerInvoiceIdx: index('customer_invoice_idx').on(table.customerId),
  invoiceStatusIdx: index('invoice_status_idx').on(table.status),
  invoiceDateIdx: index('invoice_date_idx').on(table.invoiceDate),
}));

// Invoice Items (Line Items)
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id), // Nullable - can be ad-hoc items

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
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  invoiceId: integer('invoice_id')
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
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamAdjustmentIdx: index('team_adjustment_idx').on(table.teamId),
  invoiceAdjustmentIdx: index('invoice_adjustment_idx').on(table.invoiceId),
  adjustmentDateIdx: index('adjustment_date_idx').on(table.adjustmentDate),
}));

// Payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  invoiceId: integer('invoice_id')
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
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
}, (table) => ({
  teamPaymentIdx: index('team_payment_idx').on(table.teamId),
  invoicePaymentIdx: index('invoice_payment_idx').on(table.invoiceId),
  paymentDateIdx: index('payment_date_idx').on(table.paymentDate),
}));

// Tax Settings (for different tax rates and compliance)
export const taxSettings = pgTable('tax_settings', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
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
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
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
  createdBy: integer('created_by').references(() => users.id),
}, (table) => ({
  invoiceDeliveryIdx: index('invoice_delivery_idx').on(table.invoiceId),
  deliveryMethodIdx: index('delivery_method_idx').on(table.deliveryMethod),
}));

// Invoice Sequence (for gap-free sequential numbering - concurrency safe)
export const invoiceSequences = pgTable('invoice_sequences', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
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
// RELATIONS
// ============================================================

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  customers: many(customers),
  products: many(products),
  invoices: many(invoices),
  payments: many(payments),
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

// Customer types
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

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

// Payment types
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// Tax types
export type TaxSetting = typeof taxSettings.$inferSelect;
export type NewTaxSetting = typeof taxSettings.$inferInsert;

// Delivery types
export type InvoiceDelivery = typeof invoiceDeliveries.$inferSelect;
export type NewInvoiceDelivery = typeof invoiceDeliveries.$inferInsert;

// Sequence types
export type InvoiceSequence = typeof invoiceSequences.$inferSelect;
export type NewInvoiceSequence = typeof invoiceSequences.$inferInsert;

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
}
