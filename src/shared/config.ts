/**
 * Configuración central de la extensión.
 *
 * Si querés apuntar a un entorno distinto (staging, local) cambiá estas
 * URLs acá. No usamos `process.env` porque Chrome extensions no lo exponen
 * nativamente — el build de Vite inlinea estas constantes.
 */

export const ANALYZER_ORIGIN = "https://analyzer.digitalsellers.com.ar";
export const SIMULATOR_ORIGIN = "https://simulador.digitalsellers.com.ar";

/**
 * Endpoint que la extensión pinguea al arrancar para saber si su versión
 * sigue soportada. El Analyzer devuelve `{ minExtensionVersion, notice }`.
 */
export const HEALTH_ENDPOINT = `${ANALYZER_ORIGIN}/api/extension/health`;

/** Endpoint opcional para telemetría anónima (uso por tool). */
export const TELEMETRY_ENDPOINT = `${ANALYZER_ORIGIN}/api/extension/telemetry`;

/** Nombre del namespace usado en chrome.storage.local para sesiones activas. */
export const STORAGE_SESSION_PREFIX = "dsh:session:";

/**
 * Cuánto tiempo mantenemos un payload pre-scrapeado en storage antes de
 * descartarlo. La tab del Analyzer debería consumirlo en segundos, pero
 * si el user cierra la pestaña sin arrancar, lo limpiamos.
 */
export const SESSION_TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Host permissions usadas para detectar si estamos en una página de MeLi.
 * Mantener sincronizado con `manifest.json` → `host_permissions`.
 */
export const MELI_HOSTS = [
  "mercadolibre.com.ar",
  "mercadolivre.com.br",
  "mercadolibre.com.mx",
  "mercadolibre.cl",
  "mercadolibre.com.co",
  "mercadolibre.com.pe",
] as const;
