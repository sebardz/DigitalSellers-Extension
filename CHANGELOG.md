# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), versionado semver.

## [0.3.0] — 2026-04-20

### Changed

- **Target redirect actualizado al módulo Launcher del Analyzer** — el
  flujo de pack visual ahora abre `/?module=launcher` (nuevo módulo
  rediseñado desde cero) en vez de la raíz `/`. Launcher tiene un
  wizard limpio de 4 pasos (Recibir → Revisar → Generar → Descargar)
  diseñado específicamente para consumir el payload del DOM scraper,
  sin legacy de autofill.

## [0.2.0] — 2026-04-20

### Added

- **Scraper exhaustivo** — ahora captura todos los campos relevantes del PDP:
  - Precio actual + precio original + % de descuento
  - Cuotas (cantidad, monto, "sin interés")
  - Envío: gratis / Full / retiro en local / mismo día
  - Condición: nuevo / usado / reacondicionado
  - Stock disponible + cantidad vendida
  - Reviews: rating average + cantidad
  - Variantes (color, talle, capacidad) con opciones + seleccionada
  - Seller extendido: Tienda Oficial, MercadoLíder, ventas, % positivo
  - Garantía (texto)
  - Métodos de pago detectados
- **Completeness tracker**: cada scrape reporta `N/M campos extraídos` + qué estrategia resolvió cada campo (`meta` / `json-ld` / `dom` / `path` / `query` / `combined`)
- **Modo debug** en la Options page: loguea a consola la tabla de estrategias por campo
- **SPA navigation robusta**: patch de `history.pushState` + `replaceState` para re-mount del botón cuando MeLi navega entre PDPs sin recarga
- **UX polish**:
  - Tecla `Esc` cierra el menú
  - Click fuera del área del botón cierra el menú
  - El menú se cierra automáticamente al picar una tool (feedback visual claro)
  - Toasts con duración diferenciada según tipo
- **Options page**: sección "Zona peligrosa" con clear-sessions y reset-preferences
- **3 fixtures HTML nuevos** + tests asserting cada tipo de PDP
  - Catálogo con item filter (fixture original)
  - Tienda Oficial con variantes, oferta, MercadoLíder (nuevo)
  - Producto usado sin catálogo (nuevo)

### Changed

- Schema Zod (client + server): nuevos campos opcionales para pricing, shipping, condition, availability, reviews, variants, sellerExtended, warranty, paymentMethods
- `scrapeForAnalyzer` devuelve payload + `_debug` info (se strippea antes de enviar al Analyzer)
- Imagen cap subido a 60 (de 20) — algunas PDPs tienen galerías grandes
- Title máximo subido a 500 chars

### Fixed

- Bridge postMessage ahora reintenta cada 400ms por 6s para evitar race condition con el mount del React del Analyzer
- Content-script anuncia `DSH_EXTENSION_READY` 4 veces (0ms, 100ms, 500ms, 1500ms) para cubrir timing variable

## [0.1.0] — 2026-04-20

- Versión inicial: scaffolding, scraper básico, botón flotante, bridge, endpoints del Analyzer.
