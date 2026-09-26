/**
 * HTTP controller for Multi-Wildcard Domains (Issue #819).
 */

import type { Context } from "hono";
import type { CreateWildcardDomainBody, UpdateWildcardDomainBody } from "@repo/contracts";
import {
  createWildcardDomain,
  listWildcardDomains,
  getWildcardDomainById,
  updateWildcardDomain,
  deleteWildcardDomain,
} from "@repo/platform/engine/modules/domains/wildcard-domain.service";
import { param } from "../../lib/controller-helpers";
import { operationContext } from "../../lib/operation-context";

export async function list(c: Context) {
  const organizationId = operationContext(c).organizationId;
  const data = await listWildcardDomains(organizationId);
  return c.json({ data });
}

export async function create(c: Context) {
  const body = await c.req.json<CreateWildcardDomainBody>();
  const organizationId = operationContext(c).organizationId;
  const created = await createWildcardDomain(body, organizationId);
  return c.json({ data: created }, 201);
}

export async function get(c: Context) {
  const id = param(c, "id");
  const organizationId = operationContext(c).organizationId;
  const data = await getWildcardDomainById(id, organizationId);
  return c.json({ data });
}

export async function update(c: Context) {
  const id = param(c, "id");
  const body = await c.req.json<UpdateWildcardDomainBody>();
  const organizationId = operationContext(c).organizationId;
  const data = await updateWildcardDomain(id, body, organizationId);
  return c.json({ data });
}

export async function remove(c: Context) {
  const id = param(c, "id");
  const organizationId = operationContext(c).organizationId;
  const result = await deleteWildcardDomain(id, organizationId);
  return c.json(result);
}
