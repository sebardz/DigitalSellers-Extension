# Changelog

Todos los cambios notables se documentan acá.
Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), versionado semver.

## [0.1.0] — 2026-04-20

### Added

- Scaffolding inicial (TypeScript + Vite + Manifest V3)
- Tool Registry pattern para escalar a múltiples herramientas DS
- Scraper del Analyzer (título, MLA id, imágenes full-res, atributos, descripción, categoría, seller)
- Botón flotante inyectado en PDPs de MeLi (AR/BR/MX/CL/CO/PE) con menú desplegable
- Content-script bridge para comunicación entre frontend Analyzer/Simulador y el background worker
- Background service worker con router de mensajes (OPEN_TOOL, FETCH_SESSION, HEALTH_CHECK)
- Popup con healthcheck visual
- Options page con preferencias (enabled, telemetría, tool default, tema)
- Shadow DOM isolation del CSS inyectado
- Dark mode automático (respeta `prefers-color-scheme`)
- Endpoints del Analyzer: `/api/extension/health` + `/api/extension/pack-visual`
- Auto-start flow en el Analyzer cuando viene `?source=extension&sessionId=X`
- Zod schemas client + server sincronizados
- Version gating (`MIN_EXTENSION_VERSION` en server, 426 si está desactualizada)
- Tests unitarios del scraper contra fixtures HTML reales

### Roadmap próximo (v0.2)

- Scraper del Simulador (precio, categoría, envío, oferta)
- Auto-start en `simulador.digitalsellers.com.ar`
- SPA navigation: re-mount del botón cuando MeLi cambia de PDP sin recarga
- Toast inline con progreso de generación (SSE relay hacia la page de MeLi)
