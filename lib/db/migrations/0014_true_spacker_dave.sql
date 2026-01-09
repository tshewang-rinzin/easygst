CREATE TABLE "customer_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"allocated_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"unallocated_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_gateway" varchar(100),
	"transaction_id" varchar(255),
	"bank_name" varchar(255),
	"cheque_number" varchar(50),
	"receipt_number" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"customer_payment_id" integer NOT NULL,
	"invoice_id" integer NOT NULL,
	"allocated_amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_customer_payment_id_customer_payments_id_fk" FOREIGN KEY ("customer_payment_id") REFERENCES "public"."customer_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_customer_payment_idx" ON "customer_payments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "customer_payment_idx" ON "customer_payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_payment_date_idx" ON "customer_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "receipt_number_idx" ON "customer_payments" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "team_payment_allocation_idx" ON "payment_allocations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "customer_payment_allocation_idx" ON "payment_allocations" USING btree ("customer_payment_id");--> statement-breakpoint
CREATE INDEX "invoice_allocation_idx" ON "payment_allocations" USING btree ("invoice_id");