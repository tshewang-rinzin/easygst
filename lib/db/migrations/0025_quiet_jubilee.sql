CREATE TABLE "contract_billing_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"period_label" varchar(100),
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"due_date" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invoice_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"percentage" numeric(5, 2),
	"amount" numeric(15, 2) NOT NULL,
	"due_date" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invoice_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp,
	"locked_by" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contract_sequences_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"total_value" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'BTN' NOT NULL,
	"total_invoiced" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_paid" numeric(15, 2) DEFAULT '0' NOT NULL,
	"remaining_value" numeric(15, 2) NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"billing_frequency" varchar(20),
	"next_billing_date" timestamp,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"terms" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "contract_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "contract_milestone_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "contract_billing_schedule_id" uuid;--> statement-breakpoint
ALTER TABLE "contract_billing_schedule" ADD CONSTRAINT "contract_billing_schedule_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_billing_schedule" ADD CONSTRAINT "contract_billing_schedule_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_milestones" ADD CONSTRAINT "contract_milestones_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_milestones" ADD CONSTRAINT "contract_milestones_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_sequences" ADD CONSTRAINT "contract_sequences_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contract_billing_idx" ON "contract_billing_schedule" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "billing_due_date_idx" ON "contract_billing_schedule" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "contract_milestone_idx" ON "contract_milestones" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_contract_year_idx" ON "contract_sequences" USING btree ("team_id","year");--> statement-breakpoint
CREATE INDEX "team_contract_idx" ON "contracts" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contract_number_idx" ON "contracts" USING btree ("team_id","contract_number");--> statement-breakpoint
CREATE INDEX "customer_contract_idx" ON "contracts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "contract_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contract_type_idx" ON "contracts" USING btree ("type");