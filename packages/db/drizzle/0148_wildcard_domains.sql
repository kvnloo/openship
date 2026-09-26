CREATE TABLE "wildcard_domain" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text REFERENCES "organization"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wildcard_domain_domain" ON "wildcard_domain" ("domain");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wildcard_domain_default_global" ON "wildcard_domain" ("is_default") WHERE "is_default" = true AND "organization_id" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wildcard_domain_default_org" ON "wildcard_domain" ("organization_id", "is_default") WHERE "is_default" = true AND "organization_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "idx_wildcard_domain_org" ON "wildcard_domain" ("organization_id");
