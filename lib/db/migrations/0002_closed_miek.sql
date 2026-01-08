ALTER TABLE "tax_settings" ALTER COLUMN "tax_type" SET DEFAULT 'gst';--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "default_gst_rate" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "gst_registered" boolean DEFAULT false NOT NULL;