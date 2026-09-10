import * as cheerio from "cheerio";
import type { ImageAnalysis } from "@/types/analysis";

/**
 * Parses image elements and their accessibility attributes.
 */
export function parseImages($: cheerio.CheerioAPI): ImageAnalysis {
  const images = $("img");
  const totalImages = images.length;

  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;
  let imagesWithEmptyAlt = 0;
  let lazyLoadedImages = 0;
  let imagesWithDimensions = 0;

  images.each((_, el) => {
    const img = $(el);
    const alt = img.attr("alt");

    if (alt === undefined) {
      imagesWithoutAlt += 1;
    } else if (alt.trim() === "") {
      imagesWithEmptyAlt += 1;
    } else {
      imagesWithAlt += 1;
    }

    const loading = img.attr("loading");
    if (loading === "lazy") {
      lazyLoadedImages += 1;
    }

    const width = img.attr("width");
    const height = img.attr("height");
    if (width !== undefined && height !== undefined) {
      imagesWithDimensions += 1;
    }
  });

  return {
    totalImages,
    imagesWithAlt,
    imagesWithoutAlt,
    imagesWithEmptyAlt,
    lazyLoadedImages,
    imagesWithDimensions,
  };
}