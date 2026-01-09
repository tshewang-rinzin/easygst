CREATE TABLE "supplier_bill_adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"bill_id" integer NOT NULL,
	"adjustment_type" varchar(50) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text NOT NULL,
	"reference_number" varchar(100),
	"adjustment_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplier_bill_adjustments" ADD CONSTRAINT "supplier_bill_adjustments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bill_adjustments" ADD CONSTRAINT "supplier_bill_adjustments_bill_id_supplier_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."supplier_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bill_adjustments" ADD CONSTRAINT "supplier_bill_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_bill_adjustment_idx" ON "supplier_bill_adjustments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "bill_adjustment_idx" ON "supplier_bill_adjustments" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_adjustment_date_idx" ON "supplier_bill_adjustments" USING btree ("adjustment_date");