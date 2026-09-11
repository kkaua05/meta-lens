import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { validateResolvedAddresses, validateUrlSecurity } from "@/lib/security/url";

/**
 * Safe fetching utilities.
 *
 * Fetches a page with SSRF protection, a timeout, a redirect limit, a size
 * limit, and Content-Type validation. DNS is resolved and re-validated on
 * every hop to prevent DNS rebinding attacks.
 */

/** Error codes emitted by the fetch layer. */
export type FetchErrorCode =
  | "DNS_ERROR"
  | "CONNECTION_ERROR"
  | "TIMEOUT"
  | "TOO_MANY_REDIRECTS"
  | "CONTENT_TOO_LARGE"
  | "UNSUPPORTED_CONTENT_TYPE"
  | "HTTP_ERROR"
  | "PRIVATE_ADDRESS"
  | "UNSUPPORTED_PROTOCOL"
  | "INVALID_URL";

/** A structured fetch error. */
export class FetchError extends Error {
  readonly code: FetchErrorCode;
  readonly status?: number;

  constructor(code: FetchErrorCode, message: string, status?: number) {
    super(message);
    this.name = "FetchError";
    this.code = code;
    this.status = status;
  }
}

/** The result of a successful fetch. */
export interface FetchResult {
  /** The final URL after redirects. */
  finalUrl: string;
  /** The raw HTML body. */
  html: string;
  /** The Content-Type header value. */
  contentType: string;
  /** The size of the body in bytes. */
  size: number;
  /** The time taken in milliseconds. */
  responseTimeMs: number;
}

/** Configuration for the fetch. */
export interface FetchOptions {
  /** Timeout in milliseconds. Defaults to 10000. */
  timeoutMs?: number;
  /** Maximum number of redirects to follow. Defaults to 5. */
  maxRedirects?: number;
  /** Maximum HTML size in bytes. Defaults to 2MB. */
  maxSizeBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const USER_AGENT =
  "MetaLens/1.0 (+https://metalens.example.com; SEO analysis bot)";

/** Content types that are considered HTML. */
const HTML_CONTENT_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "application/xml",
  "text/xml",
]);

/**
 * Resolves a hostname to its IP addresses and validates them for SSRF safety.
 * Returns the first validated public IP address, or throws a `FetchError` if
 * resolution fails or any address is private.
 */
async function resolveAndValidate(hostname: string): Promise<string> {
  let addresses: string[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true }).then(
      (results) => results.map((r) => r.address),
    );
  } catch {
    throw new FetchError(
      "DNS_ERROR",
      "Não foi possível resolver o domínio informado.",
    );
  }

  if (!validateResolvedAddresses(addresses)) {
    throw new FetchError(
      "PRIVATE_ADDRESS",
      "O endereço informado não é permitido.",
    );
  }

  return addresses[0];
}

/**
 * Builds a DNS `lookup` function pinned to a pre-validated IP address. This
 * closes the DNS-rebinding TOCTOU window: the connection is established to the
 * exact IP we validated, while the `Host` header (and TLS SNI via `servername`)
 * still carry the original hostname.
 *
 * The callback must honour the standard Node `dns.lookup` contract: when
 * `options.all` is true (used by `autoSelectFamily`), it receives an array of
 * `{ address, family }`; otherwise it receives `(address, family)`.
 */
function pinnedLookup(ip: string) {
  const family = ip.includes(":") ? 6 : 4;
  return (
    _hostname: string,
    options: { all?: boolean },
    callback: (
      err: NodeJS.ErrnoException | null,
      address: string | Array<{ address: string; family: number }>,
      family?: number,
    ) => void,
  ): void => {
    if (options?.all) {
      callback(null, [{ address: ip, family }]);
    } else {
      callback(null, ip, family);
    }
  };
}

/**
 * Performs a single HTTP(S) request using Node's native `http`/`https`
 * modules, with DNS resolution pinned to a pre-validated IP address.
 *
 * We deliberately avoid the global `fetch` (and undici's `Agent` dispatcher)
 * here: Node's global `fetch` uses its own bundled undici instance, which is
 * incompatible with a separately-installed undici `Agent` and throws
 * `invalid onRequestStart method`. Native `http(s).request` with the `lookup`
 * option is the canonical, well-supported way to pin DNS for SSRF protection.
 */
function requestWithPinnedDns(
  url: URL,
  ip: string,
  timeoutMs: number,
  maxSizeBytes: number,
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === "https:";
    const transport = isHttps ? https : http;
    const port = url.port ? Number(url.port) : isHttps ? 443 : 80;

    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          Host: url.host,
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
        // Pin DNS to the validated IP. `servername` keeps TLS SNI (and cert
        // validation) bound to the original hostname.
        lookup: pinnedLookup(ip),
        servername: isHttps ? url.hostname : undefined,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxSizeBytes) {
            req.destroy(
              new FetchError(
                "CONTENT_TOO_LARGE",
                "O conteúdo do site excede o limite de 2MB.",
              ),
            );
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
        res.on("error", reject);
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(
        new FetchError("TIMEOUT", "A requisição excedeu o tempo limite."),
      );
    });

    req.on("error", (err) => {
      if (err instanceof FetchError) {
        reject(err);
      } else {
        reject(
          new FetchError(
            "CONNECTION_ERROR",
            "Não foi possível conectar ao site informado.",
          ),
        );
      }
    });

    req.end();
  });
}

/**
 * Fetches a URL safely, following redirects with SSRF re-validation.
 *
 * @param url The absolute URL to fetch.
 * @param options Optional configuration.
 * @returns The fetched HTML and metadata.
 */
export async function fetchPage(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  const startedAt = Date.now();

  // Validate the initial URL.
  const initial = validateUrlSecurity(url);
  if (!initial.ok) {
    throw new FetchError(initial.code, initial.message);
  }

  let currentUrl = url;
  let redirects = 0;

  while (true) {
    const parsed = new URL(currentUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Resolve and validate DNS for the current host, then pin the connection
    // to the validated IP to prevent DNS-rebinding (TOCTOU) attacks.
    const validatedIp = await resolveAndValidate(hostname);

    const { statusCode, headers, body } = await requestWithPinnedDns(
      parsed,
      validatedIp,
      timeoutMs,
      maxSizeBytes,
    );

    // Handle redirects.
    if (statusCode >= 300 && statusCode < 400 && headers.location) {
      redirects += 1;
      if (redirects > maxRedirects) {
        throw new FetchError(
          "TOO_MANY_REDIRECTS",
          "O site redirecionou muitas vezes.",
        );
      }

      const location = Array.isArray(headers.location)
        ? headers.location[0]
        : headers.location;

      // Resolve the redirect target against the current URL.
      const nextUrl = new URL(location, currentUrl).toString();

      // Validate the redirect target for SSRF safety.
      const nextValidation = validateUrlSecurity(nextUrl);
      if (!nextValidation.ok) {
        throw new FetchError(nextValidation.code, nextValidation.message);
      }

      currentUrl = nextUrl;
      continue;
    }

    // Non-redirect response.
    if (statusCode < 200 || statusCode >= 300) {
      throw new FetchError(
        "HTTP_ERROR",
        `O site retornou o status HTTP ${statusCode}.`,
        statusCode,
      );
    }

    const rawContentType = headers["content-type"] ?? "";
    const contentType = Array.isArray(rawContentType)
      ? rawContentType[0]
      : rawContentType;
    const baseType = contentType.split(";")[0].trim().toLowerCase();

    if (!HTML_CONTENT_TYPES.has(baseType)) {
      throw new FetchError(
        "UNSUPPORTED_CONTENT_TYPE",
        "O conteúdo retornado não é HTML.",
      );
    }

    const html = body.toString("utf-8");
    const responseTimeMs = Date.now() - startedAt;

    return {
      finalUrl: currentUrl,
      html,
      contentType: baseType,
      size: body.length,
      responseTimeMs,
    };
  }
}