import { pgTable, text, timestamp, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organization } from "./organization";

// ─── Wildcard Domains ────────────────────────────────────────────────────────

/**
 * Wildcard apex domains (e.g. "staging.example.com", "preview.clients.io").
 *
 * Used during project provisioning to generate collision-resistant subdomains
 * of the form `${slug}-${randomHex(6)}.${wildcardApex}`.
 *
 * Can be instance-wide (organizationId = null) or scoped to an organization.
 * At most one default wildcard domain can exist per scope (enforced by partial
 * unique indexes).
 */
export const wildcardDomain = pgTable(
  "wildcard_domain",
  {
    id: text("id").primaryKey(), // "wdom_..."
    /** Organization that owns this wildcard domain (null = instance-wide). */
    organizationId: text("organization_id")
      .references(() => organization.id, { onDelete: "cascade" }),

    /** Human-readable label (e.g. "Staging Environment", "Clients Preview"). */
    name: text("name").notNull(),

    /** Normalized apex domain (e.g. "staging.example.com", without leading "*."). */
    domain: text("domain").notNull(),

    /** Whether this is the default wildcard domain for new projects in this scope. */
    isDefault: boolean("is_default").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    // Unique domain per instance (two entries cannot claim the same apex)
    uniqueIndex("uq_wildcard_domain_domain").on(t.domain),
    // Enforce at most one default wildcard domain for instance-level wildcards
    uniqueIndex("uq_wildcard_domain_default_global")
      .on(t.isDefault)
      .where(sql`${t.isDefault} = true AND ${t.organizationId} IS NULL`),
    // Enforce at most one default wildcard domain per organization
    uniqueIndex("uq_wildcard_domain_default_org")
      .on(t.organizationId, t.isDefault)
      .where(sql`${t.isDefault} = true AND ${t.organizationId} IS NOT NULL`),
    index("idx_wildcard_domain_org").on(t.organizationId),
  ],
);
