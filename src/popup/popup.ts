/**
 * Popup al clickear el ícono de la extensión.
 *
 * Muestra estado (health check), shortcuts rápidos a Analyzer/Simulador
 * y un link a Options.
 */

import { sendMessage } from "@shared/messaging";

const version = chrome.runtime.getManifest().version;

// Version label
const versionEl = document.getElementById("version");
if (versionEl) versionEl.textContent = `v${version}`;

// Options link
document.getElementById("open-options")?.addEventListener("click", (e) => {
  e.preventDefault();
  void chrome.runtime.openOptionsPage();
});

// Health check
void (async () => {
  const section = document.getElementById("status-section");
  const statusText = document.getElementById("status-text");
  if (!section || !statusText) return;

  try {
    const res = await sendMessage({ type: "HEALTH_CHECK" });
    if (res.type !== "HEALTH_CHECK_RESULT") return;

    if (!res.ok) {
      section.classList.add("warn");
      statusText.textContent = "No hay conexión con el servidor. Revisá tu internet.";
      return;
    }
    if (!res.versionOk && res.minVersion) {
      section.classList.add("warn");
      statusText.textContent = `Hay una nueva versión disponible. Se actualizará automáticamente pronto (mínima: ${res.minVersion}).`;
      return;
    }
    section.classList.add("ok");
    statusText.textContent = res.notice ?? "✓ Todo funcionando. Abrí una publicación de MercadoLibre para usar las herramientas.";
  } catch {
    section.classList.add("warn");
    statusText.textContent = "No pudimos chequear el estado.";
  }
})();
