import { and, eq, isNull, or, asc, sql } from "drizzle-orm";
import { generateId } from "@repo/core";
import type { Database } from "../client";
import { wildcardDomain } from "../schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WildcardDomain = typeof wildcardDomain.$inferSelect;
export type NewWildcardDomain = typeof wildcardDomain.$inferInsert;

export interface CreateWildcardDomainInput {
  name: string;
  domain: string;
  isDefault?: boolean;
  organizationId?: string | null;
}

export interface UpdateWildcardDomainInput {
  name?: string;
  isDefault?: boolean;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export function createWildcardDomainRepo(db: Database) {
  return {
    /**
     * Create a new wildcard domain. If it is the first wildcard domain in its scope,
     * or if isDefault is explicitly true, sets isDefault: true and demotes any existing default.
     */
    async create(data: CreateWildcardDomainInput): Promise<WildcardDomain> {
      return db.transaction(async (tx) => {
        const scopeCondition = data.organizationId
          ? eq(wildcardDomain.organizationId, data.organizationId)
          : isNull(wildcardDomain.organizationId);

        const existingCount = await tx
          .select({ count: sql<number>`count(*)` })
          .from(wildcardDomain)
          .where(scopeCondition);

        const shouldBeDefault = Boolean(data.isDefault) || Number(existingCount[0]?.count ?? 0) === 0;

        if (shouldBeDefault) {
          await tx
            .update(wildcardDomain)
            .set({ isDefault: false, updatedAt: new Date() })
            .where(and(scopeCondition, eq(wildcardDomain.isDefault, true)));
        }

        const id = generateId("wdom");
        const [created] = await tx
          .insert(wildcardDomain)
          .values({
            id,
            name: data.name,
            domain: data.domain,
            organizationId: data.organizationId ?? null,
            isDefault: shouldBeDefault,
          })
          .returning();

        return created!;
      });
    },

    /**
     * List wildcard domains. If an organizationId is provided, returns org-specific
     * wildcards plus any instance-wide wildcards.
     */
    async list(organizationId?: string | null): Promise<WildcardDomain[]> {
      const condition = organizationId
        ? or(
            eq(wildcardDomain.organizationId, organizationId),
            isNull(wildcardDomain.organizationId),
          )
        : isNull(wildcardDomain.organizationId);

      return db.query.wildcardDomain.findMany({
        where: condition,
        orderBy: [asc(wildcardDomain.createdAt)],
      });
    },

    /**
     * List strictly all wildcard domains on the instance.
     */
    async listAll(): Promise<WildcardDomain[]> {
      return db.query.wildcardDomain.findMany({
        orderBy: [asc(wildcardDomain.createdAt)],
      });
    },

    /** Find a wildcard domain by ID. */
    async findById(id: string): Promise<WildcardDomain | null> {
      const result = await db.query.wildcardDomain.findFirst({
        where: eq(wildcardDomain.id, id),
      });
      return result ?? null;
    },

    /** Find a wildcard domain by exact domain string. */
    async findByDomain(domain: string): Promise<WildcardDomain | null> {
      const result = await db.query.wildcardDomain.findFirst({
        where: eq(wildcardDomain.domain, domain),
      });
      return result ?? null;
    },

    /**
     * Get the default wildcard domain for an organization (or global instance default).
     * Prefers org-specific default, then falls back to global default.
     */
    async getDefault(organizationId?: string | null): Promise<WildcardDomain | null> {
      if (organizationId) {
        const orgDefault = await db.query.wildcardDomain.findFirst({
          where: and(
            eq(wildcardDomain.organizationId, organizationId),
            eq(wildcardDomain.isDefault, true),
          ),
        });
        if (orgDefault) return orgDefault;
      }

      const globalDefault = await db.query.wildcardDomain.findFirst({
        where: and(
          isNull(wildcardDomain.organizationId),
          eq(wildcardDomain.isDefault, true),
        ),
      });

      return globalDefault ?? null;
    },

    /**
     * Set a wildcard domain as the default within its scope.
     * Demotes the current default in the same transaction.
     */
    async setDefault(id: string): Promise<WildcardDomain | null> {
      return db.transaction(async (tx) => {
        const target = await tx.query.wildcardDomain.findFirst({
          where: eq(wildcardDomain.id, id),
        });
        if (!target) return null;

        const scopeCondition = target.organizationId
          ? eq(wildcardDomain.organizationId, target.organizationId)
          : isNull(wildcardDomain.organizationId);

        await tx
          .update(wildcardDomain)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(scopeCondition, eq(wildcardDomain.isDefault, true)));

        const [updated] = await tx
          .update(wildcardDomain)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(wildcardDomain.id, id))
          .returning();

        return updated ?? null;
      });
    },

    /**
     * Update a wildcard domain (name, isDefault).
     */
    async update(id: string, patch: UpdateWildcardDomainInput): Promise<WildcardDomain | null> {
      if (patch.isDefault) {
        return this.setDefault(id).then(async (updated) => {
          if (!updated || !patch.name) return updated;
          const [renamed] = await db
            .update(wildcardDomain)
            .set({ name: patch.name, updatedAt: new Date() })
            .where(eq(wildcardDomain.id, id))
            .returning();
          return renamed ?? null;
        });
      }

      const [updated] = await db
        .update(wildcardDomain)
        .set({
          ...(patch.name ? { name: patch.name } : {}),
          ...(patch.isDefault !== undefined ? { isDefault: patch.isDefault } : {}),
          updatedAt: new Date(),
        })
        .where(eq(wildcardDomain.id, id))
        .returning();

      return updated ?? null;
    },

    /**
     * Delete a wildcard domain by ID.
     * If the deleted domain was the default, automatically promotes the oldest
     * remaining domain in the same scope to be the new default.
     */
    async remove(id: string): Promise<boolean> {
      return db.transaction(async (tx) => {
        const target = await tx.query.wildcardDomain.findFirst({
          where: eq(wildcardDomain.id, id),
        });
        if (!target) return false;

        await tx.delete(wildcardDomain).where(eq(wildcardDomain.id, id));

        if (target.isDefault) {
          const scopeCondition = target.organizationId
            ? eq(wildcardDomain.organizationId, target.organizationId)
            : isNull(wildcardDomain.organizationId);

          const next = await tx.query.wildcardDomain.findFirst({
            where: scopeCondition,
            orderBy: [asc(wildcardDomain.createdAt)],
          });

          if (next) {
            await tx
              .update(wildcardDomain)
              .set({ isDefault: true, updatedAt: new Date() })
              .where(eq(wildcardDomain.id, next.id));
          }
        }

        return true;
      });
    },
  };
}
