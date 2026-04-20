/**
 * Botón flotante (FAB).
 *
 * Se monta dentro de un Shadow DOM para aislar nuestros estilos del CSS
 * de MeLi. Emite un evento custom `dsh-click` que el content-script escucha.
 */

import css from "./content-style.css?raw";

export interface FabOptions {
  /** Posición desde bottom/right en px. */
  bottom: number;
  right: number;
  /** Handler del click. Recibe el evento por si el caller quiere stopPropagation. */
  onClick: (ev?: MouseEvent) => void;
}

export function mountFab(opts: FabOptions): { host: HTMLElement; setOpen: (v: boolean) => void } {
  // Host element en el <body> del documento
  const host = document.createElement("div");
  host.id = "dsh-root";
  host.style.all = "initial"; // reset completo contra estilos de MeLi
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  document.body.appendChild(host);

  // Shadow DOM
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style);

  const btn = document.createElement("button");
  btn.className = "dsh-fab";
  btn.type = "button";
  btn.setAttribute("aria-label", "Abrir herramientas DigitalSellers");
  btn.title = "DigitalSellers Hub";
  btn.style.bottom = `${opts.bottom}px`;
  btn.style.right = `${opts.right}px`;
  // Icono: usamos un emoji por simplicidad en v0.1. En v0.2 lo reemplazamos
  // por un SVG con el logo DS.
  btn.textContent = "DS";
  btn.style.fontWeight = "800";
  btn.style.fontSize = "18px";
  btn.style.letterSpacing = "0.5px";

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    opts.onClick(e);
  });

  shadow.appendChild(btn);

  return {
    host,
    setOpen(v: boolean) {
      btn.setAttribute("data-open", v ? "true" : "false");
    },
  };
}
