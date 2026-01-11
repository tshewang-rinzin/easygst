CREATE TABLE "email_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"smtp_host" varchar(255),
	"smtp_port" integer,
	"smtp_user" varchar(255),
	"smtp_password" text,
	"smtp_secure" boolean DEFAULT false,
	"email_from" varchar(255),
	"email_from_name" varchar(100),
	"email_enabled" boolean DEFAULT false NOT NULL,
	"tls_reject_unauthorized" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
