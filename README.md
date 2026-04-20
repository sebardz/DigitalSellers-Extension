# DigitalSellers Hub — Chrome Extension

> Botón flotante inyectado en MercadoLibre que genera packs visuales, videos y más herramientas DS **con un solo click**. Sin copy-paste. Sin depender de la API pública de MeLi.

## ✨ Qué hace

Cuando estás en una publicación de MeLi, te aparece un botón flotante. Lo apretás, se abre un menú con las tools del ecosistema DigitalSellers, elegís una y listo — se abre la Analyzer (o Simulador) con los datos del producto ya cargados y la generación arrancando.

## 🚀 Instalación (desarrollo)

```bash
# 1. Clonar el repo
git clone <url-del-repo>
cd DigitalSellers-Extension

# 2. Instalar dependencias
npm install

# 3. Generar los íconos
npm run generate:icons

# 4. Build (o dev con HMR)
npm run build       # producción
npm run dev         # desarrollo con watch

# 5. Cargar en Chrome
#    a. Abrí chrome://extensions/
#    b. Activá "Modo desarrollador" (toggle arriba a la derecha)
#    c. Click "Cargar extensión desempaquetada"
#    d. Seleccioná la carpeta dist/
```

## 🧪 Tests

```bash
npm run test          # interactive
npm run test:run      # one-shot (CI)
npm run typecheck     # TypeScript
npm run lint          # ESLint
```

## 📦 Empaquetado para Chrome Web Store

```bash
npm run pack
# Genera releases/digitalsellers-hub-v<version>.zip listo para subir
```

## 🔧 Configuración

- **`src/shared/config.ts`** — URLs base del ecosistema DS. Cambiar acá para apuntar a staging o local.
- **`src/shared/tools.ts`** — Tool Registry. Agregar una tool nueva = sumar una entry + crear su scraper en `src/content/scrapers/<id>.ts`.
- **`src/manifest.json`** — Permisos y hosts. Sincronizar con `config.ts`.

## 🏗️ Arquitectura

Ver [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) para el diseño completo.

## 📄 Privacidad

Ver [`PRIVACY.md`](./PRIVACY.md). TL;DR: no recolectamos nada personal, solo mandamos a DS los datos de la publicación cuando hacés click explícito en una herramienta.

## 📝 Changelog

Ver [`CHANGELOG.md`](./CHANGELOG.md).

## 📜 Licencia

Propietaria — DigitalSellers. Uso interno.
