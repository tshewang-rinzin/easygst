CREATE TABLE "gst_period_locks" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"locked_at" timestamp DEFAULT now() NOT NULL,
	"locked_by" integer NOT NULL,
	"reason" text,
	"gst_return_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gst_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"return_number" varchar(50) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"return_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"output_gst" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"input_gst" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"net_gst_payable" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"adjustments" numeric(15, 2) DEFAULT '0.00',
	"previous_period_balance" numeric(15, 2) DEFAULT '0.00',
	"penalties" numeric(15, 2) DEFAULT '0.00',
	"interest" numeric(15, 2) DEFAULT '0.00',
	"total_payable" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"filing_date" timestamp,
	"due_date" timestamp NOT NULL,
	"filed_by" integer,
	"sales_breakdown" jsonb,
	"purchases_breakdown" jsonb,
	"notes" text,
	"amendments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
ALTER TABLE "gst_period_locks" ADD CONSTRAINT "gst_period_locks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gst_period_locks" ADD CONSTRAINT "gst_period_locks_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gst_period_locks" ADD CONSTRAINT "gst_period_locks_gst_return_id_gst_returns_id_fk" FOREIGN KEY ("gst_return_id") REFERENCES "public"."gst_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gst_returns" ADD CONSTRAINT "gst_returns_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gst_returns" ADD CONSTRAINT "gst_returns_filed_by_users_id_fk" FOREIGN KEY ("filed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gst_returns" ADD CONSTRAINT "gst_returns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gst_period_locks_team_period_idx" ON "gst_period_locks" USING btree ("team_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "gst_returns_team_period_idx" ON "gst_returns" USING btree ("team_id","period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "gst_returns_return_number_idx" ON "gst_returns" USING btree ("team_id","return_number");