/**
 * Zod schemas del contrato Extension ↔ Analyzer/Simulador.
 *
 * El server usa estos mismos schemas para validar cada POST que llega
 * del frontend con data de la extensión. Si MeLi cambia el HTML y el
 * scraper devuelve un shape inválido, preferimos cortar acá y devolver
 * un error claro que procesar basura y generar un pack deforme.
 *
 * Importante: mantener este archivo sincronizado con el equivalente
 * server-side del Analyzer (`src/lib/extension/schema.ts`). Si los dos
 * se desvían, el endpoint rechaza todos los requests.
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

/** Payload para Analyzer (pack visual, video pack). */
export const AnalyzerScrapedPayloadSchema = BaseScrapedPayloadSchema.extend({
  toolId: z.enum(["analyzer-pack-visual", "analyzer-video-pack"]),
  title: z.string().min(1),
  description: z.string().nullable(),
  images: z.array(z.string().url()).min(1),
  attributes: z.record(z.string(), z.string()),
  category: z.string().nullable().optional(),
  seller: z
    .object({
      name: z.string().nullable(),
      reputation: z.string().nullable(),
    })
    .optional(),
});

export type AnalyzerScrapedPayload = z.infer<typeof AnalyzerScrapedPayloadSchema>;

/** Payload para Simulador (v0.2). */
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

/** Union de todos los payloads posibles. Discriminado por `toolId`. */
export const ScrapedPayloadSchema = z.discriminatedUnion("toolId", [
  AnalyzerScrapedPayloadSchema,
  SimulatorScrapedPayloadSchema,
]);

export type ScrapedPayload = z.infer<typeof ScrapedPayloadSchema>;
