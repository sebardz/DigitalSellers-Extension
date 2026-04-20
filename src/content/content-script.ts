/**
 * Content Script — se inyecta en páginas de MercadoLibre y del Analyzer.
 *
 * Dos responsabilidades bien distintas según en qué host esté corriendo:
 *
 *   A) En MercadoLibre:
 *      - Detectar si estamos en una PDP
 *      - Inyectar el botón flotante + menú de tools
 *      - Cuando el user elige una tool, correr su scraper y mandar el
 *        payload al background worker
 *
 *   B) En Analyzer/Simulador:
 *      - Escuchar window.postMessage del frontend
 *      - Relayear fetchSession hacia el background worker
 *      - Devolver el payload para que el frontend arranque el flow
 */

import { isMeliSite, isProductDetailPage } from "./scrapers/_core";
import { runScraper } from "./scrapers";
import { listEnabledTools, getTool } from "@shared/tools";
import { mountFab } from "./button";
import { mountMenu } from "./menu";
import { showToast } from "./toast";
import { sendMessage } from "@shared/messaging";
import { getPreferences } from "@shared/storage";
import { ANALYZER_ORIGIN, SIMULATOR_ORIGIN } from "@shared/config";

// Versión hardcodeada en build. Vite inlinea con define.
const EXT_VERSION = chrome.runtime.getManifest().version;

// =============================================================================
// Bootstrap
// =============================================================================

void (async function main() {
  const host = location.host;
  const origin = location.origin;

  if (origin === ANALYZER_ORIGIN || origin === SIMULATOR_ORIGIN) {
    setupBridgeForTool();
    return;
  }

  if (!isMeliSite()) return;

  await setupForMeliPage();

  // SPA navigation — MeLi cambia de PDP sin recargar. Escuchamos cambios
  // de path para re-mount el botón si corresponde.
  let lastPath = location.pathname;
  const observer = new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      setTimeout(() => {
        // Damos 500ms para que MeLi termine de hidratar la nueva PDP
        void setupForMeliPage();
      }, 500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Log dev-friendly
  console.info(`[DSH] v${EXT_VERSION} listo en ${host}`);
})();

// =============================================================================
// Flow A — en MercadoLibre
// =============================================================================

let mounted = false;

async function setupForMeliPage() {
  // Si ya hay un root, limpiar antes de volver a montar
  document.getElementById("dsh-root")?.remove();
  mounted = false;

  if (!isProductDetailPage()) return;

  const prefs = await getPreferences();
  if (!prefs.enabled) return;

  const tools = listEnabledTools();
  if (tools.length === 0) return;

  const fab = mountFab({
    bottom: prefs.buttonPosition.bottom,
    right: prefs.buttonPosition.right,
    onClick: () => toggleMenu(),
  });

  // Montar menú en el mismo shadow root que el botón
  const shadowRoot = fab.host.shadowRoot;
  if (!shadowRoot) return;

  const menu = mountMenu(shadowRoot, {
    tools,
    extensionVersion: EXT_VERSION,
    onPickTool: (toolId) => handleToolClick(toolId, shadowRoot),
    onOpenOptions: () => {
      void chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
    },
  });

  let open = false;
  const toggleMenu = () => {
    open = !open;
    fab.setOpen(open);
    menu.setOpen(open);
  };

  // Cerrar menú al clickear afuera
  document.addEventListener("click", () => {
    if (open) {
      open = false;
      fab.setOpen(false);
      menu.setOpen(false);
    }
  });

  mounted = true;
}

async function handleToolClick(toolId: string, shadowRoot: ShadowRoot) {
  const tool = getTool(toolId);
  if (!tool) {
    showToast(shadowRoot, {
      kind: "error",
      message: `Herramienta "${toolId}" no encontrada.`,
    });
    return;
  }

  // Correr el scraper correspondiente
  const payload = runScraper(tool.scraperId, tool.id, EXT_VERSION);
  if (!payload) {
    showToast(shadowRoot, {
      kind: "error",
      message:
        "No pudimos leer los datos de esta publicación. ¿Es una PDP válida?",
    });
    return;
  }

  showToast(shadowRoot, {
    kind: "info",
    message: `Abriendo ${tool.label}…`,
    durationMs: 2500,
  });

  try {
    const res = await sendMessage({
      type: "OPEN_TOOL",
      toolId: tool.id,
      payload: payload as Record<string, unknown> & {
        extensionVersion: string;
        scrapedAt: string;
        source: "chrome-extension";
        url: string;
        siteId: "MLA" | "MLB" | "MLM" | "MLC" | "MCO" | "MPE";
      },
    });

    if (res.type === "OPEN_TOOL_RESULT" && !res.ok) {
      showToast(shadowRoot, {
        kind: "error",
        message: res.error || "No se pudo abrir la herramienta.",
      });
    }
  } catch (err) {
    showToast(shadowRoot, {
      kind: "error",
      message: err instanceof Error ? err.message : "Error inesperado.",
    });
  }
}

// =============================================================================
// Flow B — en Analyzer/Simulador (bridge)
// =============================================================================

/**
 * En la página del Analyzer/Simulador, la extensión actúa como puente:
 * el frontend pregunta "dame el payload de la sessionId X" vía
 * window.postMessage, y nosotros lo pedimos al background worker y
 * lo devolvemos.
 *
 * El frontend NO puede acceder a chrome.storage directamente — por eso
 * este relay.
 */
function setupBridgeForTool() {
  // Dedupe: la Analyzer hace retry cada 400ms mientras espera la primera
  // respuesta. Si contestamos a todos los retries con el mismo requestId
  // no hay problema (el lado Analyzer ignora los duplicados vía handler
  // cleanup), pero evitamos trabajo extra cacheando por requestId.
  const seenRequestIds = new Set<string>();

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.origin !== location.origin) return;

    const data = event.data as {
      type?: string;
      sessionId?: string;
      requestId?: string;
    };
    if (data?.type !== "DSH_FETCH_SESSION") return;
    if (!data.sessionId || !data.requestId) return;

    // Evitar re-procesar el mismo requestId (retries del Analyzer).
    if (seenRequestIds.has(data.requestId)) return;
    seenRequestIds.add(data.requestId);

    void (async () => {
      try {
        const res = await sendMessage({
          type: "FETCH_SESSION",
          sessionId: data.sessionId as string,
        });
        window.postMessage(
          {
            type: "DSH_FETCH_SESSION_RESULT",
            requestId: data.requestId,
            ok: res.type === "FETCH_SESSION_RESULT" ? res.ok : false,
            payload:
              res.type === "FETCH_SESSION_RESULT" ? res.payload : undefined,
            error: res.type === "FETCH_SESSION_RESULT" ? res.error : undefined,
          },
          location.origin,
        );
      } catch (err) {
        window.postMessage(
          {
            type: "DSH_FETCH_SESSION_RESULT",
            requestId: data.requestId,
            ok: false,
            error: err instanceof Error ? err.message : "bridge error",
          },
          location.origin,
        );
      }
    })();
  });

  // Marcamos la página para que el frontend sepa que la extensión está viva.
  // Lo emitimos MÚLTIPLES VECES con delay para cubrir el caso de que el
  // React de la Analyzer monte después del content-script y se pierda los
  // primeros signals.
  const announce = () =>
    window.postMessage(
      {
        type: "DSH_EXTENSION_READY",
        version: EXT_VERSION,
      },
      location.origin,
    );
  announce();
  setTimeout(announce, 100);
  setTimeout(announce, 500);
  setTimeout(announce, 1500);

  console.info(`[DSH] bridge activo en ${location.origin} (v${EXT_VERSION})`);
}

// Evitar warning de variable sin usar
void mounted;
