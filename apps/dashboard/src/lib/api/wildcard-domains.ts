import { api } from "./client";
import { endpoints } from "./endpoints";
import type { WildcardDomain } from "@repo/contracts";

export interface CreateWildcardDomainPayload {
  domain: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateWildcardDomainPayload {
  description?: string;
  isDefault?: boolean;
}

export const wildcardDomainsApi = {
  list: () => api.get<{ data: WildcardDomain[] }>(endpoints.wildcardDomains.list),
  create: (body: CreateWildcardDomainPayload) =>
    api.post<{ data: WildcardDomain }>(endpoints.wildcardDomains.create, body),
  update: (id: string, body: UpdateWildcardDomainPayload) =>
    api.patch<{ data: WildcardDomain }>(endpoints.wildcardDomains.item(id), body),
  setDefault: (id: string) =>
    api.patch<{ data: WildcardDomain }>(endpoints.wildcardDomains.item(id), { isDefault: true }),
  delete: (id: string) => api.delete<{ success: boolean }>(endpoints.wildcardDomains.item(id)),
};
