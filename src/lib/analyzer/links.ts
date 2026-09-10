import * as cheerio from "cheerio";
import type { LinkAnalysis } from "@/types/analysis";

/**
 * Parses anchor elements and classifies them as internal/external.
 */
export function parseLinks(
  $: cheerio.CheerioAPI,
  finalUrl: string,
): LinkAnalysis {
  const links = $("a[href]");
  const totalLinks = links.length;

  let internalLinks = 0;
  let externalLinks = 0;
  let nofollowLinks = 0;
  let noopenerLinks = 0;
  let targetBlankLinks = 0;
  let brokenLinks = 0;

  let baseHost: string;
  try {
    baseHost = new URL(finalUrl).hostname.toLowerCase();
  } catch {
    baseHost = "";
  }

  links.each((_, el) => {
    const a = $(el);
    const href = a.attr("href")?.trim() ?? "";

    if (href === "" || href === "#") {
      brokenLinks += 1;
      return;
    }

    const rel = (a.attr("rel") ?? "").toLowerCase().split(/\s+/);
    if (rel.includes("nofollow")) nofollowLinks += 1;
    if (rel.includes("noopener")) noopenerLinks += 1;

    if (a.attr("target") === "_blank") targetBlankLinks += 1;

    try {
      const resolved = new URL(href, finalUrl);
      if (resolved.hostname.toLowerCase() === baseHost) {
        internalLinks += 1;
      } else {
        externalLinks += 1;
      }
    } catch {
      brokenLinks += 1;
    }
  });

  return {
    totalLinks,
    internalLinks,
    externalLinks,
    nofollowLinks,
    noopenerLinks,
    targetBlankLinks,
    brokenLinks,
  };
}