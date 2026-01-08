CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_method_idx" ON "payment_methods" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_code_idx" ON "payment_methods" USING btree ("team_id","code");