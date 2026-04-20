/**
 * Zod schemas del contrato Extension ↔ Analyzer.
 *
 * Mantener sincronizado con:
 *   Analyzer/src/lib/extension/schema.ts (server-side)
 *
 * Si alguno cambia sin que el otro se actualice, el endpoint rechaza
 * los requests hasta que matcheen.
 */

import { z } from "zod";

const mlaIdRegex = /^ML[A-Z]\d+$/;

export const SiteIdSchema = z.enum(["MLA", "MLB", "MLM", "MLC", "MCO", "MPE"]);

export const BaseScrapedPayloadSchema = z.object({
  extensionVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  scrapedAt: z.string().datetime(),
  source: z.literal("chrome-extension"),
  url: z.string().url(),
  siteId: SiteIdSchema,
  itemId: z.string().regex(mlaIdRegex).optional(),
  catalogProductId: z.string().regex(mlaIdRegex).optional(),
});

// ============== Sub-schemas de campos ricos ==============

const PriceInfoSchema = z.object({
  current: z.number().nullable(),
  original: z.number().nullable(),
  currency: z.string(),
  discountPercent: z.number().nullable(),
  installmentCount: z.number().nullable(),
  installmentAmount: z.number().nullable(),
  installmentInterestFree: z.boolean().nullable(),
});

const ShippingInfoSchema = z.object({
  hasFreeShipping: z.boolean(),
  isFull: z.boolean(),
  hasStorePickup: z.boolean(),
  sameDay: z.boolean(),
});

const ReviewsSchema = z.object({
  ratingAverage: z.number().nullable(),
  reviewCount: z.number().nullable(),
});

const VariantGroupSchema = z.object({
  label: z.string(),
  selected: z.string().nullable(),
  options: z.array(z.string()),
});

const SellerExtendedSchema = z.object({
  isOfficialStore: z.boolean(),
  isMercadoLider: z.boolean(),
  salesCompleted: z.string().nullable(),
  positivePercent: z.number().min(0).max(100).nullable(),
});

// ============== Payload completo del Analyzer ==============

export const AnalyzerScrapedPayloadSchema = BaseScrapedPayloadSchema.extend({
  toolId: z.enum(["analyzer-pack-visual", "analyzer-video-pack"]),
  title: z.string().min(1).max(500),
  description: z.string().nullable().or(z.literal("")),
  images: z.array(z.string().url()).min(1).max(60),
  attributes: z.record(z.string(), z.string()),
  category: z.string().nullable().optional(),
  seller: z
    .object({
      name: z.string().nullable(),
      reputation: z.string().nullable(),
    })
    .optional()
    .nullable(),
  // Campos extendidos
  price: PriceInfoSchema.optional(),
  shipping: ShippingInfoSchema.optional(),
  condition: z.enum(["nuevo", "usado", "reacondicionado"]).nullable().optional(),
  availableQuantity: z.number().nullable().optional(),
  soldQuantity: z.number().nullable().optional(),
  reviews: ReviewsSchema.optional(),
  variants: z.array(VariantGroupSchema).optional(),
  sellerExtended: SellerExtendedSchema.optional(),
  warranty: z.string().nullable().optional(),
  paymentMethods: z.array(z.string()).optional(),
});

export type AnalyzerScrapedPayload = z.infer<typeof AnalyzerScrapedPayloadSchema>;

export const SimulatorScrapedPayloadSchema = BaseScrapedPayloadSchema.extend({
  toolId: z.literal("simulator-calc"),
  title: z.string(),
  price: z.number().positive(),
  currency: z.string(),
  hasFreeShipping: z.boolean(),
  hasOffer: z.boolean().optional(),
  categoryPath: z.string().nullable(),
  weight: z.number().optional(),
});

export type SimulatorScrapedPayload = z.infer<typeof SimulatorScrapedPayloadSchema>;

export const ScrapedPayloadSchema = z.discriminatedUnion("toolId", [
  AnalyzerScrapedPayloadSchema,
  SimulatorScrapedPayloadSchema,
]);

export type ScrapedPayload = z.infer<typeof ScrapedPayloadSchema>;
