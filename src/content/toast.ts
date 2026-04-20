/**
 * Toast inline de feedback (para mostrar errores, éxitos) sin sacar al
 * user de la página de MeLi.
 */

export type ToastKind = "info" | "success" | "error";

export interface ToastOptions {
  kind: ToastKind;
  message: string;
  /** Tiempo hasta auto-dismiss en ms. null = no auto-cierra. */
  durationMs?: number | null;
  /** "top" = el botón está arriba → toast se renderiza debajo del botón. */
  anchor?: "top" | "bottom";
}

export function showToast(
  shadowRoot: ShadowRoot,
  opts: ToastOptions,
): { dismiss: () => void } {
  // Quitar toast previo si hay
  shadowRoot.querySelector(".dsh-toast")?.remove();

  const div = document.createElement("div");
  div.className = `dsh-toast dsh-toast--${opts.kind}`;
  div.setAttribute("role", opts.kind === "error" ? "alert" : "status");
  div.setAttribute("data-anchor", opts.anchor ?? "bottom");
  div.textContent = opts.message;
  shadowRoot.appendChild(div);

  // Trigger transition
  requestAnimationFrame(() => {
    div.setAttribute("data-open", "true");
  });

  const duration = opts.durationMs ?? 4000;
  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    div.setAttribute("data-open", "false");
    setTimeout(() => div.remove(), 250);
  };

  if (duration !== null && duration > 0) {
    setTimeout(dismiss, duration);
  }

  return { dismiss };
}
