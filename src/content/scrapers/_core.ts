/**
 * Helpers compartidos de scraping. Los usan TODOS los scrapers específicos.
 *
 * Estrategia triple en orden de robustez:
 *   1. Meta tags Open Graph / Twitter Card (muy estables)
 *   2. JSON-LD schema.org Product (estable, estructurado)
 *   3. DOM query selectors (fallback frágil)
 *
 * Cada helper devuelve además `strategy` con qué fuente lo resolvió —
 * esto lo usamos para el completeness tracker del panel.
 */

import { HOST_TO_SITE_ID, MELI_HOSTS, type MeliHost, type SiteId } from "@shared/config";

/** Resultado de un helper que reporta de qué fuente sacó el dato. */
export interface Tracked<T> {
  value: T;
  /** Cuál de nuestras estrategias funcionó (útil para debug + tests). */
  strategy: "meta" | "json-ld" | "dom" | "path" | "query" | "combined" | "none";
}

// =============================================================================
// Predicados y detección
// =============================================================================

export function isMeliSite(): boolean {
  return MELI_HOSTS.some((h) => location.hostname.toLowerCase().endsWith(h));
}

export function detectSiteId(): SiteId | null {
  const host = location.hostname.toLowerCase();
  for (const mlHost of MELI_HOSTS) {
    if (host.endsWith(mlHost)) return HOST_TO_SITE_ID[mlHost as MeliHost];
  }
  return null;
}

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
    itemCondition?: string;
  };
  brand?: { name?: string } | string;
  category?: string;
  sku?: string;
  aggregateRating?: {
    ratingValue?: number | string;
    reviewCount?: number | string;
  };
}

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
      /* JSON-LD inválido — ignoramos */
    }
  }
  return null;
}

// =============================================================================
// IDs
// =============================================================================

export function extractItemId(): Tracked<string | null> {
  // Query param pdp_filters=item_id:MLA...
  const filterMatch = location.href.match(
    /[?&]pdp_filters=[^&]*?item_id(?:%3A|:)?(MLA\d+)/i,
  );
  if (filterMatch) return { value: filterMatch[1].toUpperCase(), strategy: "query" };

  // Canonical
  const canonical = document
    .querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?.getAttribute("href");
  if (canonical) {
    const cMatch = canonical.match(
      /[?&]pdp_filters=[^&]*?item_id(?:%3A|:)?(MLA\d+)/i,
    );
    if (cMatch) return { value: cMatch[1].toUpperCase(), strategy: "query" };
  }

  // twitter app url
  const twitterUrl = readMeta('meta[name="twitter:app:url:iphone"]');
  if (twitterUrl) {
    const m = twitterUrl.match(/MLA-?(\d+)/i);
    if (m) return { value: `MLA${m[1]}`, strategy: "meta" };
  }

  // data-item-id en DOM
  const dataIdEl = document.querySelector<HTMLElement>("[data-item-id]");
  if (dataIdEl) {
    const v = dataIdEl.getAttribute("data-item-id");
    if (v && /^MLA\d+$/i.test(v)) return { value: v.toUpperCase(), strategy: "dom" };
  }

  // Path directo
  const pathMatch = location.pathname.match(/\/MLA-?(\d+)/i);
  if (pathMatch) return { value: `MLA${pathMatch[1]}`, strategy: "path" };

  return { value: null, strategy: "none" };
}

export function extractCatalogProductId(): Tracked<string | null> {
  const fromPath = location.pathname.match(/\/p\/(MLA\d+)/i);
  if (fromPath) return { value: fromPath[1].toUpperCase(), strategy: "path" };

  const canonical = document
    .querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?.getAttribute("href");
  if (canonical) {
    const m = canonical.match(/\/p\/(MLA\d+)/i);
    if (m) return { value: m[1].toUpperCase(), strategy: "path" };
  }
  return { value: null, strategy: "none" };
}

export function canonicalUrl(): string {
  return (
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.getAttribute("href") ?? location.href
  );
}

// =============================================================================
// Título
// =============================================================================

export function extractTitle(): Tracked<string | null> {
  const og = readMeta('meta[property="og:title"]');
  if (og) return { value: og, strategy: "meta" };

  const ld = readJsonLdProduct();
  if (ld?.name) return { value: ld.name.trim(), strategy: "json-ld" };

  const h1 = document.querySelector<HTMLElement>("h1.ui-pdp-title");
  if (h1?.textContent) return { value: h1.textContent.trim(), strategy: "dom" };

  if (document.title) {
    return {
      value: document.title.replace(/\s*\|.*$/, "").trim(),
      strategy: "meta",
    };
  }
  return { value: null, strategy: "none" };
}

// =============================================================================
// Imágenes
// =============================================================================

export function upgradeImageUrl(url: string): string {
  return url
    .replace(/-[IOS]\.(jpg|jpeg|webp|png)(\?|$)/i, "-F.$1$2")
    .replace(/_[IOS]\.(jpg|jpeg|webp|png)(\?|$)/i, "_F.$1$2");
}

export function extractImages(): Tracked<string[]> {
  const urls = new Set<string>();
  let anyMeta = false;
  let anyLd = false;
  let anyDom = false;

  const og = readMeta('meta[property="og:image"]');
  if (og) {
    urls.add(upgradeImageUrl(og));
    anyMeta = true;
  }

  const ld = readJsonLdProduct();
  if (ld?.image) {
    const arr = Array.isArray(ld.image) ? ld.image : [ld.image];
    for (const u of arr) {
      if (u) {
        urls.add(upgradeImageUrl(u));
        anyLd = true;
      }
    }
  }

  const tw = readMeta('meta[name="twitter:image"]');
  if (tw) {
    urls.add(upgradeImageUrl(tw));
    anyMeta = true;
  }

  const gallerySelectors = [
    "img.ui-pdp-image",
    "img.ui-pdp-gallery__figure__image",
    "img[data-zoom]",
    ".ui-pdp-gallery img",
    ".ui-pdp-gallery__figure img",
    ".ui-pdp-gallery__wrapper img",
  ];
  for (const sel of gallerySelectors) {
    document.querySelectorAll<HTMLImageElement>(sel).forEach((img) => {
      const src =
        img.getAttribute("data-zoom") ||
        img.getAttribute("data-src") ||
        img.getAttribute("src");
      if (src) {
        urls.add(upgradeImageUrl(src));
        anyDom = true;
      }
    });
  }

  document.querySelectorAll<HTMLSourceElement>("picture source").forEach((s) => {
    const srcset = s.getAttribute("srcset");
    if (!srcset) return;
    const last = srcset.split(",").map((c) => c.trim().split(/\s+/)[0]).pop();
    if (last) {
      urls.add(upgradeImageUrl(last));
      anyDom = true;
    }
  });

  const filtered = Array.from(urls).filter(
    (u) =>
      /https?:\/\/http[2s]?\.mlstatic\.com/i.test(u) ||
      /https?:\/\/mla-s\d+-p\.mlstatic\.com/i.test(u),
  );

  const strategies: Tracked<unknown>["strategy"][] = [];
  if (anyMeta) strategies.push("meta");
  if (anyLd) strategies.push("json-ld");
  if (anyDom) strategies.push("dom");

  return {
    value: filtered,
    strategy: strategies.length > 1 ? "combined" : (strategies[0] ?? "none"),
  };
}

// =============================================================================
// Precio + cuotas + oferta
// =============================================================================

export function parsePriceArs(text: string | null | undefined): number | null {
  if (!text) return null;
  const cleaned = text
    .replace(/[^\d,.]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export interface PriceInfo {
  current: number | null;
  original: number | null;
  currency: string;
  discountPercent: number | null;
  /** Ej. 6 para "6 cuotas" */
  installmentCount: number | null;
  /** Monto de cada cuota */
  installmentAmount: number | null;
  /** "Sin interés" / "con interés" */
  installmentInterestFree: boolean | null;
}

export function extractPrice(): Tracked<PriceInfo> {
  const info: PriceInfo = {
    current: null,
    original: null,
    currency: "ARS",
    discountPercent: null,
    installmentCount: null,
    installmentAmount: null,
    installmentInterestFree: null,
  };
  let strategy: Tracked<unknown>["strategy"] = "none";

  // 1. og:product:price:amount
  const ogPrice = readMeta('meta[property="product:price:amount"]');
  if (ogPrice) {
    info.current = parseFloat(ogPrice);
    strategy = "meta";
  }
  const ogCurr = readMeta('meta[property="product:price:currency"]');
  if (ogCurr) info.currency = ogCurr;

  // 2. JSON-LD
  if (info.current == null) {
    const ld = readJsonLdProduct();
    if (ld?.offers) {
      const p =
        typeof ld.offers.price === "string"
          ? parseFloat(ld.offers.price)
          : ld.offers.price;
      if (typeof p === "number" && Number.isFinite(p)) {
        info.current = p;
        strategy = "json-ld";
      }
      if (ld.offers.priceCurrency) info.currency = ld.offers.priceCurrency;
    }
  }

  // 3. DOM — precio actual
  const priceFrac = document.querySelector<HTMLElement>(
    ".ui-pdp-price__second-line .andes-money-amount__fraction",
  );
  if (priceFrac?.textContent && info.current == null) {
    info.current = parsePriceArs(priceFrac.textContent);
    strategy = "dom";
  }

  // 4. DOM — precio original (tachado, antes del descuento)
  const origFrac = document.querySelector<HTMLElement>(
    ".ui-pdp-price__original-value .andes-money-amount__fraction, s.andes-money-amount__fraction",
  );
  if (origFrac?.textContent) {
    info.original = parsePriceArs(origFrac.textContent);
  }

  // 5. Porcentaje de descuento
  const discountEl = document.querySelector<HTMLElement>(
    ".ui-pdp-price__second-line__label, .andes-money-amount__discount",
  );
  if (discountEl?.textContent) {
    const m = discountEl.textContent.match(/(\d+)%/);
    if (m) info.discountPercent = parseInt(m[1], 10);
  }
  // Si no hay badge pero hay original + current, calculamos
  if (
    info.discountPercent == null &&
    info.original != null &&
    info.current != null &&
    info.original > info.current
  ) {
    info.discountPercent = Math.round(
      ((info.original - info.current) / info.original) * 100,
    );
  }

  // 6. Cuotas — "Mismo precio en 6 cuotas de $ 17.159,06"
  //    o "en 12x $ 8.580 sin interés"
  const instEl = document.querySelector<HTMLElement>(
    ".ui-pdp-payment, [data-testid='installments']",
  );
  const instText = instEl?.textContent ?? "";
  const mCount = instText.match(/(\d{1,2})\s*(?:x|cuotas?)\s*(?:de\s*)?/i);
  if (mCount) info.installmentCount = parseInt(mCount[1], 10);
  const mAmount = instText.match(/\$\s*([\d.,]+)/);
  if (mAmount) info.installmentAmount = parsePriceArs(mAmount[1]);
  if (/sin\s*inter[eé]s/i.test(instText)) info.installmentInterestFree = true;
  else if (/con\s*inter[eé]s/i.test(instText)) info.installmentInterestFree = false;

  return { value: info, strategy };
}

// =============================================================================
// Envío
// =============================================================================

export interface ShippingInfo {
  hasFreeShipping: boolean;
  isFull: boolean; // MercadoEnvíos Full
  hasStorePickup: boolean;
  sameDay: boolean; // "Llega gratis hoy"
}

export function extractShipping(): Tracked<ShippingInfo> {
  const info: ShippingInfo = {
    hasFreeShipping: false,
    isFull: false,
    hasStorePickup: false,
    sameDay: false,
  };

  const shippingRoot = document.querySelector<HTMLElement>(
    ".ui-pdp-shipping, .ui-pdp-color--GREEN, [data-testid='shipping-card']",
  );
  const text = (shippingRoot?.textContent ?? document.body.textContent ?? "").toLowerCase();

  if (/gratis|env[ií]o\s+gratis/.test(text)) info.hasFreeShipping = true;
  if (/full|mercadolibre\s+full|mercado\s+env[ií]os\s+full/.test(text)) info.isFull = true;
  if (/retir[aá]\s+gratis|retiro\s+en/.test(text)) info.hasStorePickup = true;
  if (/llega\s+(gratis\s+)?hoy/.test(text)) info.sameDay = true;

  // Badge específico de FULL (logo)
  if (document.querySelector(".ui-pdp-shipping__full-badge, [class*='full-badge']")) {
    info.isFull = true;
  }

  return { value: info, strategy: "dom" };
}

// =============================================================================
// Condición + stock + vendidos
// =============================================================================

export interface AvailabilityInfo {
  condition: "nuevo" | "usado" | "reacondicionado" | null;
  availableQuantity: number | null;
  soldQuantity: number | null;
}

export function extractAvailability(): Tracked<AvailabilityInfo> {
  const info: AvailabilityInfo = {
    condition: null,
    availableQuantity: null,
    soldQuantity: null,
  };

  const subtitle = document
    .querySelector<HTMLElement>(".ui-pdp-subtitle")
    ?.textContent?.trim()
    .toLowerCase();

  if (subtitle) {
    if (/nuevo/.test(subtitle)) info.condition = "nuevo";
    else if (/usad/.test(subtitle)) info.condition = "usado";
    else if (/reacondicionado/.test(subtitle)) info.condition = "reacondicionado";

    // "Nuevo | +500 vendidos" o "Usado | 20 vendidos"
    const sold = subtitle.match(/(\+?)(\d+)\s*vendido/);
    if (sold) {
      info.soldQuantity = parseInt(sold[2], 10);
    }
  }

  // Stock: "Stock disponible" con "(4 disponibles)"
  const stockText = document
    .querySelector<HTMLElement>(".ui-pdp-buybox__quantity")
    ?.textContent ?? "";
  const stockMatch = stockText.match(/\((\d+)\s*disponibles?\)/);
  if (stockMatch) info.availableQuantity = parseInt(stockMatch[1], 10);

  return { value: info, strategy: "dom" };
}

// =============================================================================
// Descripción completa
// =============================================================================

export function extractDescription(): Tracked<string | null> {
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
      if (text.length > 30) return { value: text, strategy: "dom" };
    }
  }

  const ld = readJsonLdProduct();
  if (ld?.description) return { value: ld.description.trim(), strategy: "json-ld" };

  return { value: null, strategy: "none" };
}

// =============================================================================
// Atributos / specs
// =============================================================================

export function extractAttributes(): Tracked<Record<string, string>> {
  const attrs: Record<string, string> = {};

  const rowSelectors = [
    ".ui-pdp-specs__table tr",
    ".andes-table__row",
    "tr.ui-vpp-striped-specs__row",
    ".ui-vpp-highlighted-specs__striped-specs li",
  ];
  for (const sel of rowSelectors) {
    document.querySelectorAll<HTMLElement>(sel).forEach((row) => {
      const cells = row.querySelectorAll(
        "th, td, .andes-table__header, .andes-table__column",
      );
      if (cells.length >= 2) {
        const k = cells[0]?.textContent?.trim();
        const v = cells[1]?.textContent?.trim();
        if (k && v && !attrs[k]) attrs[k] = v;
      }
    });
  }

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

  // Highlighted specs (la cajita de features destacados)
  document
    .querySelectorAll<HTMLElement>(".ui-vpp-highlighted-specs__features-list li")
    .forEach((li) => {
      const text = li.textContent?.trim();
      if (text && text.includes(":")) {
        const [k, ...rest] = text.split(":");
        const v = rest.join(":").trim();
        if (k && v && !attrs[k.trim()]) attrs[k.trim()] = v;
      }
    });

  return { value: attrs, strategy: Object.keys(attrs).length ? "dom" : "none" };
}

// =============================================================================
// Categoría (breadcrumb)
// =============================================================================

export function extractCategoryPath(): Tracked<string | null> {
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

  if (crumbs.length) return { value: crumbs.join(" > "), strategy: "dom" };

  const ld = readJsonLdProduct();
  if (ld?.category) return { value: ld.category, strategy: "json-ld" };

  return { value: null, strategy: "none" };
}

// =============================================================================
// Seller (extendido)
// =============================================================================

export interface SellerInfo {
  name: string | null;
  reputation: string | null;
  isOfficialStore: boolean;
  isMercadoLider: boolean;
  salesCompleted: string | null; // ej "+1000 ventas"
  positivePercent: number | null; // 0..100 si se puede extraer
}

export function extractSeller(): Tracked<SellerInfo> {
  const info: SellerInfo = {
    name: null,
    reputation: null,
    isOfficialStore: false,
    isMercadoLider: false,
    salesCompleted: null,
    positivePercent: null,
  };

  const nameSelectors = [
    ".ui-pdp-seller__link-trigger",
    ".ui-vip-profile-info__info-container h2",
    ".ui-pdp-seller__header__title",
    ".ui-pdp-seller__header__info-container__title",
  ];
  for (const sel of nameSelectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el?.textContent?.trim()) {
      info.name = el.textContent.trim();
      break;
    }
  }

  const reputationEl = document.querySelector<HTMLElement>(
    ".ui-pdp-seller__status-title",
  );
  if (reputationEl?.textContent?.trim()) {
    info.reputation = reputationEl.textContent.trim();
  }

  // Mercado Líder / Platinum — badge específico
  const sellerBlock = document.querySelector<HTMLElement>(
    ".ui-pdp-seller, .ui-vip-seller, [data-testid='seller-block']",
  );
  const sellerText = (sellerBlock?.textContent ?? "").toLowerCase();
  if (/mercadol[ií]der|mercado\s*l[ií]der/.test(sellerText)) {
    info.isMercadoLider = true;
  }

  // Tienda Oficial: suele haber un logo o badge dedicado
  if (
    /tienda\s*oficial/.test(sellerText) ||
    document.querySelector('[data-testid="official-store-logo"], .ui-pdp-official-store-label')
  ) {
    info.isOfficialStore = true;
  }

  // Ventas completadas: "+1000 ventas", "50 ventas"
  const salesMatch = sellerText.match(/(\+?\d[\d.]*)\s*(?:ventas|sold)/i);
  if (salesMatch) info.salesCompleted = salesMatch[0].trim();

  // % de positivos: buscar "99% positivo" o similar
  const posMatch = sellerText.match(/(\d{1,3})\s*%\s*(?:positivo|positivas)/i);
  if (posMatch) {
    const n = parseInt(posMatch[1], 10);
    if (n >= 0 && n <= 100) info.positivePercent = n;
  }

  return {
    value: info,
    strategy: info.name ? "dom" : "none",
  };
}

// =============================================================================
// Reviews
// =============================================================================

export interface ReviewsInfo {
  ratingAverage: number | null;
  reviewCount: number | null;
}

export function extractReviews(): Tracked<ReviewsInfo> {
  const info: ReviewsInfo = { ratingAverage: null, reviewCount: null };
  let strategy: Tracked<unknown>["strategy"] = "none";

  const ld = readJsonLdProduct();
  if (ld?.aggregateRating) {
    const r =
      typeof ld.aggregateRating.ratingValue === "string"
        ? parseFloat(ld.aggregateRating.ratingValue)
        : ld.aggregateRating.ratingValue;
    if (typeof r === "number" && Number.isFinite(r)) {
      info.ratingAverage = r;
      strategy = "json-ld";
    }
    const c =
      typeof ld.aggregateRating.reviewCount === "string"
        ? parseInt(ld.aggregateRating.reviewCount, 10)
        : ld.aggregateRating.reviewCount;
    if (typeof c === "number" && Number.isFinite(c)) info.reviewCount = c;
  }

  // DOM fallback
  if (info.ratingAverage == null) {
    const ratingEl = document.querySelector<HTMLElement>(
      ".ui-pdp-review__rating, .ui-pdp-rating, .andes-rating__value",
    );
    if (ratingEl?.textContent) {
      const n = parseFloat(ratingEl.textContent.trim().replace(",", "."));
      if (Number.isFinite(n)) {
        info.ratingAverage = n;
        strategy = "dom";
      }
    }
  }

  if (info.reviewCount == null) {
    const countEl = document.querySelector<HTMLElement>(
      ".ui-pdp-review__amount, .ui-pdp-reviews__rating__count",
    );
    if (countEl?.textContent) {
      const m = countEl.textContent.match(/(\d[\d.]*)/);
      if (m) info.reviewCount = parseInt(m[1].replace(/[.,]/g, ""), 10);
    }
  }

  return { value: info, strategy };
}

// =============================================================================
// Variantes (colores, talles, capacidades, etc.)
// =============================================================================

export interface VariantGroup {
  label: string; // "Color", "Talle", "Capacidad"
  selected: string | null;
  options: string[];
}

export function extractVariants(): Tracked<VariantGroup[]> {
  const groups: VariantGroup[] = [];

  // La UI nueva usa secciones con data-testid
  document
    .querySelectorAll<HTMLElement>(".ui-pdp-variations__picker, [data-testid^='variation']")
    .forEach((picker) => {
      const label =
        picker
          .querySelector<HTMLElement>(".ui-pdp-variations__label-text, h3, .ui-pdp-subtitle")
          ?.textContent?.trim() ?? "Variante";
      const selectedEl = picker.querySelector<HTMLElement>(
        ".ui-pdp-variations__selected, [aria-checked='true'] .ui-pdp-variations__label",
      );
      const selected = selectedEl?.textContent?.trim() ?? null;
      const options: string[] = [];
      picker
        .querySelectorAll<HTMLElement>(
          ".ui-pdp-variations__picker-label, .ui-pdp-variations__option, [role='radio']",
        )
        .forEach((opt) => {
          const t = opt.getAttribute("aria-label") || opt.textContent?.trim();
          if (t && !options.includes(t)) options.push(t);
        });
      if (options.length) {
        groups.push({ label, selected, options });
      }
    });

  return { value: groups, strategy: groups.length ? "dom" : "none" };
}

// =============================================================================
// Garantía + métodos de pago
// =============================================================================

export function extractWarranty(): Tracked<string | null> {
  const el = document.querySelector<HTMLElement>(
    ".ui-pdp-warranty, .ui-vpp-warranty, [data-testid='warranty']",
  );
  const text = el?.textContent?.trim();
  if (text) return { value: text, strategy: "dom" };
  return { value: null, strategy: "none" };
}

export function extractPaymentMethods(): Tracked<string[]> {
  const methods = new Set<string>();
  document
    .querySelectorAll<HTMLElement>(".ui-pdp-payment-methods__title, [class*='payment-method']")
    .forEach((el) => {
      const t = el.textContent?.trim();
      if (t) methods.add(t);
    });
  const list = Array.from(methods);
  return { value: list, strategy: list.length ? "dom" : "none" };
}
