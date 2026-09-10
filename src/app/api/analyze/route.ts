import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/schemas/analyze";
import { normalizeUrl } from "@/lib/urls";
import { validateUrlSecurity } from "@/lib/security/url";
import { fetchPage, FetchError } from "@/lib/analyzer/fetch-page";
import { parseHtml } from "@/lib/analyzer/parse-html";
import { computeScore } from "@/lib/score";
import type { SeoAnalysis, WebsiteAnalysis } from "@/types/analysis";

/**
 * POST /api/analyze
 *
 * Analyzes a website's metadata and SEO. The fetch happens server-side only
 * (never from the browser) with SSRF protection.
 */

/** Maximum accepted JSON body size (bytes). */
const MAX_BODY_BYTES = 16 * 1024; // 16 KB

/**
 * In-memory rate limiter (per serverless instance). Uses a sliding window:
 * each client IP is allowed `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS`.
 *
 * NOTE: This is best-effort for a single instance. For multi-instance
 * deployments, use a shared store (e.g. Redis/Upstash).
 */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const rateLimitHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (rateLimitHits.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimitHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateLimitHits.set(ip, hits);
  return false;
}

/** Extracts the client IP from common headers (best-effort). */
function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Maps a FetchError code to an HTTP status code. */
function statusForCode(code: string): number {
  switch (code) {
    case "INVALID_URL":
    case "UNSUPPORTED_PROTOCOL":
    case "PRIVATE_ADDRESS":
      return 400;
    case "DNS_ERROR":
    case "CONNECTION_ERROR":
    case "TIMEOUT":
    case "TOO_MANY_REDIRECTS":
    case "CONTENT_TOO_LARGE":
    case "UNSUPPORTED_CONTENT_TYPE":
      return 422;
    case "HTTP_ERROR":
      return 502;
    default:
      return 500;
  }
}

export async function POST(request: Request) {
  // Rate limiting (best-effort, per instance).
  if (isRateLimited(clientIp(request))) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "Muitas requisições. Tente novamente em instantes.",
      },
      { status: 429 },
    );
  }

  // Enforce a body size limit before parsing.
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "PAYLOAD_TOO_LARGE", message: "O corpo da requisição é muito grande." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "O corpo da requisição é inválido." },
      { status: 400 },
    );
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_URL",
        message: parsed.error.issues[0]?.message ?? "URL inválida.",
      },
      { status: 400 },
    );
  }

  const { url } = parsed.data;

  // Normalize the URL (adds https:// if missing).
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return NextResponse.json(
      { error: "INVALID_URL", message: "A URL informada é inválida." },
      { status: 400 },
    );
  }

  // Validate the URL for SSRF safety before fetching.
  const security = validateUrlSecurity(normalizedUrl);
  if (!security.ok) {
    return NextResponse.json(
      { error: security.code, message: security.message },
      { status: statusForCode(security.code) },
    );
  }

  let result;
  try {
    result = await fetchPage(normalizedUrl);
  } catch (err) {
    if (err instanceof FetchError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: statusForCode(err.code) },
      );
    }
    return NextResponse.json(
      {
        error: "CONNECTION_ERROR",
        message: "Não foi possível analisar o site informado.",
      },
      { status: 500 },
    );
  }

  let analysis;
  try {
    analysis = parseHtml(
      result.html,
      result.finalUrl,
      result.size,
      result.responseTimeMs,
    );
  } catch {
    return NextResponse.json(
      {
        error: "PARSING_ERROR",
        message: "Não foi possível interpretar o HTML do site.",
      },
      { status: 500 },
    );
  }

  const { metadata, social, headings, images, links, technical } = analysis;

  const seo: SeoAnalysis = {
    hasTitle: metadata.title.length > 0,
    titleLength: metadata.title.length,
    hasDescription: metadata.description.length > 0,
    descriptionLength: metadata.description.length,
    hasCanonical: metadata.canonical.length > 0,
    isHttps: technical.isHttps,
    hasLanguage: metadata.language.length > 0,
    hasViewport: metadata.viewport.length > 0,
    hasFavicon: metadata.hasFavicon,
    hasOpenGraph:
      social.ogTitle.length > 0 ||
      social.ogDescription.length > 0 ||
      social.ogImage.length > 0,
  };

  const score = computeScore({ metadata, seo, headings, social, images, technical });

  const response: WebsiteAnalysis = {
    request: {
      originalUrl: url,
      normalizedUrl,
      finalUrl: result.finalUrl,
      analyzedAt: new Date().toISOString(),
    },
    metadata,
    seo,
    headings,
    social,
    images,
    links,
    technical,
    score,
  };

  return NextResponse.json(response, {
    headers: {
      // Analysis results are not user-specific; allow short-lived caching.
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    },
  });
}