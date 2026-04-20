/**
 * Options page — permite al user ajustar preferencias + acciones de mantenimiento.
 */

import {
  getPreferences,
  purgeExpiredSessions,
  updatePreferences,
} from "@shared/storage";
import { listEnabledTools } from "@shared/tools";
import { DEFAULT_PREFERENCES } from "@shared/types";

const version = chrome.runtime.getManifest().version;
const versionEl = document.getElementById("version");
if (versionEl) versionEl.textContent = version;

const enabledEl = document.getElementById("pref-enabled") as HTMLInputElement;
const telemetryEl = document.getElementById("pref-telemetry") as HTMLInputElement;
const debugEl = document.getElementById("pref-debug") as HTMLInputElement;
const defaultToolEl = document.getElementById("pref-default-tool") as HTMLSelectElement;
const themeEl = document.getElementById("pref-theme") as HTMLSelectElement;
const saveBtn = document.getElementById("save") as HTMLButtonElement;
const savedIndicator = document.getElementById("saved-indicator") as HTMLElement;
const clearSessionsBtn = document.getElementById("btn-clear-sessions") as HTMLButtonElement;
const resetPrefsBtn = document.getElementById("btn-reset-prefs") as HTMLButtonElement;

// Populate default tool options
{
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "Ninguna (siempre mostrar menú)";
  defaultToolEl.appendChild(noneOpt);
  for (const tool of listEnabledTools()) {
    const opt = document.createElement("option");
    opt.value = tool.id;
    opt.textContent = `${tool.icon} ${tool.label}`;
    defaultToolEl.appendChild(opt);
  }
}

// Hydrate current prefs
void (async () => {
  const prefs = await getPreferences();
  enabledEl.checked = prefs.enabled;
  telemetryEl.checked = prefs.telemetry;
  debugEl.checked = prefs.debug;
  defaultToolEl.value = prefs.defaultToolId ?? "";
  themeEl.value = prefs.theme ?? "auto";
})();

function flash(message: string, ok = true) {
  savedIndicator.textContent = ok ? `✓ ${message}` : `⚠ ${message}`;
  savedIndicator.style.color = ok ? "#2a9d5a" : "#c73e3e";
  setTimeout(() => {
    savedIndicator.textContent = "";
    savedIndicator.style.color = "";
  }, 2500);
}

saveBtn.addEventListener("click", () => {
  void (async () => {
    await updatePreferences({
      enabled: enabledEl.checked,
      telemetry: telemetryEl.checked,
      debug: debugEl.checked,
      defaultToolId: defaultToolEl.value || null,
      theme: themeEl.value === "auto" ? null : (themeEl.value as "light" | "dark"),
    });
    flash("Guardado");
  })();
});

clearSessionsBtn.addEventListener("click", () => {
  void (async () => {
    const n = await purgeExpiredSessions();
    // También purgamos TODAS las sessions (expiradas o no) como reset manual
    const all = await chrome.storage.local.get(null);
    const toRemove = Object.keys(all).filter((k) => k.startsWith("dsh:session:"));
    if (toRemove.length) await chrome.storage.local.remove(toRemove);
    flash(`Sesiones limpiadas (${n + toRemove.length})`);
  })();
});

resetPrefsBtn.addEventListener("click", () => {
  void (async () => {
    await updatePreferences(DEFAULT_PREFERENCES);
    // Re-hidratar UI
    enabledEl.checked = DEFAULT_PREFERENCES.enabled;
    telemetryEl.checked = DEFAULT_PREFERENCES.telemetry;
    debugEl.checked = DEFAULT_PREFERENCES.debug;
    defaultToolEl.value = DEFAULT_PREFERENCES.defaultToolId ?? "";
    themeEl.value = DEFAULT_PREFERENCES.theme ?? "auto";
    flash("Preferencias restablecidas");
  })();
});
