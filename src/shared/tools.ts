/**
 * Tool Registry — fuente única de verdad de TODAS las herramientas DS
 * que la extensión puede disparar desde una página de MercadoLibre.
 *
 * Agregar una tool nueva = agregar una entry aca + crear su collector en
 * `src/content/scrapers/<scraperId>.ts`. No hay que tocar UI ni router.
 */

import { SIMULATOR_ORIGIN } from "./config";

export interface ToolDefinition {
  /** Identifier único (kebab-case). Va en telemetría y mensajes. */
  id: string;
  /** Label del menú. Corto, 2-3 palabras. */
  label: string;
  /** Icon emoji o nombre de asset. En v0.1 usamos emojis por simplicidad. */
  icon: string;
  /** Blurb de 1 línea que aparece debajo del label. */
  description: string;
  /** Origin de destino (donde abrimos la nueva tab). */
  targetOrigin: string;
  /**
   * Path + querystring de destino. Se le agregan `sessionId`, `source=extension`
   * y `version` automáticamente.
   */
  targetPath: string;
  /**
   * ID del collector que alimenta a esta tool. Debe coincidir con un archivo
   * en `src/content/scrapers/<id>.ts` que exporta default una función.
   */
  scraperId: string;
  /**
   * Si esta tool requiere extensión >= esta versión. Permite deprecar tools
   * viejas sin romper users. Chequeado en background worker.
   */
  minExtensionVersion?: string;
  /** Aparece con badge "Beta" en el menú. */
  beta?: boolean;
  /**
   * Si `false`, no aparece en el menú aunque esté definida (feature flag).
   * Útil para tools en desarrollo que queremos commitear pero no exponer.
   */
  enabled: boolean;
  /**
   * Orden en el menú (bajo número = arriba). Si dos tienen el mismo orden,
   * ordenamos alfabético por label.
   */
  order: number;
}

export const TOOLS: readonly ToolDefinition[] = [
  {
    id: "simulator-calc",
    label: "Calcular Ganancia",
    icon: "🧮",
    description: "Comisión, costos y ganancia neta de esta publicación",
    targetOrigin: SIMULATOR_ORIGIN,
    targetPath: "/",
    scraperId: "simulator",
    enabled: false, // v0.2 — habilitamos cuando tengamos el scraper
    beta: true,
    order: 10,
  },
] as const;

export function getTool(id: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function listEnabledTools(): ToolDefinition[] {
  return TOOLS.filter((t) => t.enabled).sort(
    (a, b) => a.order - b.order || a.label.localeCompare(b.label),
  );
}
