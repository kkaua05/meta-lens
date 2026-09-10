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

  return NextResponse.json(response);
}