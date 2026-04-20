/**
 * Menú desplegable con la lista de tools DS disponibles.
 *
 * Comparte el Shadow DOM del botón (se monta como sibling) para usar los
 * mismos estilos aislados.
 */

import type { ToolDefinition } from "@shared/tools";

export interface MenuOptions {
  tools: ToolDefinition[];
  onPickTool: (toolId: string) => void;
  onOpenOptions: () => void;
  extensionVersion: string;
}

export function mountMenu(
  shadowRoot: ShadowRoot,
  opts: MenuOptions,
): { setOpen: (v: boolean) => void } {
  const menu = document.createElement("div");
  menu.className = "dsh-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Herramientas DigitalSellers");

  // Header
  const header = document.createElement("div");
  header.className = "dsh-menu__header";
  header.innerHTML = `
    <p class="dsh-menu__title">DigitalSellers Hub</p>
    <p class="dsh-menu__subtitle">¿Qué querés hacer con esta publicación?</p>
  `;
  menu.appendChild(header);

  // Lista de tools
  const list = document.createElement("ul");
  list.className = "dsh-menu__list";

  if (opts.tools.length === 0) {
    const empty = document.createElement("li");
    empty.className = "dsh-menu__item";
    empty.style.cssText = "opacity:0.7; cursor:default;";
    empty.textContent = "No hay herramientas disponibles en esta página.";
    list.appendChild(empty);
  } else {
    for (const tool of opts.tools) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dsh-menu__item";
      btn.dataset.toolId = tool.id;
      btn.innerHTML = `
        <span class="dsh-menu__icon" aria-hidden="true">${tool.icon}</span>
        <span>
          <span class="dsh-menu__label">
            ${escapeHtml(tool.label)}${tool.beta ? '<span class="dsh-menu__badge">Beta</span>' : ""}
          </span>
          <span class="dsh-menu__description">${escapeHtml(tool.description)}</span>
        </span>
      `;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        opts.onPickTool(tool.id);
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  menu.appendChild(list);

  // Footer
  const footer = document.createElement("div");
  footer.className = "dsh-menu__footer";
  footer.innerHTML = `
    <span>v${opts.extensionVersion}</span>
    <a class="dsh-menu__footer-link" href="#" role="menuitem">⚙️ Configurar</a>
  `;
  footer.querySelector("a")?.addEventListener("click", (e) => {
    e.preventDefault();
    opts.onOpenOptions();
  });
  menu.appendChild(footer);

  shadowRoot.appendChild(menu);

  return {
    setOpen(v: boolean) {
      menu.setAttribute("data-open", v ? "true" : "false");
    },
  };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
