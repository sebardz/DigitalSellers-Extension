# DigitalSellers Hub — Chrome Extension

Extensión auxiliar del ecosistema DigitalSellers para ofrecer accesos desde publicaciones de Mercado Libre. El registro actual contiene el Simulador como integración futura y deshabilitada. No ofrece todavía generación de packs visuales o videos ni incorpora toda la plataforma PRO dentro del navegador.

El estado vigente está en `PROJECT_CONTEXT.md`. Los datos de Mercado Libre deben respetar la política de fuentes de la raíz del ecosistema.

[![Release](https://img.shields.io/github/v/release/sebardz/DigitalSellers-Extension?label=última%20versión&style=flat-square)](../../releases/latest)
[![Downloads](https://img.shields.io/github/downloads/sebardz/DigitalSellers-Extension/total?style=flat-square)](../../releases)

---

## 📥 Instalación rápida (para clientes)

1. Descargá el **ZIP** más reciente desde **[Releases](../../releases/latest)**
2. Descomprimí el zip en una carpeta **permanente** de tu PC (ej. `Documentos\DigitalSellers\`)
3. Abrí `chrome://extensions/` en Chrome
4. Activá **"Modo de desarrollador"** (toggle arriba a la derecha)
5. Click en **"Cargar extensión desempaquetada"** → seleccioná la carpeta descomprimida
6. Listo — andá a MercadoLibre y el botón flotante **DS** aparece arriba a la derecha

> 📖 Instrucciones completas paso a paso: [INSTRUCCIONES-CLIENTE.md](INSTRUCCIONES-CLIENTE.md)

---

## 🚀 Desarrollo

```bash
# Clonar el repo
git clone https://github.com/sebardz/DigitalSellers-Extension.git
cd DigitalSellers-Extension

# Instalar dependencias
npm install

# Generar los íconos
npm run generate:icons

# Build (o dev con HMR)
npm run build
npm run dev

# Cargar la extensión en Chrome:
#   chrome://extensions/ → Modo desarrollador ON → Cargar desempaquetada → carpeta dist/
```

## 🧪 Tests

```bash
npm run test          # interactive
npm run test:run      # one-shot local
npm run typecheck     # TypeScript
npm run lint          # ESLint
```

## 📦 Empaquetado y release local

```bash
npm run pack
# Genera releases/digitalsellers-hub-v<version>.zip
```

El gate recomendado valida que `package.json` y `src/manifest.json` coincidan, corre iconos, lint, tests, typecheck y el pack canónico:

```powershell
npm run generate:icons
npm run lint
npm run test:run
npm run typecheck
npm run pack
```

El comando sólo crea un ZIP local; no crea releases ni publica archivos. Revisar el artifact antes de cualquier distribución manual.

---

## 🏗️ Arquitectura

Ver [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) para el diseño completo.

## 📄 Privacidad

Ver [`PRIVACY.md`](./PRIVACY.md). TL;DR: no recolectamos nada personal, solo mandamos al backend de DigitalSellers los datos de la publicación cuando hacés click explícito en una herramienta.

## 📝 Changelog

Ver [`CHANGELOG.md`](./CHANGELOG.md).

## 📜 Licencia

Propietaria — DigitalSellers. Uso interno y bajo acuerdo.
