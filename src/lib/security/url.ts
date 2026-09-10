import { isIP } from "node:net";

/**
 * SSRF protection utilities.
 *
 * These helpers validate that a URL points to a public, internet-routable
 * address and not to internal/private infrastructure (localhost, private
 * networks, link-local, cloud metadata endpoints, etc.).
 */

/** Error codes emitted by the URL security layer. */
export type UrlSecurityError =
  | "UNSUPPORTED_PROTOCOL"
  | "INVALID_URL"
  | "PRIVATE_ADDRESS"
  | "DNS_ERROR";

/** A structured result from validating a URL for SSRF safety. */
export type UrlSecurityResult =
  | { ok: true; hostname: string }
  | { ok: false; code: UrlSecurityError; message: string };

/** Protocols that are allowed to be fetched. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Hostnames that must always be blocked, regardless of DNS resolution. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "169.254.169.254",
]);

/**
 * Returns whether an IPv4 address is within a private or reserved range.
 */
function isPrivateIPv4(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o))) {
    return false;
  }
  const [a, b] = octets;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 100.64.0.0/10 (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local, incl. cloud metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24
  if (a === 192 && b === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0) return true;
  // 224.0.0.0/4 (multicast) and 240.0.0.0/4 (reserved)
  if (a >= 224) return true;

  return false;
}

/**
 * Returns whether an IPv6 address is private, loopback, link-local,
 * unique-local, or otherwise non-global.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Remove zone index (e.g. fe80::1%eth0).
  const withoutZone = normalized.split("%")[0];

  if (withoutZone === "::" || withoutZone === "::1") return true;
  if (withoutZone.startsWith("::ffff:")) {
    // IPv4-mapped IPv6 — validate the embedded IPv4.
    const v4 = withoutZone.slice("::ffff:".length);
    return isPrivateIPv4(v4);
  }
  if (withoutZone.startsWith("fe8") || withoutZone.startsWith("fe9") || withoutZone.startsWith("fea") || withoutZone.startsWith("feb")) {
    // fe80::/10 link-local
    return true;
  }
  if (withoutZone.startsWith("fc") || withoutZone.startsWith("fd")) {
    // fc00::/7 unique-local
    return true;
  }
  return false;
}

/**
 * Returns whether an IP address string is private or reserved.
 */
export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip);
  }
  if (version === 6) {
    return isPrivateIPv6(ip);
  }
  return false;
}

/**
 * Validates a URL for SSRF safety.
 *
 * Checks the protocol, hostname, and (when the hostname is an IP literal)
 * the address range. DNS resolution is performed separately by the caller
 * (see `validateResolvedAddresses`) because it is asynchronous.
 *
 * @param url The URL to validate.
 * @returns A structured result.
 */
export function validateUrlSecurity(url: string): UrlSecurityResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      ok: false,
      code: "INVALID_URL",
      message: "A URL fornecida é inválida.",
    };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      ok: false,
      code: "UNSUPPORTED_PROTOCOL",
      message: "Apenas URLs http:// e https:// são permitidas.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return {
      ok: false,
      code: "PRIVATE_ADDRESS",
      message: "O endereço informado não é permitido.",
    };
  }

  // If the hostname is an IP literal, validate the range directly.
  if (isIP(hostname) && isPrivateIp(hostname)) {
    return {
      ok: false,
      code: "PRIVATE_ADDRESS",
      message: "O endereço informado não é permitido.",
    };
  }

  return { ok: true, hostname };
}

/**
 * Validates a list of resolved IP addresses (from DNS) for SSRF safety.
 *
 * @param addresses The resolved IP addresses.
 * @returns `true` if all addresses are public, `false` if any is private.
 */
export function validateResolvedAddresses(addresses: string[]): boolean {
  if (addresses.length === 0) {
    return false;
  }
  return addresses.every((addr) => !isPrivateIp(addr));
}