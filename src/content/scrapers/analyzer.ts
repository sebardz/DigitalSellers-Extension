/**
 * Scraper para el ANALYZER (Pack Visual + Video Pack).
 *
 * Necesita: título, MLA id (o catalog_product_id), imágenes de alta
 * resolución, atributos del producto, descripción, categoría, seller.
 *
 * Devuelve un payload que cumple AnalyzerScrapedPayloadSchema. Si falla
 * algún campo crítico (título o ambos IDs), devuelve null — la extensión
 * esconde el botón silenciosamente.
 */

import type { AnalyzerScrapedPayload } from "@shared/schemas";
import {
  canonicalUrl,
  detectSiteId,
  extractCatalogProductId,
  extractImages,
  extractItemId,
  extractTitle,
  isProductDetailPage,
  readJsonLdProduct,
  readMeta,
} from "./_core";

// =============================================================================
// Helpers específicos del Analyzer
// =============================================================================

/** Extrae la descripción completa del PDP (texto plano). */
function extractDescription(): string | null {
  // Botón "Ver más" puede estar colapsado pero el DOM la tiene completa.
  const selectors = [
    ".ui-pdp-description__content",
    '[data-testid="product-description"]',
    ".ui-pdp-description",
    ".ui-vpp-description",
  ];
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el?.textContent) {
      const text = el.textContent.trim();
      if (text.length > 30) return text;
    }
  }
  // JSON-LD fallback
  const ld = readJsonLdProduct();
  if (ld?.description) return ld.description.trim();
  return null;
}

/** Extrae atributos de la tabla "Características". */
function extractAttributes(): Record<string, string> {
  const attrs: Record<string, string> = {};

  // Formato tabla (más común)
  const rowSelectors = [
    ".ui-pdp-specs__table tr",
    ".andes-table__row",
    "tr.ui-vpp-striped-specs__row",
    ".ui-vpp-highlighted-specs__striped-specs li",
  ];
  for (const sel of rowSelectors) {
    document.querySelectorAll<HTMLElement>(sel).forEach((row) => {
      const cells = row.querySelectorAll("th, td, .andes-table__header, .andes-table__column");
      if (cells.length >= 2) {
        const k = cells[0]?.textContent?.trim();
        const v = cells[1]?.textContent?.trim();
        if (k && v && !attrs[k]) attrs[k] = v;
      }
    });
  }

  // Formato data-testid
  document
    .querySelectorAll<HTMLElement>('[data-testid="specs-row"]')
    .forEach((row) => {
      const k = row
        .querySelector<HTMLElement>('[data-testid="specs-key"]')
        ?.textContent?.trim();
      const v = row
        .querySelector<HTMLElement>('[data-testid="specs-value"]')
        ?.textContent?.trim();
      if (k && v) attrs[k] = v;
    });

  return attrs;
}

/** Extrae el path de categoría desde el breadcrumb. */
function extractCategoryPath(): string | null {
  const crumbs: string[] = [];
  const selectors = [
    ".andes-breadcrumb__link",
    "nav.ui-pdp-breadcrumb a",
    "a.ui-pdp-header__breadcrumb",
  ];
  for (const sel of selectors) {
    document.querySelectorAll<HTMLElement>(sel).forEach((a) => {
      const text = a.textContent?.trim();
      if (text && !crumbs.includes(text)) crumbs.push(text);
    });
    if (crumbs.length) break;
  }
  return crumbs.length ? crumbs.join(" > ") : null;
}

/** Extrae nombre y reputación del seller. */
function extractSeller(): { name: string | null; reputation: string | null } {
  const nameSelectors = [
    ".ui-pdp-seller__link-trigger",
    ".ui-vip-profile-info__info-container h2",
    ".ui-pdp-seller__header__title",
  ];
  let name: string | null = null;
  for (const sel of nameSelectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el?.textContent?.trim()) {
      name = el.textContent.trim();
      break;
    }
  }

  const reputation =
    document
      .querySelector<HTMLElement>(".ui-pdp-seller__status-title")
      ?.textContent?.trim() ?? null;

  return { name, reputation };
}

// =============================================================================
// Main scraper function
// =============================================================================

export type AnalyzerToolId = "analyzer-pack-visual" | "analyzer-video-pack";

/**
 * Scrapea la PDP actual para una tool del Analyzer.
 *
 * @param toolId — Identifica qué tool específico del Analyzer estamos llenando.
 *                 Ahora el payload es el mismo, pero el toolId viaja en el
 *                 payload para que el server route al flow correcto.
 * @returns AnalyzerScrapedPayload | null si la página no es una PDP válida.
 */
export function scrapeForAnalyzer(
  toolId: AnalyzerToolId,
  extensionVersion: string,
): AnalyzerScrapedPayload | null {
  if (!isProductDetailPage()) return null;

  const siteId = detectSiteId();
  if (!siteId) return null;

  const title = extractTitle();
  if (!title) return null;

  const itemId = extractItemId() ?? undefined;
  const catalogProductId = extractCatalogProductId() ?? undefined;
  if (!itemId && !catalogProductId) return null;

  const images = extractImages();
  if (images.length === 0) return null;

  return {
    extensionVersion,
    scrapedAt: new Date().toISOString(),
    source: "chrome-extension",
    url: canonicalUrl(),
    siteId,
    itemId,
    catalogProductId,
    toolId,
    title,
    description: extractDescription(),
    images,
    attributes: extractAttributes(),
    category: extractCategoryPath(),
    seller: extractSeller(),
  };
}
