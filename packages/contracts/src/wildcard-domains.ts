import { Type, type Static } from "@sinclair/typebox";

const nullableString = Type.Union([Type.String(), Type.Null()]);

export const WildcardDomainSchema = Type.Object({
  id: Type.String(),
  domain: Type.String(),
  displayDomain: Type.String(),
  description: nullableString,
  isDefault: Type.Boolean(),
  organizationId: nullableString,
  createdAt: Type.String(),
  updatedAt: Type.String(),
});
export type WildcardDomain = Static<typeof WildcardDomainSchema>;

export const WildcardDomainListSchema = Type.Array(WildcardDomainSchema);
export type WildcardDomainList = Static<typeof WildcardDomainListSchema>;
