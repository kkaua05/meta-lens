import * as cheerio from "cheerio";
import type { HeadingAnalysis } from "@/types/analysis";

/**
 * Parses heading structure (h1-h6) from the document.
 */
export function parseHeadings($: cheerio.CheerioAPI): HeadingAnalysis {
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const h4Count = $("h4").length;
  const h5Count = $("h5").length;
  const h6Count = $("h6").length;

  const firstH1 = $("h1").first().text().trim();

  return {
    h1Count,
    h2Count,
    h3Count,
    h4Count,
    h5Count,
    h6Count,
    firstH1,
    hasSingleH1: h1Count === 1,
  };
}