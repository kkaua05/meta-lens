import { describe, expect, it } from "vitest";
import {
  isPrivateIp,
  validateResolvedAddresses,
  validateUrlSecurity,
} from "./url";

describe("validateUrlSecurity", () => {
  it("accepts a public https URL", () => {
    const result = validateUrlSecurity("https://example.com");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hostname).toBe("example.com");
    }
  });

  it("rejects non-http(s) protocols", () => {
    const result = validateUrlSecurity("ftp://example.com");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("UNSUPPORTED_PROTOCOL");
    }
  });

  it("rejects file:// protocol", () => {
    const result = validateUrlSecurity("file:///etc/passwd");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("UNSUPPORTED_PROTOCOL");
    }
  });

  it("rejects invalid URLs", () => {
    const result = validateUrlSecurity("not a url");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_URL");
    }
  });

  it("rejects localhost", () => {
    const result = validateUrlSecurity("http://localhost:3000");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("PRIVATE_ADDRESS");
    }
  });

  it("rejects the cloud metadata endpoint", () => {
    const result = validateUrlSecurity("http://169.254.169.254/latest/meta-data");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("PRIVATE_ADDRESS");
    }
  });

  it("rejects private IPv4 literals", () => {
    const result = validateUrlSecurity("http://192.168.1.1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("PRIVATE_ADDRESS");
    }
  });

  it("rejects loopback IPv4", () => {
    const result = validateUrlSecurity("http://127.0.0.1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("PRIVATE_ADDRESS");
    }
  });
});

describe("isPrivateIp", () => {
  it("detects private IPv4 ranges", () => {
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("192.168.0.1")).toBe(true);
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);
  });

  it("detects public IPv4 as non-private", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
  });

  it("detects private IPv6 ranges", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("::")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("fd00::1")).toBe(true);
  });

  it("detects IPv4-mapped IPv6 as private", () => {
    expect(isPrivateIp("::ffff:192.168.0.1")).toBe(true);
  });

  it("returns false for non-IP strings", () => {
    expect(isPrivateIp("example.com")).toBe(false);
  });
});

describe("validateResolvedAddresses", () => {
  it("returns true when all addresses are public", () => {
    expect(validateResolvedAddresses(["8.8.8.8", "1.1.1.1"])).toBe(true);
  });

  it("returns false when any address is private", () => {
    expect(validateResolvedAddresses(["8.8.8.8", "10.0.0.1"])).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(validateResolvedAddresses([])).toBe(false);
  });
});