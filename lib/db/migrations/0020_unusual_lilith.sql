ALTER TABLE "activity_logs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bank_accounts" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bank_accounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "bank_accounts" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customer_advance_sequences" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customer_advance_sequences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "customer_advance_sequences" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customer_payments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customer_payments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "customer_payments" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customer_payments" ALTER COLUMN "customer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customer_payments" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "gst_period_locks" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "gst_period_locks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "gst_period_locks" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "gst_period_locks" ALTER COLUMN "locked_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "gst_period_locks" ALTER COLUMN "gst_return_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "gst_returns" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "gst_returns" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "gst_returns" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "gst_returns" ALTER COLUMN "filed_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "gst_returns" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "invited_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_adjustments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_adjustments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoice_adjustments" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_adjustments" ALTER COLUMN "invoice_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_adjustments" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_deliveries" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_deliveries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoice_deliveries" ALTER COLUMN "invoice_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_deliveries" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "invoice_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "product_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_sequences" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_sequences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoice_sequences" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "customer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "locked_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payment_allocations" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payment_allocations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "payment_allocations" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payment_allocations" ALTER COLUMN "customer_payment_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payment_allocations" ALTER COLUMN "invoice_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payment_allocations" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "invoice_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "product_categories" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "product_categories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "product_categories" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_advance_sequences" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_advance_sequences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "supplier_advance_sequences" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_adjustments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_adjustments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "supplier_bill_adjustments" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_adjustments" ALTER COLUMN "bill_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_adjustments" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "supplier_bill_items" ALTER COLUMN "bill_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_items" ALTER COLUMN "product_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_sequences" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bill_sequences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "supplier_bill_sequences" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bills" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bills" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "supplier_bills" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bills" ALTER COLUMN "supplier_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bills" ALTER COLUMN "locked_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_bills" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ALTER COLUMN "supplier_payment_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ALTER COLUMN "bill_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "supplier_payments" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payments" ALTER COLUMN "bill_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "supplier_payments" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tax_classifications" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tax_classifications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tax_classifications" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tax_classifications" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tax_settings" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tax_settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tax_settings" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "units" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "units" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "units" ALTER COLUMN "team_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "units" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();