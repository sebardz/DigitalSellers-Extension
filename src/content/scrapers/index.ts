/**
 * Registry central de scrapers.
 *
 * Cuando agregamos una tool nueva al `tools.ts`, sumamos su scraper acá.
 * El content-script busca la función por `scraperId` y la ejecuta.
 */

import type { AnalyzerToolId } from "./analyzer";
import { scrapeForAnalyzer } from "./analyzer";
// import { scrapeForSimulator } from "./simulator"; // v0.2

export type ScrapeResult = Record<string, unknown> | null;

export type ScraperFn = (
  toolId: string,
  extensionVersion: string,
) => ScrapeResult;

const scrapers: Record<string, ScraperFn> = {
  analyzer: (toolId, version) =>
    scrapeForAnalyzer(toolId as AnalyzerToolId, version),
  // simulator: (_, version) => scrapeForSimulator(version), // v0.2
};

/** Busca el scraper correspondiente a una tool y lo corre. */
export function runScraper(
  scraperId: string,
  toolId: string,
  extensionVersion: string,
): ScrapeResult {
  const fn = scrapers[scraperId];
  if (!fn) {
    console.warn(`[DSH] scraper "${scraperId}" no encontrado en el registry`);
    return null;
  }
  try {
    return fn(toolId, extensionVersion);
  } catch (err) {
    console.error(`[DSH] scraper "${scraperId}" falló:`, err);
    return null;
  }
}
