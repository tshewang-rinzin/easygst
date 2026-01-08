CREATE TABLE "tax_classifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"tax_rate" numeric(5, 2) NOT NULL,
	"can_claim_input_credits" boolean DEFAULT true NOT NULL,
	"color" varchar(50) DEFAULT 'blue',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tax_classifications" ADD CONSTRAINT "tax_classifications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_classifications" ADD CONSTRAINT "tax_classifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_classification_idx" ON "tax_classifications" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_classification_code_idx" ON "tax_classifications" USING btree ("team_id","code");