/**
 * Wrapper tipado sobre chrome.storage con TTL automático.
 *
 * - `session.*` → datos efímeros por pack (chrome.storage.local con TTL)
 * - `prefs`     → preferencias del user (chrome.storage.sync)
 */

import { STORAGE_SESSION_PREFIX, SESSION_TTL_MS } from "./config";
import type { BaseScrapedPayload } from "./types";
import { DEFAULT_PREFERENCES, type UserPreferences } from "./types";

type SessionPayload = BaseScrapedPayload & Record<string, unknown>;

interface SessionEntry {
  payload: SessionPayload;
  expiresAt: number;
}

// =============================================================================
// Session (short-lived scraped payloads)
// =============================================================================

export async function saveSession(
  sessionId: string,
  payload: SessionPayload,
): Promise<void> {
  const entry: SessionEntry = {
    payload,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  await chrome.storage.local.set({ [`${STORAGE_SESSION_PREFIX}${sessionId}`]: entry });
}

export async function fetchSession(
  sessionId: string,
): Promise<SessionPayload | null> {
  const key = `${STORAGE_SESSION_PREFIX}${sessionId}`;
  const result = await chrome.storage.local.get(key);
  const entry: SessionEntry | undefined = result[key];
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    await chrome.storage.local.remove(key);
    return null;
  }
  return entry.payload;
}

export async function consumeSession(
  sessionId: string,
): Promise<SessionPayload | null> {
  const payload = await fetchSession(sessionId);
  if (payload) {
    await chrome.storage.local.remove(`${STORAGE_SESSION_PREFIX}${sessionId}`);
  }
  return payload;
}

/** Purga sessions expiradas. Se llama en cada onStartup del worker. */
export async function purgeExpiredSessions(): Promise<number> {
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const toRemove: string[] = [];
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(STORAGE_SESSION_PREFIX)) continue;
    const entry = value as SessionEntry;
    if (entry?.expiresAt && entry.expiresAt < now) {
      toRemove.push(key);
    }
  }
  if (toRemove.length) {
    await chrome.storage.local.remove(toRemove);
  }
  return toRemove.length;
}

// =============================================================================
// User preferences (cross-device sync)
// =============================================================================

const PREFS_KEY = "dsh:preferences:v1";

export async function getPreferences(): Promise<UserPreferences> {
  const result = await chrome.storage.sync.get(PREFS_KEY);
  const stored = result[PREFS_KEY] as Partial<UserPreferences> | undefined;
  return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) };
}

export async function updatePreferences(
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const current = await getPreferences();
  const next = { ...current, ...patch };
  await chrome.storage.sync.set({ [PREFS_KEY]: next });
  return next;
}
