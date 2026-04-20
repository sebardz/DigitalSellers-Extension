/**
 * Helpers compartidos de scraping. Los usan TODOS los scrapers específicos.
 *
 * Estrategia triple en orden de robustez:
 *   1. Meta tags Open Graph / Twitter Card (muy estables)
 *   2. JSON-LD schema.org Product (estable, estructurado)
 *   3. DOM query selectors (fallback frágil)
 *
 * Si MeLi cambia la UI y se rompe el paso 3, 1 y 2 siguen funcionando.
 */

import { HOST_TO_SITE_ID, MELI_HOSTS, type MeliHost, type SiteId } from "@shared/config";

// =============================================================================
// Predicados y detección
// =============================================================================

/** ¿La URL actual es una página de MeLi soportada? */
export function isMeliSite(): boolean {
  return MELI_HOSTS.some((h) =>
    location.hostname.toLowerCase().endsWith(h),
  );
}

/**
 * Devuelve el siteId (MLA/MLB/etc) o null si no estamos en un sitio MeLi.
 */
export function detectSiteId(): SiteId | null {
  const host = location.hostname.toLowerCase();
  for (const mlHost of MELI_HOSTS) {
    if (host.endsWith(mlHost)) return HOST_TO_SITE_ID[mlHost as MeliHost];
  }
  return null;
}

/**
 * ¿Estamos en una PDP (Product Detail Page)?
 * Criterios: tiene h1.ui-pdp-title, og:type=product, o URL con MLA.
 */
export function isProductDetailPage(): boolean {
  if (document.querySelector("h1.ui-pdp-title")) return true;
  if (document.querySelector('[data-testid="product-title"]')) return true;
  const ogType = readMeta('meta[property="og:type"]');
  if (ogType === "product") return true;
  if (/\/(MLA|MLB|MLM|MLC|MCO|MPE)-?\d+/i.test(location.pathname)) return true;
  if (/\/p\/(MLA|MLB|MLM|MLC|MCO|MPE)\d+/i.test(location.pathname)) return true;
  return false;
}

// =============================================================================
// Lectura de meta tags y JSON-LD
// =============================================================================

/** Lee un meta tag por selector CSS. Trimea. Devuelve null si no existe. */
export function readMeta(selector: string): string | null {
  const el = document.querySelector(selector);
  return el?.getAttribute("content")?.trim() ?? null;
}

export interface JsonLdProduct {
  "@type"?: string;
  name?: string;
  description?: string;
  image?: string | string[];
  offers?: {
    price?: number | string;
    priceCurrency?: string;
    availability?: string;
    seller?: { name?: string };
  };
  category?: string;
  sku?: string;
}

/**
 * Busca el primer JSON-LD de tipo Product en la página. MeLi publica uno en
 * casi todas las PDPs.
 */
export function readJsonLdProduct(): JsonLdProduct | null {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  );
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent || "null") as JsonLdProduct | JsonLdProduct[];
      const list = Array.isArray(data) ? data : [data];
      for (const item of list) {
        if (item?.["@type"] === "Product") return item;
      }
    } catch {
      // JSON-LD inválido — ignoramos y seguimos
    }
  }
  return null;
}

// =============================================================================
// Extracción de IDs
// =============================================================================

/**
 * Extrae el MLA item_id de la PDP actual. Busca en distintos lugares para
 * ser robusto a cambios de DOM de MeLi.
 */
export function extractItemId(): string | null {
  // 1. Query param pdp_filters=item_id:MLA...
  const filterMatch = location.href.match(
    /[?&]pdp_filters=[^&]*?item_id(?:%3A|:)?(MLA\d+)/i,
  );
  if (filterMatch) return filterMatch[1].toUpperCase();

  // 2. Canonical link
  const canonical = document
    .querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?.getAttribute("href");
  if (canonical) {
    const cMatch = canonical.match(
      /[?&]pdp_filters=[^&]*?item_id(?:%3A|:)?(MLA\d+)/i,
    );
    if (cMatch) return cMatch[1].toUpperCase();
  }

  // 3. Meta tag twitter:app:url
  const twitterUrl = readMeta('meta[name="twitter:app:url:iphone"]');
  if (twitterUrl) {
    const m = twitterUrl.match(/MLA-?(\d+)/i);
    if (m) return `MLA${m[1]}`;
  }

  // 4. Atributo data-item-id en algún elemento del DOM
  const dataIdEl = document.querySelector<HTMLElement>("[data-item-id]");
  if (dataIdEl) {
    const v = dataIdEl.getAttribute("data-item-id");
    if (v && /^MLA\d+$/i.test(v)) return v.toUpperCase();
  }

  // 5. Path directo articulo.mercadolibre.*/MLA-1234
  const pathMatch = location.pathname.match(/\/MLA-?(\d+)/i);
  if (pathMatch) return `MLA${pathMatch[1]}`;

  return null;
}

/** Extrae catalog_product_id de URLs /p/MLAxxx. */
export function extractCatalogProductId(): string | null {
  const fromPath = location.pathname.match(/\/p\/(MLA\d+)/i);
  if (fromPath) return fromPath[1].toUpperCase();

  const canonical = document
    .querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?.getAttribute("href");
  if (canonical) {
    const m = canonical.match(/\/p\/(MLA\d+)/i);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

/** URL canónica, o la actual si no hay `<link rel="canonical">`. */
export function canonicalUrl(): string {
  return (
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.getAttribute("href") ?? location.href
  );
}

// =============================================================================
// Extracción de imágenes
// =============================================================================

/**
 * Upgradea el sufijo de una URL de imagen MeLi a la versión full-size.
 * MeLi usa convención de sufijos: `-I` (icon) `-O` (small) `-S` (medium) `-F` (full).
 */
export function upgradeImageUrl(url: string): string {
  return url
    .replace(/-[IOS]\.(jpg|jpeg|webp|png)(\?|$)/i, "-F.$1$2")
    .replace(/_[IOS]\.(jpg|jpeg|webp|png)(\?|$)/i, "_F.$1$2");
}

/**
 * Extrae todas las URLs de imágenes de producto del PDP, upgradeadas a
 * alta resolución y deduplicadas.
 */
export function extractImages(): string[] {
  const urls = new Set<string>();

  // 1. Open Graph (casi siempre presente, alta prioridad)
  const og = readMeta('meta[property="og:image"]');
  if (og) urls.add(upgradeImageUrl(og));

  // 2. JSON-LD
  const ld = readJsonLdProduct();
  if (ld?.image) {
    const arr = Array.isArray(ld.image) ? ld.image : [ld.image];
    for (const u of arr) if (u) urls.add(upgradeImageUrl(u));
  }

  // 3. Twitter card
  const tw = readMeta('meta[name="twitter:image"]');
  if (tw) urls.add(upgradeImageUrl(tw));

  // 4. Gallery thumbs renderizados — varias clases posibles según versión
  const gallerySelectors = [
    "img.ui-pdp-image",
    "img.ui-pdp-gallery__figure__image",
    "img[data-zoom]",
    ".ui-pdp-gallery img",
    ".ui-pdp-gallery__figure img",
  ];
  for (const sel of gallerySelectors) {
    document.querySelectorAll<HTMLImageElement>(sel).forEach((img) => {
      const src =
        img.getAttribute("data-zoom") ||
        img.getAttribute("data-src") ||
        img.getAttribute("src");
      if (src) urls.add(upgradeImageUrl(src));
    });
  }

  // 5. Picture srcset (las PDPs modernas los usan para responsive)
  document.querySelectorAll<HTMLSourceElement>("picture source").forEach((s) => {
    const srcset = s.getAttribute("srcset");
    if (!srcset) return;
    const candidates = srcset.split(",").map((c) => c.trim().split(/\s+/)[0]);
    // Tomamos la última URL (suele ser la de mayor resolución)
    const last = candidates[candidates.length - 1];
    if (last) urls.add(upgradeImageUrl(last));
  });

  // Filtrar solo URLs que parezcan CDN de imágenes MeLi
  return Array.from(urls).filter(
    (u) =>
      /https?:\/\/http[2s]?\.mlstatic\.com/i.test(u) ||
      /https?:\/\/mla-s\d+-p\.mlstatic\.com/i.test(u),
  );
}

// =============================================================================
// Texto y precio
// =============================================================================

/** Parsea un precio en formato argentino ("$ 12.345,67") a número. */
export function parsePriceArs(text: string | null | undefined): number | null {
  if (!text) return null;
  const cleaned = text
    .replace(/[^\d,.]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Extrae el título del producto. */
export function extractTitle(): string {
  return (
    readMeta('meta[property="og:title"]') ??
    document.querySelector("h1.ui-pdp-title")?.textContent?.trim() ??
    document.title.replace(/\s*\|.*$/, "").trim()
  );
}
