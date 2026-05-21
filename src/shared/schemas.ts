/**
 * Zod schemas del contrato Extension -> Analyzer.
 *
 * La extension NO transporta datos de producto de MercadoLibre. Solo envia
 * una referencia minima para que Analyzer hidrate desde la API oficial MeLi.
 */

import { z } from "zod";

const meliIdRegex = /^ML[A-Z]{1,3}\d+$/;
const siteIdRegex = /^ML[A-Z]{1,3}$/;

export const BaseReferencePayloadSchema = z.object({
  extensionVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  capturedAt: z.string().datetime(),
  source: z.literal("chrome-extension"),
  sourceMode: z.literal("official-api-reference"),
  url: z.string().url(),
  siteId: z.string().regex(siteIdRegex),
  itemId: z.string().regex(meliIdRegex).optional(),
  catalogProductId: z.string().regex(meliIdRegex).optional(),
});

export const AnalyzerScrapedPayloadSchema = BaseReferencePayloadSchema.extend({
  toolId: z.enum(["analyzer-pack-visual", "analyzer-video-pack"]),
}).refine((payload) => !!payload.itemId || !!payload.catalogProductId, {
  message: "Se requiere itemId o catalogProductId para hidratar desde API oficial MeLi.",
});

export type AnalyzerScrapedPayload = z.infer<typeof AnalyzerScrapedPayloadSchema>;

export const SimulatorScrapedPayloadSchema = BaseReferencePayloadSchema.extend({
  toolId: z.literal("simulator-calc"),
}).refine((payload) => !!payload.itemId || !!payload.catalogProductId, {
  message: "Se requiere itemId o catalogProductId para hidratar desde API oficial MeLi.",
});

export type SimulatorScrapedPayload = z.infer<typeof SimulatorScrapedPayloadSchema>;

export const ScrapedPayloadSchema = z.union([
  AnalyzerScrapedPayloadSchema,
  SimulatorScrapedPayloadSchema,
]);

export type ScrapedPayload = z.infer<typeof ScrapedPayloadSchema>;
