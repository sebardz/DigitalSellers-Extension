/**
 * Tests del scraper del Analyzer contra fixtures HTML reales.
 *
 * Los fixtures viven en `tests/fixtures/` y son copias sanitizadas de PDPs
 * reales de MeLi (sin datos sensibles, sin scripts de tracking).
 */

import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { scrapeForAnalyzer } from "@content/scrapers/analyzer";

const FIXTURES = resolve(__dirname, "..", "fixtures");

function loadFixture(name: string): void {
  const html = readFileSync(resolve(FIXTURES, name), "utf8");
  document.documentElement.innerHTML = html;
  // JSDOM no setea location automáticamente del HTML, la dejamos fija para tests
  Object.defineProperty(window, "location", {
    value: new URL(
      "https://www.mercadolibre.com.ar/varillas-difusoras-de-rattan-premium-20cm-x-50-unidades/p/MLA2071611851?pdp_filters=item_id:MLA1749487493",
    ),
    writable: true,
  });
}

describe("scrapeForAnalyzer", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "";
  });

  it("extrae un payload completo de una PDP de catálogo con item filter", () => {
    loadFixture("pdp-common.html");

    const result = scrapeForAnalyzer("analyzer-pack-visual", "0.1.0");

    expect(result).not.toBeNull();
    expect(result?.toolId).toBe("analyzer-pack-visual");
    expect(result?.extensionVersion).toBe("0.1.0");
    expect(result?.source).toBe("chrome-extension");
    expect(result?.siteId).toBe("MLA");
    expect(result?.itemId).toBe("MLA1749487493");
    expect(result?.catalogProductId).toBe("MLA2071611851");
    expect(result?.title).toContain("Varillas Difusoras");
    expect(result?.images.length).toBeGreaterThan(0);
    expect(result?.attributes).toEqual(
      expect.objectContaining({
        Marca: "Genérico",
        Material: "Rattan",
      }),
    );
    expect(result?.description).toContain("rattan");
    expect(result?.category).toContain("Hogar");
    expect(result?.seller?.name).toBe("MiTiendaAromas");
  });

  it("devuelve null si no es una PDP", () => {
    document.documentElement.innerHTML = "<html><body><p>no es pdp</p></body></html>";
    const result = scrapeForAnalyzer("analyzer-pack-visual", "0.1.0");
    expect(result).toBeNull();
  });
});
