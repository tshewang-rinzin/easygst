CREATE TABLE "supplier_bill_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"product_id" integer,
	"description" text NOT NULL,
	"quantity" numeric(15, 4) DEFAULT '1' NOT NULL,
	"unit" varchar(50),
	"unit_price" numeric(15, 2) NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(15, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_tax_exempt" boolean DEFAULT false NOT NULL,
	"gst_classification" varchar(20) DEFAULT 'STANDARD' NOT NULL,
	"item_total" numeric(15, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_bill_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp,
	"locked_by" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_bill_sequences_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "supplier_bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"bill_number" varchar(50) NOT NULL,
	"bill_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"currency" varchar(3) DEFAULT 'BTN' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"total_tax" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_discount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"amount_paid" numeric(15, 2) DEFAULT '0' NOT NULL,
	"amount_due" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"payment_terms" text,
	"notes" text,
	"terms_and_conditions" text,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp,
	"locked_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"bill_id" integer NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"transaction_id" varchar(255),
	"bank_name" varchar(100),
	"cheque_number" varchar(50),
	"notes" text,
	"receipt_number" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255),
	"phone" varchar(20),
	"mobile" varchar(20),
	"tpn" varchar(20),
	"gst_number" varchar(20),
	"address" text,
	"city" varchar(100),
	"dzongkhag" varchar(100),
	"postal_code" varchar(10),
	"bank_name" varchar(100),
	"bank_account_number" varchar(50),
	"bank_account_name" varchar(100),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
ALTER TABLE "supplier_bill_items" ADD CONSTRAINT "supplier_bill_items_bill_id_supplier_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."supplier_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bill_items" ADD CONSTRAINT "supplier_bill_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bill_sequences" ADD CONSTRAINT "supplier_bill_sequences_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_bill_id_supplier_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."supplier_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bill_item_idx" ON "supplier_bill_items" USING btree ("bill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_bill_year_idx" ON "supplier_bill_sequences" USING btree ("team_id","year");--> statement-breakpoint
CREATE INDEX "team_bill_idx" ON "supplier_bills" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bill_number_idx" ON "supplier_bills" USING btree ("team_id","bill_number");--> statement-breakpoint
CREATE INDEX "supplier_bill_idx" ON "supplier_bills" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "bill_status_idx" ON "supplier_bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bill_date_idx" ON "supplier_bills" USING btree ("bill_date");--> statement-breakpoint
CREATE INDEX "team_supplier_payment_idx" ON "supplier_payments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "bill_payment_idx" ON "supplier_payments" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "supplier_payment_date_idx" ON "supplier_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "team_supplier_idx" ON "suppliers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "supplier_email_idx" ON "suppliers" USING btree ("email");