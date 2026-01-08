CREATE TABLE "bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"account_name" varchar(100) NOT NULL,
	"branch" varchar(100),
	"account_type" varchar(50),
	"payment_method" varchar(50) NOT NULL,
	"qr_code_url" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "gst_number" varchar(20);--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_bank_idx" ON "bank_accounts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_default_bank_idx" ON "bank_accounts" USING btree ("team_id","is_default");