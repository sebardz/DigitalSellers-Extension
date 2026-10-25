import { describe, expect, it } from "vitest";
import { ScrapedPayloadSchema } from "../src/shared/schemas";

const reference = {
  extensionVersion: "0.4.0",
  capturedAt: "2026-10-25T12:00:00.000Z",
  source: "chrome-extension",
  sourceMode: "official-api-reference",
  url: "https://www.mercadolibre.com.ar/qa",
  siteId: "MLA",
  toolId: "simulator-calc",
  itemId: "MLA1234567890",
};

describe("reference payload after the Zod 4 migration", () => {
  it("accepts an item reference and a catalog-only reference", () => {
    expect(ScrapedPayloadSchema.parse(reference)).toEqual(reference);
    const { itemId: _item, ...catalog } = reference;
    expect(ScrapedPayloadSchema.safeParse({ ...catalog, catalogProductId: "MLA123456" }).success).toBe(true);
  });
  it("requires at least one official identifier", () => {
    const { itemId: _item, ...withoutItem } = reference;
    expect(ScrapedPayloadSchema.safeParse(withoutItem).success).toBe(false);
  });
  it.each([
    { sourceMode: "scraped-data" },
    { toolId: "foreign-tool" },
    { capturedAt: "yesterday" },
    { siteId: "foreign" },
    { itemId: "not-an-item" },
    { url: "not-a-url" },
  ])("rejects incompatible references: %j", (change) => {
    expect(ScrapedPayloadSchema.safeParse({ ...reference, ...change }).success).toBe(false);
  });
});
