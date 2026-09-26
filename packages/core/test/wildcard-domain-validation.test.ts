import { describe, expect, it } from "vitest";
import {
  normalizeWildcardApexDomain,
  isValidWildcardApexDomain,
  generateRandomHexSuffix,
  formatWildcardSubdomain,
} from "../src/utils";

describe("normalizeWildcardApexDomain", () => {
  it("normalizes standard wildcard domains with leading *.", () => {
    expect(normalizeWildcardApexDomain("*.example.com")).toBe("example.com");
    expect(normalizeWildcardApexDomain("*.staging.example.com")).toBe("staging.example.com");
    expect(normalizeWildcardApexDomain("*.preview.clients.io")).toBe("preview.clients.io");
  });

  it("handles wildcards with single asterisk prefix without dot", () => {
    expect(normalizeWildcardApexDomain("*example.com")).toBe("example.com");
  });

  it("normalizes bare apex domains without leading wildcard", () => {
    expect(normalizeWildcardApexDomain("example.com")).toBe("example.com");
    expect(normalizeWildcardApexDomain("staging.example.com")).toBe("staging.example.com");
  });

  it("handles whitespace, case, trailing dots, and schemes", () => {
    expect(normalizeWildcardApexDomain("  *.EXAMPLE.COM.  ")).toBe("example.com");
    expect(normalizeWildcardApexDomain("https://*.sub.domain.co.uk/")).toBe("sub.domain.co.uk");
  });
});

describe("isValidWildcardApexDomain", () => {
  it("accepts valid wildcard apex domains", () => {
    expect(isValidWildcardApexDomain("*.example.com")).toBe(true);
    expect(isValidWildcardApexDomain("example.com")).toBe(true);
    expect(isValidWildcardApexDomain("*.staging.example.com")).toBe(true);
    expect(isValidWildcardApexDomain("preview.clients.io")).toBe(true);
    expect(isValidWildcardApexDomain("*.apps.internal.net")).toBe(true);
  });

  it("rejects single-label domains and localhost", () => {
    expect(isValidWildcardApexDomain("localhost")).toBe(false);
    expect(isValidWildcardApexDomain("*.localhost")).toBe(false);
    expect(isValidWildcardApexDomain("com")).toBe(false);
    expect(isValidWildcardApexDomain("*.com")).toBe(false);
  });

  it("rejects IP addresses", () => {
    expect(isValidWildcardApexDomain("127.0.0.1")).toBe(false);
    expect(isValidWildcardApexDomain("*.192.168.1.1")).toBe(false);
  });

  it("rejects invalid characters, embedded wildcards, and double dots", () => {
    expect(isValidWildcardApexDomain("*.sub.*.example.com")).toBe(false);
    expect(isValidWildcardApexDomain("sub..example.com")).toBe(false);
    expect(isValidWildcardApexDomain("example_site.com")).toBe(false);
    expect(isValidWildcardApexDomain("")).toBe(false);
    expect(isValidWildcardApexDomain(" ")).toBe(false);
    expect(isValidWildcardApexDomain("*.example.com:8080")).toBe(false);
    expect(isValidWildcardApexDomain("*.example.com/path")).toBe(false);
  });
});

describe("generateRandomHexSuffix", () => {
  it("generates 6 lowercase hex characters by default", () => {
    const suffix = generateRandomHexSuffix();
    expect(suffix).toHaveLength(6);
    expect(suffix).toMatch(/^[0-9a-f]{6}$/);
  });

  it("generates unique suffixes across consecutive calls", () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateRandomHexSuffix(6));
    }
    expect(set.size).toBe(50);
  });
});

describe("formatWildcardSubdomain", () => {
  it("formats collision-resistant subdomains correctly", () => {
    const formatted = formatWildcardSubdomain("My App", "*.staging.example.com", "a1b2c3");
    expect(formatted).toBe("my-app-a1b2c3.staging.example.com");
  });

  it("generates a random suffix when none is provided", () => {
    const formatted = formatWildcardSubdomain("backend-service", "preview.clients.io");
    expect(formatted).toMatch(/^backend-service-[0-9a-f]{6}\.preview\.clients\.io$/);
  });
});
