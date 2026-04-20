/// <reference types="chrome" />

/**
 * Tipos para imports con query params de Vite (ej. `?raw` para leer archivo
 * como string literal en vez de importar como módulo).
 */
declare module "*.css?raw" {
  const content: string;
  export default content;
}

declare module "*.svg?raw" {
  const content: string;
  export default content;
}
