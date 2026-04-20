# DigitalSellers Hub — Chrome Extension

> Botón flotante inyectado en MercadoLibre que genera packs visuales, videos y más herramientas DS **con un solo click**. Sin copy-paste. Sin depender de la API pública de MeLi.

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
npm run test:run      # one-shot (CI)
npm run typecheck     # TypeScript
npm run lint          # ESLint
```

## 📦 Empaquetado manual (sin CI)

```bash
npm run pack
# Genera releases/digitalsellers-hub-v<version>.zip
```

## 🤖 Release automático via GitHub Actions

Al pushear un tag `v*` (ej. `v0.5.0`), el workflow:
1. Instala deps
2. Genera icons
3. Corre tests + typecheck
4. Buildea la extensión
5. Zipea el `dist/`
6. Crea una **GitHub Release** con el zip adjunto y las notas del CHANGELOG

**Comando para liberar una versión nueva:**

```bash
# 1. Bump version en package.json + src/manifest.json
# 2. Agregar entrada al CHANGELOG.md
# 3. Commit + tag + push
git add .
git commit -m "chore: bump v0.5.0"
git tag v0.5.0
git push origin main --tags
# El workflow se dispara y crea la release en ~2min
```

Los clientes la reciben desde **[github.com/sebardz/DigitalSellers-Extension/releases/latest](../../releases/latest)** — siempre la última.

---

## 🏗️ Arquitectura

Ver [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) para el diseño completo.

## 📄 Privacidad

Ver [`PRIVACY.md`](./PRIVACY.md). TL;DR: no recolectamos nada personal, solo mandamos al backend de DigitalSellers los datos de la publicación cuando hacés click explícito en una herramienta.

## 📝 Changelog

Ver [`CHANGELOG.md`](./CHANGELOG.md).

## 📜 Licencia

Propietaria — DigitalSellers. Uso interno y bajo acuerdo.
