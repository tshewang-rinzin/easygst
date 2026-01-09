CREATE TABLE "customer_advance_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp,
	"locked_by" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_advance_sequences_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "supplier_advance_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp,
	"locked_by" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_advance_sequences_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "supplier_payment_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"supplier_payment_id" integer NOT NULL,
	"bill_id" integer NOT NULL,
	"allocated_amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplier_payments" ALTER COLUMN "bill_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD COLUMN "payment_type" varchar(20) DEFAULT 'payment' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD COLUMN "advance_number" varchar(50);--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "allocated_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "unallocated_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "payment_type" varchar(20) DEFAULT 'payment' NOT NULL;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "advance_number" varchar(50);--> statement-breakpoint
-- Migrate existing supplier payments to use allocation system
INSERT INTO "supplier_payment_allocations"
	(team_id, supplier_payment_id, bill_id, allocated_amount, created_at, created_by)
SELECT
	sp.team_id,
	sp.id,
	sp.bill_id,
	sp.amount,
	sp.created_at,
	sp.created_by
FROM supplier_payments sp
WHERE sp.bill_id IS NOT NULL;
--> statement-breakpoint
-- Update allocated_amount for existing payments
UPDATE supplier_payments sp
SET
	allocated_amount = sp.amount,
	unallocated_amount = '0.00',
	payment_type = 'payment'
WHERE sp.bill_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "customer_advance_sequences" ADD CONSTRAINT "customer_advance_sequences_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_advance_sequences" ADD CONSTRAINT "supplier_advance_sequences_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ADD CONSTRAINT "supplier_payment_allocations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ADD CONSTRAINT "supplier_payment_allocations_supplier_payment_id_supplier_payments_id_fk" FOREIGN KEY ("supplier_payment_id") REFERENCES "public"."supplier_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ADD CONSTRAINT "supplier_payment_allocations_bill_id_supplier_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."supplier_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocations" ADD CONSTRAINT "supplier_payment_allocations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_customer_advance_year_idx" ON "customer_advance_sequences" USING btree ("team_id","year");--> statement-breakpoint
CREATE UNIQUE INDEX "team_supplier_advance_year_idx" ON "supplier_advance_sequences" USING btree ("team_id","year");--> statement-breakpoint
CREATE INDEX "team_supplier_payment_allocation_idx" ON "supplier_payment_allocations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "supplier_payment_allocation_idx" ON "supplier_payment_allocations" USING btree ("supplier_payment_id");--> statement-breakpoint
CREATE INDEX "bill_allocation_idx" ON "supplier_payment_allocations" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "advance_number_customer_idx" ON "customer_payments" USING btree ("advance_number");--> statement-breakpoint
CREATE INDEX "payment_type_customer_idx" ON "customer_payments" USING btree ("payment_type");--> statement-breakpoint
CREATE INDEX "advance_number_supplier_idx" ON "supplier_payments" USING btree ("advance_number");--> statement-breakpoint
CREATE INDEX "payment_type_supplier_idx" ON "supplier_payments" USING btree ("payment_type");