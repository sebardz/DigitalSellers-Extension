/**
 * Background Service Worker (Manifest V3).
 *
 * Responsabilidades:
 *   - Recibir OPEN_TOOL del content-script, guardar payload en storage,
 *     abrir nueva tab con URL del tool + sessionId
 *   - Recibir FETCH_SESSION del content-script bridge en las herramientas,
 *     devolver el payload guardado
 *   - Purgar sessions expiradas en onStartup
 *   - Responder HEALTH_CHECK sin depender de un servicio retirado
 *   - Abrir options page cuando lo pidan desde el content-script
 */

import type {
  ExtensionMessage,
  ExtensionResponse,
  OpenToolMessage,
  FetchSessionMessage,
  HealthCheckMessage,
  HealthCheckResponse,
} from "@shared/messaging";
import {
  consumeSession,
  purgeExpiredSessions,
  saveSession,
} from "@shared/storage";
import { getTool } from "@shared/tools";

const EXT_VERSION = chrome.runtime.getManifest().version;

// =============================================================================
// Lifecycle
// =============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.info(`[DSH/bg] instalado (reason=${details.reason}) v${EXT_VERSION}`);
  void purgeExpiredSessions();
});

chrome.runtime.onStartup.addListener(() => {
  console.info(`[DSH/bg] startup — purging expired sessions`);
  void purgeExpiredSessions();
});

// =============================================================================
// Message router
// =============================================================================

chrome.runtime.onMessage.addListener(
  (msg: ExtensionMessage | { type: "OPEN_OPTIONS" }, _sender, sendResponse) => {
    // Tipos externos que no están en el union principal
    if ("type" in msg && msg.type === "OPEN_OPTIONS") {
      void chrome.runtime.openOptionsPage();
      sendResponse({ type: "OPEN_OPTIONS_RESULT", ok: true });
      return true;
    }

    switch (msg.type) {
      case "OPEN_TOOL":
        void handleOpenTool(msg as OpenToolMessage).then(sendResponse);
        return true; // async response

      case "FETCH_SESSION":
        void handleFetchSession(msg as FetchSessionMessage).then(sendResponse);
        return true;

      case "HEALTH_CHECK":
        void handleHealthCheck(msg as HealthCheckMessage).then(sendResponse);
        return true;

      default:
        return false;
    }
  },
);

// =============================================================================
// Handlers
// =============================================================================

async function handleOpenTool(msg: OpenToolMessage): Promise<ExtensionResponse> {
  const tool = getTool(msg.toolId);
  if (!tool || !tool.enabled) {
    return {
      type: "OPEN_TOOL_RESULT",
      ok: false,
      error: `Tool "${msg.toolId}" no está disponible.`,
    };
  }

  if (tool.minExtensionVersion && !isVersionGte(EXT_VERSION, tool.minExtensionVersion)) {
    return {
      type: "OPEN_TOOL_RESULT",
      ok: false,
      error: `Esta tool requiere extensión ${tool.minExtensionVersion} o superior.`,
    };
  }

  const sessionId = crypto.randomUUID();
  await saveSession(sessionId, msg.payload);

  const url = new URL(tool.targetPath, tool.targetOrigin);
  url.searchParams.set("source", "extension");
  url.searchParams.set("sessionId", sessionId);
  url.searchParams.set("version", EXT_VERSION);
  url.searchParams.set("toolId", tool.id);

  const tab = await chrome.tabs.create({ url: url.toString() });

  return {
    type: "OPEN_TOOL_RESULT",
    ok: true,
    tabId: tab.id,
    sessionId,
  };
}

async function handleFetchSession(
  msg: FetchSessionMessage,
): Promise<ExtensionResponse> {
  const payload = await consumeSession(msg.sessionId);
  if (!payload) {
    return {
      type: "FETCH_SESSION_RESULT",
      ok: false,
      error: "Sesión no encontrada o expirada.",
    };
  }
  return {
    type: "FETCH_SESSION_RESULT",
    ok: true,
    payload,
  };
}

async function handleHealthCheck(
  _msg: HealthCheckMessage,
): Promise<HealthCheckResponse> {
  return {
    type: "HEALTH_CHECK_RESULT",
    ok: true,
    versionOk: true,
    currentVersion: EXT_VERSION,
  };
}

// =============================================================================
// Utils
// =============================================================================

/** Compara dos semvers. Devuelve true si `a >= b`. */
function isVersionGte(a: string, b: string): boolean {
  const pa = a.split(".").map((n) => parseInt(n, 10));
  const pb = b.split(".").map((n) => parseInt(n, 10));
  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return true;
}
