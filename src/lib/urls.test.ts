import { describe, expect, it } from "vitest";
import { getHostname, isHttps, normalizeUrl } from "./urls";

describe("normalizeUrl", () => {
  it("adds https:// when no scheme is present", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("preserves an existing https scheme", () => {
    expect(normalizeUrl("https://example.com/path?q=1#frag")).toBe(
      "https://example.com/path?q=1#frag",
    );
  });

  it("preserves an existing http scheme", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUrl("  example.com  ")).toBe("https://example.com/");
  });

  it("returns null for empty input", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(normalizeUrl("not a url")).toBeNull();
  });
});

describe("getHostname", () => {
  it("returns the lowercased hostname", () => {
    expect(getHostname("https://Example.COM/path")).toBe("example.com");
  });

  it("returns null for invalid URLs", () => {
    expect(getHostname("invalid")).toBeNull();
  });
});

describe("isHttps", () => {
  it("returns true for https URLs", () => {
    expect(isHttps("https://example.com")).toBe(true);
  });

  it("returns false for http URLs", () => {
    expect(isHttps("http://example.com")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isHttps("invalid")).toBe(false);
  });
});