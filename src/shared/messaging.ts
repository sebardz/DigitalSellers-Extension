/**
 * Tipos de mensajes entre contexts (content script ↔ background ↔ popup).
 *
 * Usamos un discriminated union para que TypeScript haga narrowing
 * automático en los handlers. Cada mensaje es un objeto serializable
 * (chrome.runtime serializa con structured clone).
 */

import type { BaseScrapedPayload } from "./types";

// =============================================================================
// Mensajes Content → Background
// =============================================================================

/** El user clickeó una tool del menú. Background debe abrir la tab correcta. */
export interface OpenToolMessage {
  type: "OPEN_TOOL";
  toolId: string;
  payload: BaseScrapedPayload & Record<string, unknown>;
}

/** Content script quiere chequear la versión mínima soportada. */
export interface HealthCheckMessage {
  type: "HEALTH_CHECK";
}

// =============================================================================
// Mensajes Background → Content (respuestas)
// =============================================================================

export interface OpenToolResponse {
  type: "OPEN_TOOL_RESULT";
  ok: boolean;
  tabId?: number;
  sessionId?: string;
  error?: string;
}

export interface HealthCheckResponse {
  type: "HEALTH_CHECK_RESULT";
  ok: boolean;
  versionOk: boolean;
  currentVersion: string;
  minVersion?: string;
  notice?: string;
}

// =============================================================================
// Mensajes Analyzer (via content script bridge) → Background
// =============================================================================

/**
 * La tab del Analyzer pide la referencia oficial que le corresponde por sessionId.
 * Este mensaje lo origina el content script inyectado en `analyzer.digitalsellers.com.ar`.
 */
export interface FetchSessionMessage {
  type: "FETCH_SESSION";
  sessionId: string;
}

export interface FetchSessionResponse {
  type: "FETCH_SESSION_RESULT";
  ok: boolean;
  payload?: BaseScrapedPayload & Record<string, unknown>;
  error?: string;
}

// =============================================================================
// Union types
// =============================================================================

export type ExtensionMessage =
  | OpenToolMessage
  | HealthCheckMessage
  | FetchSessionMessage;

export type ExtensionResponse =
  | OpenToolResponse
  | HealthCheckResponse
  | FetchSessionResponse;

/**
 * Type-safe sender. Usar siempre esto en vez de chrome.runtime.sendMessage directo.
 */
export async function sendMessage<T extends ExtensionMessage>(
  msg: T,
): Promise<ExtensionResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response: ExtensionResponse) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}
