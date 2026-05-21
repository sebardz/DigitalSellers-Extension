/**
 * Registry central de collectors.
 *
 * Cuando agregamos una tool nueva al `tools.ts`, sumamos su collector aca.
 * El content-script busca la funcion por `scraperId` y la ejecuta.
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

/** Busca el collector correspondiente a una tool y lo corre. */
export function runScraper(
  scraperId: string,
  toolId: string,
  extensionVersion: string,
): ScrapeResult {
  const fn = scrapers[scraperId];
  if (!fn) {
    console.warn(`[DSH] collector "${scraperId}" no encontrado en el registry`);
    return null;
  }
  try {
    return fn(toolId, extensionVersion);
  } catch (err) {
    console.error(`[DSH] collector "${scraperId}" falló:`, err);
    return null;
  }
}
