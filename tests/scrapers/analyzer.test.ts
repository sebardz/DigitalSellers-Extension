/**
 * Tests del scraper del Analyzer contra fixtures HTML reales.
 *
 * Los fixtures viven en `tests/fixtures/` y son copias sanitizadas de PDPs
 * reales de MeLi (sin scripts de tracking, sin datos sensibles).
 */

import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { scrapeForAnalyzer } from "@content/scrapers/analyzer";

const FIXTURES = resolve(__dirname, "..", "fixtures");

function loadFixture(name: string, url: string): void {
  const html = readFileSync(resolve(FIXTURES, name), "utf8");
  document.documentElement.innerHTML = html;
  Object.defineProperty(window, "location", {
    value: new URL(url),
    writable: true,
  });
}

describe("scrapeForAnalyzer — PDP catálogo con item_id filter", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "";
  });

  it("extrae un payload completo con todos los campos visibles", () => {
    loadFixture(
      "pdp-common.html",
      "https://www.mercadolibre.com.ar/varillas-difusoras-de-rattan-premium-20cm-x-50-unidades/p/MLA2071611851?pdp_filters=item_id:MLA1749487493",
    );

    const result = scrapeForAnalyzer("analyzer-pack-visual", "0.2.0");

    expect(result).not.toBeNull();
    expect(result?.toolId).toBe("analyzer-pack-visual");
    expect(result?.siteId).toBe("MLA");
    expect(result?.itemId).toBe("MLA1749487493");
    expect(result?.catalogProductId).toBe("MLA2071611851");
    expect(result?.title).toContain("Varillas Difusoras");
    expect(result?.images.length).toBeGreaterThan(0);
    expect(result?.attributes).toEqual(
      expect.objectContaining({ Marca: "Genérico", Material: "Rattan" }),
    );
    expect(result?.description).toContain("rattan");
    expect(result?.category).toContain("Hogar");
    expect(result?.seller?.name).toBe("MiTiendaAromas");
    // Debug info presente
    expect(result?._debug.fieldsTotal).toBeGreaterThan(10);
  });
});

describe("scrapeForAnalyzer — PDP tienda oficial", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "";
  });

  it("extrae precio, cuotas, oferta, reviews y marca oficial", () => {
    loadFixture(
      "pdp-tienda-oficial.html",
      "https://www.mercadolibre.com.ar/xiaomi-smart-band-8-pro/p/MLA123456789",
    );

    const result = scrapeForAnalyzer("analyzer-pack-visual", "0.2.0");

    expect(result).not.toBeNull();
    expect(result?.title).toBe("Xiaomi Smart Band 8 Pro");
    expect(result?.catalogProductId).toBe("MLA123456789");
    expect(result?.price?.current).toBe(149999);
    expect(result?.price?.original).toBe(176000);
    expect(result?.price?.discountPercent).toBe(15);
    expect(result?.price?.installmentCount).toBe(12);
    expect(result?.price?.installmentInterestFree).toBe(true);
    expect(result?.shipping?.hasFreeShipping).toBe(true);
    expect(result?.shipping?.isFull).toBe(true);
    expect(result?.condition).toBe("nuevo");
    expect(result?.soldQuantity).toBe(1000);
    expect(result?.availableQuantity).toBe(8);
    expect(result?.reviews?.ratingAverage).toBe(4.7);
    expect(result?.reviews?.reviewCount).toBe(312);
    expect(result?.variants?.length).toBe(1);
    expect(result?.variants?.[0]?.label).toBe("Color");
    expect(result?.variants?.[0]?.options).toContain("Negro");
    expect(result?.sellerExtended?.isOfficialStore).toBe(true);
    expect(result?.sellerExtended?.isMercadoLider).toBe(true);
    expect(result?.sellerExtended?.positivePercent).toBe(99);
    expect(result?.warranty).toContain("12 meses");
  });
});

describe("scrapeForAnalyzer — PDP usado (articulo.mercadolibre)", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "";
  });

  it("detecta condición 'usado', seller básico, sin reviews", () => {
    loadFixture(
      "pdp-usado.html",
      "https://articulo.mercadolibre.com.ar/MLA-987654321-iphone-13-pro-256gb-usado",
    );

    const result = scrapeForAnalyzer("analyzer-pack-visual", "0.2.0");

    expect(result).not.toBeNull();
    expect(result?.itemId).toBe("MLA987654321");
    expect(result?.catalogProductId).toBeUndefined();
    expect(result?.condition).toBe("usado");
    expect(result?.soldQuantity).toBe(3);
    expect(result?.seller?.name).toBe("JuanVendeCelus");
    expect(result?.reviews?.ratingAverage).toBeNull();
  });
});

describe("scrapeForAnalyzer — páginas no PDP", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "";
  });

  it("devuelve null en una página sin indicadores de producto", () => {
    document.documentElement.innerHTML = "<html><body><p>no pdp</p></body></html>";
    Object.defineProperty(window, "location", {
      value: new URL("https://www.mercadolibre.com.ar/"),
      writable: true,
    });
    const result = scrapeForAnalyzer("analyzer-pack-visual", "0.2.0");
    expect(result).toBeNull();
  });
});
