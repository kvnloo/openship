import { describe, expect, it } from "vitest";
import {
  normalizeWildcardApexDomain,
  isValidWildcardApexDomain,
  generateRandomHexSuffix,
  formatWildcardSubdomain,
} from "../src/utils";

// Unit test implementation of resolveManagedHostname matching platform's routing-domains logic
function resolveManagedHostname(
  hostname: string,
  knownWildcardDomains?: string[],
  baseDomain = "opsh.io",
): { isManaged: boolean; subdomain?: string; wildcardDomain?: string } {
  const normalized = hostname.trim().toLowerCase();
  const bases = [
    ...(knownWildcardDomains?.map((d) => d.trim().toLowerCase()) ?? []),
    baseDomain.toLowerCase(),
  ];

  for (const base of bases) {
    const suffix = `.${base}`;
    if (normalized.endsWith(suffix)) {
      const subdomain = normalized.slice(0, -suffix.length);
      if (subdomain.length > 0) {
        return {
          isManaged: true,
          subdomain,
          wildcardDomain: base,
        };
      }
    }
  }

  return { isManaged: false };
}

// Unit test implementation of managedHostnameToSlug matching platform's public-endpoints logic
function managedHostnameToSlug(
  hostname: string,
  knownWildcardApexes?: string[],
  baseDomain = "opsh.io",
): string | undefined {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return undefined;
  const bases = [
    ...(knownWildcardApexes?.map((d) => d.trim().toLowerCase()) ?? []),
    baseDomain.trim().toLowerCase(),
  ];
  for (const base of bases) {
    const suffix = `.${base}`;
    if (normalized.endsWith(suffix)) {
      const slug = normalized.slice(0, -suffix.length);
      if (slug) return slug;
    }
  }
  return undefined;
}

// Unit test implementation of collision-resistant unique slug matching project-crud logic
function generateUniqueSubdomain(
  baseSlug: string,
  wildcardApex: string,
  existingHostnames: Set<string>,
): string {
  const primaryHostname = `${baseSlug}.${wildcardApex}`.toLowerCase();
  if (!existingHostnames.has(primaryHostname)) {
    return baseSlug;
  }

  const hexSuffix = generateRandomHexSuffix(6);
  const hexCandidate = `${baseSlug}-${hexSuffix}`;
  const hexHostname = `${hexCandidate}.${wildcardApex}`.toLowerCase();
  if (!existingHostnames.has(hexHostname)) {
    return hexCandidate;
  }

  let suffix = 2;
  while (existingHostnames.has(`${baseSlug}-${suffix}.${wildcardApex}`.toLowerCase())) {
    suffix += 1;
  }
  return `${baseSlug}-${suffix}`;
}

describe("Multi-Wildcard Routing Resolution", () => {
  const wildcardDomains = ["staging.example.com", "preview.clients.io"];

  it("recognizes subdomains of default base domain", () => {
    const res = resolveManagedHostname("my-app.opsh.io", wildcardDomains, "opsh.io");
    expect(res.isManaged).toBe(true);
    expect(res.subdomain).toBe("my-app");
    expect(res.wildcardDomain).toBe("opsh.io");
  });

  it("recognizes subdomains of registered multi-wildcard domains", () => {
    const res1 = resolveManagedHostname(
      "api-test.staging.example.com",
      wildcardDomains,
      "opsh.io",
    );
    expect(res1.isManaged).toBe(true);
    expect(res1.subdomain).toBe("api-test");
    expect(res1.wildcardDomain).toBe("staging.example.com");

    const res2 = resolveManagedHostname(
      "client-123.preview.clients.io",
      wildcardDomains,
      "opsh.io",
    );
    expect(res2.isManaged).toBe(true);
    expect(res2.subdomain).toBe("client-123");
    expect(res2.wildcardDomain).toBe("preview.clients.io");
  });

  it("identifies custom domains not belonging to any wildcard apex as unmanaged", () => {
    const res = resolveManagedHostname(
      "mycustomdomain.com",
      wildcardDomains,
      "opsh.io",
    );
    expect(res.isManaged).toBe(false);
    expect(res.subdomain).toBeUndefined();
  });

  it("extracts slug from hostname under any wildcard apex", () => {
    expect(
      managedHostnameToSlug("my-service.staging.example.com", wildcardDomains),
    ).toBe("my-service");

    expect(
      managedHostnameToSlug("dashboard.preview.clients.io", wildcardDomains),
    ).toBe("dashboard");

    expect(
      managedHostnameToSlug("legacy.opsh.io", wildcardDomains),
    ).toBe("legacy");

    expect(
      managedHostnameToSlug("random-external.com", wildcardDomains),
    ).toBeUndefined();
  });
});

describe("Collision-resistant Subdomain Provisioning", () => {
  it("uses base slug when hostname is free", () => {
    const existing = new Set<string>();
    const slug = generateUniqueSubdomain("my-app", "staging.example.com", existing);
    expect(slug).toBe("my-app");
  });

  it("generates a random hex suffix when common base slug is already taken", () => {
    const existing = new Set<string>(["web.staging.example.com"]);
    const slug = generateUniqueSubdomain("web", "staging.example.com", existing);
    expect(slug).toMatch(/^web-[a-f0-9]{6}$/);
    const fullFqdn = formatWildcardSubdomain("web", "staging.example.com", slug.replace("web-", ""));
    expect(fullFqdn).toBe(`${slug}.staging.example.com`);
  });

  it("produces distinct collision-resistant hostnames for multiple tenants with same app name", () => {
    const existing = new Set<string>();
    const slug1 = generateUniqueSubdomain("api", "staging.example.com", existing);
    existing.add(`${slug1}.staging.example.com`);

    const slug2 = generateUniqueSubdomain("api", "staging.example.com", existing);
    existing.add(`${slug2}.staging.example.com`);

    expect(slug1).toBe("api");
    expect(slug2).toMatch(/^api-[a-f0-9]{6}$/);
    expect(slug1).not.toBe(slug2);
  });
});
