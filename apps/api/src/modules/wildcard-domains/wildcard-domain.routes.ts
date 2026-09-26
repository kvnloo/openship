/**
 * Wildcard domain routes - mounted at /api/wildcard-domains in app.ts.
 */

import { Hono } from "hono";
import { secureRouter } from "../../lib/secure-router";
import * as ctrl from "./wildcard-domain.controller";
import { CreateWildcardDomainBody, UpdateWildcardDomainBody } from "@repo/contracts";

const r = secureRouter(new Hono(), {
  module: "wildcard-domains",
  basePath: "/api/wildcard-domains",
});

r.get(
  "/",
  {
    tag: "domain:list",
    mcp: { description: "List all registered wildcard apex domains." },
  },
  ctrl.list,
);

r.post(
  "/",
  {
    tag: "domain:write",
    body: CreateWildcardDomainBody,
    mcp: { description: "Register a new wildcard apex domain." },
  },
  ctrl.create,
);

r.get(
  "/:id",
  {
    tag: "domain:read",
    mcp: { description: "Get a wildcard apex domain by id." },
  },
  ctrl.get,
);

r.patch(
  "/:id",
  {
    tag: "domain:write",
    body: UpdateWildcardDomainBody,
    mcp: { description: "Update a wildcard apex domain." },
  },
  ctrl.update,
);

r.delete(
  "/:id",
  {
    tag: "domain:admin",
    mcp: { description: "Delete a wildcard apex domain." },
  },
  ctrl.remove,
);

export const wildcardDomainRoutes = r.hono;
