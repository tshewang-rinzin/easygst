ALTER TABLE "payments" ADD COLUMN "adjustment_amount" numeric(15, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "adjustment_reason" varchar(100);