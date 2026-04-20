# Handoff — DigitalSellers Hub v0.1.0

> Estado: **MVP listo para probar**. Build limpio, tests en verde, endpoints del Analyzer desplegados en producción.

---

## 🚀 Cómo probar la extensión HOY

### 1. Cargar en Chrome

```
1. Abrí chrome://extensions/
2. Activá "Modo desarrollador" (toggle arriba a la derecha)
3. Click "Cargar extensión desempaquetada"
4. Seleccioná la carpeta:
   G:\CC\DigitalSellers\DS-APP\DigitalSellers-Extension\dist
```

Deberías ver el ícono DS (gradiente azul-violeta) en la barra de extensiones.

### 2. Probá en MercadoLibre

1. Abrí cualquier publicación de MeLi, ejemplo:
   ```
   https://www.mercadolibre.com.ar/varillas-difusoras-de-rattan-premium-20cm-x-50-unidades/p/MLA2071611851?pdp_filters=item_id:MLA1749487493
   ```
2. Abajo a la derecha aparece un botón circular **"DS"** con gradiente
3. Click → se abre el menú con las tools disponibles
4. Click **"🎨 Generar Pack Visual"**
5. Se abre automáticamente `analyzer.digitalsellers.com.ar` con los datos pre-cargados y el pack generándose

### 3. Ver el popup

Click en el ícono DS de la barra de extensiones → popup con:
- Status de conexión al Analyzer
- Atajos a Analyzer y Simulador
- Link a configuración

### 4. Configurar

Popup → ⚙️ Configurar → opciones:
- Habilitar/deshabilitar extensión
- Tool default (click directo sin menú)
- Tema (claro/oscuro/auto)
- Telemetría anónima on/off

---

## 🧪 Comandos de desarrollo

```bash
cd DS-APP/DigitalSellers-Extension

npm run dev           # watch + HMR
npm run build         # build producción en dist/
npm run test:run      # tests del scraper
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm run pack          # genera releases/digitalsellers-hub-v0.1.0.zip
```

---

## 📋 Endpoints del Analyzer (vivos en producción)

| Endpoint | URL | Status |
|---|---|---|
| Health | `https://analyzer.digitalsellers.com.ar/api/extension/health` | ✅ 200 |
| Pack Visual | `https://analyzer.digitalsellers.com.ar/api/extension/pack-visual` | ✅ 200 (OPTIONS) |

---

## 🔄 Flujo end-to-end

```
[MeLi PDP]
    │
    │ Click botón DS → menú → "Pack Visual"
    ▼
[Content Script scraper.ts]
    │ Lee DOM: título, MLA, fotos full-res, attrs, desc, categoría
    ▼
[Background worker]
    │ Genera sessionId, guarda en chrome.storage.local
    │ Abre tab: analyzer.digitalsellers.com.ar/?source=extension&sessionId=X
    ▼
[Analyzer pack-visual-auto.tsx useEffect]
    │ Detecta ?source=extension
    │ Llama window.postMessage → content-bridge → background
    │ Recibe el payload scrapeado
    ▼
[POST /api/extension/pack-visual]
    │ Valida con Zod
    │ Valida versión mínima
    │ Descarga foto principal → base64
    │ Mapea a ProductData
    ▼
[Analyzer orchestrate con data precargada]
    │ Skip autofill (ya tenemos todo)
    │ Arranca generación en paralelo x4
    ▼
[15 imágenes generadas en ~1 min]
```

---

## 🎯 Lo que bypassamos con la extensión

- ❌ ~~Copy-paste de URL~~
- ❌ ~~Llamada a `/items/{id}` de MeLi~~ (que devuelve 403 para items de terceros)
- ❌ ~~OAuth flow redundante para solo leer data pública~~
- ❌ ~~Resolución de URLs slug-only~~ (la extensión lee el DOM directo)

---

## 🔮 Próximos pasos

### v0.2 — Simulador
- [ ] Agregar scraper `simulator.ts` (precio, categoría, envío, oferta)
- [ ] Habilitar tool `simulator-calc` en `TOOLS` registry
- [ ] Auto-start en `simulador.digitalsellers.com.ar`

### v0.3 — UX polish
- [ ] Toast inline con progreso SSE (feedback sin salir de MeLi)
- [ ] SPA navigation mejor: re-mount al cambiar de PDP sin recarga

### v1.0 — Chrome Web Store
- [ ] Registrar cuenta developer (USD 5 one-time)
- [ ] Screenshots + demo video 1080p
- [ ] Privacy policy en `analyzer.digitalsellers.com.ar/privacy`
- [ ] `npm run pack` → subir zip al Chrome Web Store
- [ ] Review 1-3 días

---

## 📁 Estructura final

```
DS-APP/DigitalSellers-Extension/
├── src/
│   ├── manifest.json               Manifest V3
│   ├── shims.d.ts                  Tipos para imports ?raw
│   ├── background/
│   │   └── background.ts           Service worker
│   ├── content/
│   │   ├── content-script.ts       Entry (MeLi + Analyzer bridge)
│   │   ├── button.ts               FAB en Shadow DOM
│   │   ├── menu.ts                 Menú de tools
│   │   ├── toast.ts                Toast inline
│   │   ├── content-style.css       Estilos aislados
│   │   └── scrapers/
│   │       ├── _core.ts            Helpers (meta, JSON-LD, images)
│   │       ├── analyzer.ts         Scraper Pack Visual
│   │       └── index.ts            Registry
│   ├── popup/                      Popup del ícono
│   ├── options/                    Options page
│   ├── shared/
│   │   ├── config.ts               URLs base
│   │   ├── tools.ts                Tool Registry
│   │   ├── schemas.ts              Zod (client)
│   │   ├── messaging.ts            Tipos de mensajes
│   │   ├── storage.ts              chrome.storage wrapper
│   │   └── types.ts
│   └── assets/icons/               16/32/48/128 PNG
├── tests/
│   ├── fixtures/pdp-common.html
│   └── scrapers/analyzer.test.ts
├── scripts/
│   ├── generate-icons.mjs
│   └── pack.mjs
├── dist/                           Build output (git-ignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── PROJECT_CONTEXT.md              Arquitectura completa
├── PRIVACY.md
├── CHANGELOG.md
├── README.md
└── HANDOFF.md                      (este archivo)
```

Y en el Analyzer:
```
DS-APP/Analyzer/src/
├── app/api/extension/
│   ├── health/route.ts             GET → version check
│   └── pack-visual/route.ts        POST → recibe payload scrapeado
├── lib/extension/
│   ├── schema.ts                   Zod (server)
│   └── bridge.ts                   Helper postMessage con extensión
└── components/modules/
    └── pack-visual-auto.tsx        + useEffect auto-start extension
```
