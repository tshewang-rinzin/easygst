CREATE TABLE "credit_note_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"credit_note_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"applied_amount" numeric(15, 2) NOT NULL,
	"application_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_note_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_note_id" uuid NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(15, 4) DEFAULT '1' NOT NULL,
	"unit" varchar(50),
	"unit_price" numeric(15, 2) NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"gst_classification" varchar(20) DEFAULT 'STANDARD' NOT NULL,
	"item_total" numeric(15, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_note_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp,
	"locked_by" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_note_sequences_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_id" uuid,
	"credit_note_number" varchar(50) NOT NULL,
	"credit_note_date" timestamp DEFAULT now() NOT NULL,
	"currency" varchar(3) DEFAULT 'BTN' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"total_tax" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"applied_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"unapplied_amount" numeric(15, 2) NOT NULL,
	"refunded_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"customer_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debit_note_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"debit_note_id" uuid NOT NULL,
	"bill_id" uuid NOT NULL,
	"applied_amount" numeric(15, 2) NOT NULL,
	"application_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debit_note_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debit_note_id" uuid NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(15, 4) DEFAULT '1' NOT NULL,
	"unit" varchar(50),
	"unit_price" numeric(15, 2) NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"gst_classification" varchar(20) DEFAULT 'STANDARD' NOT NULL,
	"item_total" numeric(15, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debit_note_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp,
	"locked_by" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "debit_note_sequences_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "debit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"bill_id" uuid,
	"debit_note_number" varchar(50) NOT NULL,
	"debit_note_date" timestamp DEFAULT now() NOT NULL,
	"currency" varchar(3) DEFAULT 'BTN' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"total_tax" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"applied_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"unapplied_amount" numeric(15, 2) NOT NULL,
	"refunded_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"supplier_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_payments" ADD COLUMN "reversed_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD COLUMN "reversed_reason" text;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD COLUMN "reversal_of_id" uuid;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD COLUMN "is_reversal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancelled_reason" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancelled_by_id" uuid;--> statement-breakpoint
ALTER TABLE "platform_admins" ADD COLUMN "password_reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "platform_admins" ADD COLUMN "password_reset_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD COLUMN "cancelled_reason" text;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD COLUMN "cancelled_by_id" uuid;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "reversed_at" timestamp;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "reversed_reason" text;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "reversal_of_id" uuid;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "is_reversal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "credit_note_applications" ADD CONSTRAINT "credit_note_applications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_applications" ADD CONSTRAINT "credit_note_applications_credit_note_id_credit_notes_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."credit_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_applications" ADD CONSTRAINT "credit_note_applications_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_applications" ADD CONSTRAINT "credit_note_applications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_credit_note_id_credit_notes_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."credit_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_sequences" ADD CONSTRAINT "credit_note_sequences_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_note_applications" ADD CONSTRAINT "debit_note_applications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_note_applications" ADD CONSTRAINT "debit_note_applications_debit_note_id_debit_notes_id_fk" FOREIGN KEY ("debit_note_id") REFERENCES "public"."debit_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_note_applications" ADD CONSTRAINT "debit_note_applications_bill_id_supplier_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."supplier_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_note_applications" ADD CONSTRAINT "debit_note_applications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_note_items" ADD CONSTRAINT "debit_note_items_debit_note_id_debit_notes_id_fk" FOREIGN KEY ("debit_note_id") REFERENCES "public"."debit_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_note_items" ADD CONSTRAINT "debit_note_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_note_sequences" ADD CONSTRAINT "debit_note_sequences_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_bill_id_supplier_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."supplier_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_note_application_idx" ON "credit_note_applications" USING btree ("credit_note_id");--> statement-breakpoint
CREATE INDEX "invoice_application_idx" ON "credit_note_applications" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "credit_note_item_idx" ON "credit_note_items" USING btree ("credit_note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_credit_note_year_idx" ON "credit_note_sequences" USING btree ("team_id","year");--> statement-breakpoint
CREATE INDEX "team_credit_note_idx" ON "credit_notes" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_note_number_idx" ON "credit_notes" USING btree ("team_id","credit_note_number");--> statement-breakpoint
CREATE INDEX "customer_credit_note_idx" ON "credit_notes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoice_credit_note_idx" ON "credit_notes" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "credit_note_date_idx" ON "credit_notes" USING btree ("credit_note_date");--> statement-breakpoint
CREATE INDEX "debit_note_application_idx" ON "debit_note_applications" USING btree ("debit_note_id");--> statement-breakpoint
CREATE INDEX "bill_application_idx" ON "debit_note_applications" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "debit_note_item_idx" ON "debit_note_items" USING btree ("debit_note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_debit_note_year_idx" ON "debit_note_sequences" USING btree ("team_id","year");--> statement-breakpoint
CREATE INDEX "team_debit_note_idx" ON "debit_notes" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "debit_note_number_idx" ON "debit_notes" USING btree ("team_id","debit_note_number");--> statement-breakpoint
CREATE INDEX "supplier_debit_note_idx" ON "debit_notes" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "bill_debit_note_idx" ON "debit_notes" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "debit_note_date_idx" ON "debit_notes" USING btree ("debit_note_date");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;