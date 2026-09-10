import { lookup } from "node:dns/promises";
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
 * Throws a `FetchError` if resolution fails or any address is private.
 */
async function resolveAndValidate(hostname: string): Promise<void> {
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

    // Resolve and validate DNS for the current host.
    await resolveAndValidate(hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new FetchError(
          "TIMEOUT",
          "A requisição excedeu o tempo limite.",
        );
      }
      throw new FetchError(
        "CONNECTION_ERROR",
        "Não foi possível conectar ao site informado.",
      );
    }

    // Handle redirects.
    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has("location")
    ) {
      clearTimeout(timeout);
      redirects += 1;
      if (redirects > maxRedirects) {
        throw new FetchError(
          "TOO_MANY_REDIRECTS",
          "O site redirecionou muitas vezes.",
        );
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new FetchError(
          "HTTP_ERROR",
          "Redirecionamento sem destino.",
          response.status,
        );
      }

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
    clearTimeout(timeout);

    if (!response.ok) {
      throw new FetchError(
        "HTTP_ERROR",
        `O site retornou o status HTTP ${response.status}.`,
        response.status,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    const baseType = contentType.split(";")[0].trim().toLowerCase();

    if (!HTML_CONTENT_TYPES.has(baseType)) {
      throw new FetchError(
        "UNSUPPORTED_CONTENT_TYPE",
        "O conteúdo retornado não é HTML.",
      );
    }

    // Read the body with a size limit.
    const reader = response.body?.getReader();
    if (!reader) {
      throw new FetchError(
        "CONNECTION_ERROR",
        "Não foi possível ler a resposta do site.",
      );
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > maxSizeBytes) {
          reader.cancel();
          throw new FetchError(
            "CONTENT_TOO_LARGE",
            "O conteúdo do site excede o limite de 2MB.",
          );
        }
        chunks.push(value);
      }
    } catch (err) {
      if (err instanceof FetchError) throw err;
      throw new FetchError(
        "CONNECTION_ERROR",
        "Não foi possível ler a resposta do site.",
      );
    }

    const html = Buffer.concat(chunks).toString("utf-8");
    const responseTimeMs = Date.now() - startedAt;

    return {
      finalUrl: currentUrl,
      html,
      contentType: baseType,
      size: totalBytes,
      responseTimeMs,
    };
  }
}