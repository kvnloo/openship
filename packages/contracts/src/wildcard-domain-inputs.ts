/**
 * Wildcard domain inputs shared by HTTP, native, and remote callers.
 */

import { Type, type Static } from "@sinclair/typebox";

// ─── Route params ────────────────────────────────────────────────────────────

export const WildcardDomainIdParam = Type.Object({
  id: Type.String({ minLength: 1 }),
});
export type WildcardDomainIdParam = Static<typeof WildcardDomainIdParam>;

// ─── Request bodies ──────────────────────────────────────────────────────────

export const CreateWildcardDomainBody = Type.Object({
  /** Apex or base wildcard domain (e.g. "staging.example.com" or "*.staging.example.com") */
  domain: Type.String({
    minLength: 1,
    maxLength: 253,
    description: "The wildcard apex domain (e.g. staging.example.com or *.staging.example.com)",
  }),
  description: Type.Optional(Type.String({ maxLength: 500 })),
  isDefault: Type.Optional(Type.Boolean({ default: false })),
});
export type CreateWildcardDomainBody = Static<typeof CreateWildcardDomainBody>;

export const UpdateWildcardDomainBody = Type.Object({
  description: Type.Optional(Type.String({ maxLength: 500 })),
  isDefault: Type.Optional(Type.Boolean()),
});
export type UpdateWildcardDomainBody = Static<typeof UpdateWildcardDomainBody>;
