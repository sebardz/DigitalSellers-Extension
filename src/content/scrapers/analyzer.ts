/**
 * Reference collector for Analyzer.
 *
 * It intentionally does not read MercadoLibre product data from DOM/HTML.
 * Product fields are hydrated later by Analyzer through the official MeLi API.
 */

import type { AnalyzerScrapedPayload } from "@shared/schemas";
import { canonicalUrl, extractCatalogProductIdFromUrl, extractItemIdFromUrl, inferSiteIdFromOfficialId, isProductDetailPage } from "./_core";

export type AnalyzerToolId = "analyzer-pack-visual" | "analyzer-video-pack";

export function scrapeForAnalyzer(
  toolId: AnalyzerToolId,
  extensionVersion: string,
): AnalyzerScrapedPayload | null {
  if (!isProductDetailPage()) return null;

  const url = canonicalUrl();
  const itemId = extractItemIdFromUrl(url) ?? undefined;
  const catalogProductId = extractCatalogProductIdFromUrl(url) ?? undefined;
  if (!itemId && !catalogProductId) return null;
  const siteId = inferSiteIdFromOfficialId(itemId ?? catalogProductId);
  if (!siteId) return null;

  return {
    extensionVersion,
    capturedAt: new Date().toISOString(),
    source: "chrome-extension",
    sourceMode: "official-api-reference",
    url,
    siteId,
    itemId,
    catalogProductId,
    toolId,
  };
}
