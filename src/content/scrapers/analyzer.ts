/**
 * Scraper para el ANALYZER (Pack Visual + Video Pack).
 *
 * Extrae TODO lo posible del DOM de la PDP. Usa los helpers del `_core.ts`
 * que reportan qué estrategia resolvió cada campo (útil para debug cuando
 * MeLi cambia el HTML).
 *
 * Si faltan campos críticos (título + algún ID) devuelve null: el botón
 * no se muestra y la extensión no molesta en páginas que no son PDP.
 */

import type { AnalyzerScrapedPayload } from "@shared/schemas";
import {
  canonicalUrl,
  detectSiteId,
  extractAttributes,
  extractAvailability,
  extractCatalogProductId,
  extractCategoryPath,
  extractDescription,
  extractImages,
  extractItemId,
  extractPaymentMethods,
  extractPrice,
  extractReviews,
  extractSeller,
  extractShipping,
  extractTitle,
  extractVariants,
  extractWarranty,
  isProductDetailPage,
  type Tracked,
} from "./_core";

export type AnalyzerToolId = "analyzer-pack-visual" | "analyzer-video-pack";

/**
 * Resumen de completitud para debug. Cuenta qué campos se resolvieron y
 * con qué estrategia. Se logea en consola y la UI puede mostrar un badge
 * "19/22 campos ✓".
 */
export interface ScrapeDebugInfo {
  fieldsHit: number;
  fieldsTotal: number;
  missing: string[];
  strategies: Record<string, Tracked<unknown>["strategy"]>;
}

function track<T>(acc: ScrapeDebugInfo, key: string, res: Tracked<T>, isHit: (v: T) => boolean): T {
  acc.fieldsTotal++;
  acc.strategies[key] = res.strategy;
  if (isHit(res.value)) acc.fieldsHit++;
  else acc.missing.push(key);
  return res.value;
}

export function scrapeForAnalyzer(
  toolId: AnalyzerToolId,
  extensionVersion: string,
): (AnalyzerScrapedPayload & { _debug: ScrapeDebugInfo }) | null {
  if (!isProductDetailPage()) return null;

  const siteId = detectSiteId();
  if (!siteId) return null;

  const debug: ScrapeDebugInfo = {
    fieldsHit: 0,
    fieldsTotal: 0,
    missing: [],
    strategies: {},
  };

  const title = track(debug, "title", extractTitle(), (v) => !!v);
  if (!title) return null;

  const itemId = track(debug, "itemId", extractItemId(), (v) => !!v) ?? undefined;
  const catalogProductId =
    track(debug, "catalogProductId", extractCatalogProductId(), (v) => !!v) ?? undefined;
  if (!itemId && !catalogProductId) return null;

  const images = track(debug, "images", extractImages(), (v) => v.length > 0);
  if (images.length === 0) return null;

  const description = track(debug, "description", extractDescription(), (v) => !!v);
  const attributes = track(
    debug,
    "attributes",
    extractAttributes(),
    (v) => Object.keys(v).length > 0,
  );
  const category = track(debug, "category", extractCategoryPath(), (v) => !!v);
  const seller = track(debug, "seller", extractSeller(), (v) => !!v.name);
  const price = track(debug, "price", extractPrice(), (v) => v.current != null);
  const shipping = track(
    debug,
    "shipping",
    extractShipping(),
    (v) => v.hasFreeShipping || v.isFull || v.hasStorePickup,
  );
  const availability = track(debug, "availability", extractAvailability(), (v) => !!v.condition);
  const reviews = track(debug, "reviews", extractReviews(), (v) => v.ratingAverage != null);
  const variants = track(debug, "variants", extractVariants(), (v) => v.length > 0);
  const warranty = track(debug, "warranty", extractWarranty(), (v) => !!v);
  const paymentMethods = track(
    debug,
    "paymentMethods",
    extractPaymentMethods(),
    (v) => v.length > 0,
  );

  // Log dev-friendly siempre; el detalle por campo solo en debug mode.
  console.info(
    `[DSH] scrape ${debug.fieldsHit}/${debug.fieldsTotal} campos · missing: ${debug.missing.join(", ") || "(ninguno)"}`,
  );

  const payload: AnalyzerScrapedPayload & { _debug: ScrapeDebugInfo } = {
    extensionVersion,
    scrapedAt: new Date().toISOString(),
    source: "chrome-extension",
    url: canonicalUrl(),
    siteId,
    itemId,
    catalogProductId,
    toolId,
    title,
    description,
    images,
    attributes,
    category,
    seller: {
      name: seller.name,
      reputation: seller.reputation,
    },
    // Campos extendidos (schema nuevo)
    price: {
      current: price.current,
      original: price.original,
      currency: price.currency,
      discountPercent: price.discountPercent,
      installmentCount: price.installmentCount,
      installmentAmount: price.installmentAmount,
      installmentInterestFree: price.installmentInterestFree,
    },
    shipping,
    condition: availability.condition,
    availableQuantity: availability.availableQuantity,
    soldQuantity: availability.soldQuantity,
    reviews: {
      ratingAverage: reviews.ratingAverage,
      reviewCount: reviews.reviewCount,
    },
    variants,
    sellerExtended: {
      isOfficialStore: seller.isOfficialStore,
      isMercadoLider: seller.isMercadoLider,
      salesCompleted: seller.salesCompleted,
      positivePercent: seller.positivePercent,
    },
    warranty,
    paymentMethods,
    _debug: debug,
  };

  return payload;
}
