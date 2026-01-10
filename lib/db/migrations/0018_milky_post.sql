ALTER TABLE "invitations" ADD COLUMN "invitation_token" varchar(255);--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "invitation_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "last_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "email_sent_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitation_token_unique" UNIQUE("invitation_token");