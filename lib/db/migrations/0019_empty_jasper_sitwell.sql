ALTER TABLE "invoices" ADD COLUMN "public_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_public_id_idx" ON "invoices" USING btree ("public_id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_public_id_unique" UNIQUE("public_id");