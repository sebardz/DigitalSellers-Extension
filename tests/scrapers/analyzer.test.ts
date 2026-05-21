import { beforeEach, describe, expect, it } from "vitest";
import { scrapeForAnalyzer } from "@content/scrapers/analyzer";

function setLocation(url: string): void {
  Object.defineProperty(window, "location", {
    value: new URL(url),
    writable: true,
  });
}

describe("scrapeForAnalyzer — official API reference payload", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "";
  });

  it("collects only official identifiers from catalog PDP URLs", () => {
    setLocation(
      "https://www.mercadolibre.com.ar/varillas-difusoras/p/MLA2071611851?pdp_filters=item_id:MLA1749487493",
    );

    const result = scrapeForAnalyzer("analyzer-pack-visual", "0.4.0");

    expect(result).toEqual(
      expect.objectContaining({
        extensionVersion: "0.4.0",
        source: "chrome-extension",
        sourceMode: "official-api-reference",
        url: window.location.href,
        siteId: "MLA",
        itemId: "MLA1749487493",
        catalogProductId: "MLA2071611851",
        toolId: "analyzer-pack-visual",
      }),
    );
    expect(result).not.toHaveProperty("title");
    expect(result).not.toHaveProperty("price");
    expect(result).not.toHaveProperty("images");
    expect(result).not.toHaveProperty("attributes");
  });

  it("infers siteId from the official item id, not from a host mapping", () => {
    setLocation("https://www.mercadolivre.com.br/MLB-123456789-produto");

    const result = scrapeForAnalyzer("analyzer-video-pack", "0.4.0");

    expect(result).toEqual(
      expect.objectContaining({
        siteId: "MLB",
        itemId: "MLB123456789",
        toolId: "analyzer-video-pack",
      }),
    );
  });

  it("returns null outside product detail URLs", () => {
    setLocation("https://www.mercadolibre.com.ar/");

    expect(scrapeForAnalyzer("analyzer-pack-visual", "0.4.0")).toBeNull();
  });
});
