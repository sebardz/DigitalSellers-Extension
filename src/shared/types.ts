/**
 * Interfaces globales de la extensión. Tipos más especializados viven
 * junto al módulo que los usa (ej. scraper output en `scrapers/_core.ts`).
 */

import type { SiteId } from "./config";

/**
 * Payload base que TODAS las tools reciben al arrancar desde la extensión.
 * Cada tool extiende con campos propios (ver `schemas.ts`).
 */
export interface BaseScrapedPayload {
  /** Versión semver de la extensión que lo generó. */
  extensionVersion: string;
  /** Cuándo se scrapeó (ISO 8601). */
  scrapedAt: string;
  /** Literal para diferenciar del flow de copy-paste tradicional. */
  source: "chrome-extension";
  /** URL canónica de la PDP. */
  url: string;
  /** Código oficial de sitio MeLi. */
  siteId: SiteId;
  /** MLA id (si se pudo extraer). */
  itemId?: string;
  /** product_id del catálogo (si la PDP es de catálogo). */
  catalogProductId?: string;
}

/** Opciones guardadas en chrome.storage.sync del user. */
export interface UserPreferences {
  /** Tool default (click directo al botón sin menú). */
  defaultToolId: string | null;
  /** Posición del botón flotante. */
  buttonPosition: { bottom: number; right: number };
  /** Forzar tema dark/light. null = seguir al sistema. */
  theme: "dark" | "light" | null;
  /** ¿Mandar telemetría anónima? (opt-in). */
  telemetry: boolean;
  /** ¿Mostrar el botón en sitios MeLi? (kill switch). */
  enabled: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultToolId: null,
  buttonPosition: { bottom: 24, right: 24 },
  theme: null,
  telemetry: true,
  enabled: true,
};

/** Respuesta del endpoint /api/extension/health del Analyzer. */
export interface HealthCheckResponse {
  ok: boolean;
  minExtensionVersion: string;
  notice?: string;
  /** Si el Analyzer detectó que tiene que deshabilitar alguna tool, la lista. */
  disabledTools?: string[];
}
