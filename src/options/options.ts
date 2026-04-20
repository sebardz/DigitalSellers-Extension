/**
 * Options page — permite al user ajustar preferencias.
 *
 * Carga preferencias actuales de chrome.storage.sync, las hidrata al DOM
 * y guarda al presionar "Guardar".
 */

import { getPreferences, updatePreferences } from "@shared/storage";
import { listEnabledTools } from "@shared/tools";

const version = chrome.runtime.getManifest().version;
const versionEl = document.getElementById("version");
if (versionEl) versionEl.textContent = version;

const enabledEl = document.getElementById("pref-enabled") as HTMLInputElement;
const telemetryEl = document.getElementById("pref-telemetry") as HTMLInputElement;
const defaultToolEl = document.getElementById("pref-default-tool") as HTMLSelectElement;
const themeEl = document.getElementById("pref-theme") as HTMLSelectElement;
const saveBtn = document.getElementById("save") as HTMLButtonElement;
const savedIndicator = document.getElementById("saved-indicator") as HTMLElement;

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
  defaultToolEl.value = prefs.defaultToolId ?? "";
  themeEl.value = prefs.theme ?? "auto";
})();

saveBtn.addEventListener("click", () => {
  void (async () => {
    await updatePreferences({
      enabled: enabledEl.checked,
      telemetry: telemetryEl.checked,
      defaultToolId: defaultToolEl.value || null,
      theme: themeEl.value === "auto" ? null : (themeEl.value as "light" | "dark"),
    });
    savedIndicator.textContent = "✓ Guardado";
    setTimeout(() => (savedIndicator.textContent = ""), 2000);
  })();
});
