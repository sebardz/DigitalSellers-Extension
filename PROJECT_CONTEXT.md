# DigitalSellers Hub — Chrome Extension

> Extensión paraguas del ecosistema **DigitalSellers**. Inyecta un botón flotante en páginas de MercadoLibre con un menú que dispara cada una de las herramientas DS (Analyzer, Simulador, futuras). Scrape el DOM del PDP y le pasa la data pre-cargada a la tool correspondiente, sin depender de la API pública de MeLi (que desde abr 2026 bloquea items de terceros con 403).

---

## 🎯 Objetivo

Reducir a **un click** el flujo que hoy es "copiar URL → pegar en la app → esperar autofill → generar". Además, bypassar las limitaciones de la API pública de MeLi extrayendo data directamente del HTML renderizado que el user ya tiene abierto en su browser.

## 🧭 Alcance

- **v0.1 (MVP)** — Botón flotante con **1 acción: Analyzer Pack Visual**. Scrape básico (MLA id + título), el resto lo completa el Analyzer con su OAuth.
- **v0.2** — Suma **Simulador** (calculadora de ganancia/comisión). Scraper enriquecido con precio, categoría, envío gratis, oferta.
- **v0.3+** — Launch Pad (publicación completa), Optimizer, y tools futuras.
- **Multi-país** — Arquitectura multi-sitio desde día 1: AR/BR/MX/CL/CO/PE. Testing primero en AR.

## 🏗️ Arquitectura

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                 PÁGINA DE MERCADOLIBRE (PDP)                      │
 │                                                                   │
 │   ┌─────────────────────────────────────────────────┐             │
 │   │  [CONTENT SCRIPT]                               │             │
 │   │                                                 │             │
 │   │   1. Detecta si estamos en una PDP              │             │
 │   │   2. Inyecta el botón flotante                  │             │
 │   │   3. Al click → muestra menú de tools           │             │
 │   │   4. Al elegir tool → corre su scraper          │             │
 │   │   5. sendMessage({ type:"OPEN_TOOL", ... })     │             │
 │   └────────────────────┬────────────────────────────┘             │
 └────────────────────────┼──────────────────────────────────────────┘
                          │ chrome.runtime
                          ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                      [BACKGROUND WORKER]                          │
 │                                                                   │
 │   1. Recibe payload scrapeado                                     │
 │   2. Genera sessionId (UUID)                                      │
 │   3. Guarda payload en chrome.storage.local[sessionId]            │
 │   4. chrome.tabs.create({ url: toolUrl + "?source=extension&      │
 │      sessionId=X&version=Y" })                                    │
 └────────────────────────┬──────────────────────────────────────────┘
                          │ abre tab
                          ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │            ANALYZER / SIMULADOR / LAUNCH PAD                      │
 │                                                                   │
 │   1. Detecta ?source=extension&sessionId=X                        │
 │   2. Pide data a la extensión vía window.postMessage              │
 │      → content-bridge relay → chrome.storage.local[sessionId]     │
 │   3. Valida con zod que cumple el schema                          │
 │   4. POST /api/extension/pack-visual con la data                  │
 │   5. Arranca generación — UI muestra progreso                     │
 │   6. Borra chrome.storage.local[sessionId] al terminar            │
 └──────────────────────────────────────────────────────────────────┘
```

## 🧩 Tool Registry Pattern

Cada tool DS se declara en `src/shared/tools.ts` con metadata estándar:

```ts
type Tool = {
  id: string;               // "analyzer-pack-visual"
  label: string;            // "Generar Pack Visual"
  icon: string;             // emoji o path a asset
  description: string;      // blurb que aparece en el menú
  targetOrigin: string;     // "https://analyzer.digitalsellers.com.ar"
  targetPath: string;       // "/?module=pack-visual&source=extension"
  scraperId: string;        // clave en el registry de scrapers
  minExtensionVersion?: string; // requiere extensión >= esta
  beta?: boolean;           // aparece con badge "Beta"
  enabled: boolean;         // feature flag
};
```

Sumar una tool nueva = agregar una entry acá + escribir su scraper en `src/content/scrapers/<id>.ts`. No hay que tocar UI ni router.

## 📦 Stack técnico

- **TypeScript 5.x** — tipado estricto, sin `any`
- **Vite + `@crxjs/vite-plugin`** — HMR real para content scripts
- **Manifest v3** — service worker, activeTab
- **Zod** — validación de payloads pre-scrapeados en server
- **Vitest** — tests del scraper con fixtures HTML reales
- **ESLint + Prettier** — code style uniforme

## 🔐 Permisos solicitados

```json
{
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": [
    "*://*.mercadolibre.com.ar/*",
    "*://*.mercadolivre.com.br/*",
    "*://*.mercadolibre.com.mx/*",
    "*://*.mercadolibre.cl/*",
    "*://*.mercadolibre.com.co/*",
    "*://*.mercadolibre.com.pe/*",
    "https://analyzer.digitalsellers.com.ar/*",
    "https://simulador.digitalsellers.com.ar/*"
  ]
}
```

**No usamos**: `cookies`, `webRequest`, `history`, `bookmarks`, `downloads`. Esto hace que pase la review del Chrome Web Store sin problemas.

## 🔐 Seguridad

- **Cero credenciales en la extensión** — la auth la tiene la web del Analyzer (cookies normales).
- **Sin tracking de terceros** — no GTM, no GA, no Hotjar dentro de la extensión.
- **Payload firmado opcional** — el background worker puede HMAC-firmar el sessionId con una clave inyectada al instalar desde un oauth flow futuro. v0.1 confía en sessionStorage local.
- **CSP estricta** — sin `eval`, sin `innerHTML`, sin CDNs externos en runtime.

## 🎨 UX

### Botón flotante
- Posición por defecto: `bottom: 24px; right: 24px;`
- Color: gradiente DS brand
- Draggable: el user puede reposicionarlo (persistimos en storage)
- Dark mode: respeta `prefers-color-scheme`

### Menú al clickear
- Card flotante con lista de tools disponibles
- Cada tool muestra icon + label + description corta
- Badge "Beta" si corresponde
- Link "⚙️ Configurar" al pie

### Popup del browser
- Estado actual (logueado en Analyzer, versión, última tool usada)
- Shortcut a tools recientes
- Link a `options.html`

### Options page
- Tools habilitadas/deshabilitadas (con preview del registry)
- Tool default (click directo sin menú)
- Posición del botón flotante
- Dark mode override
- Sobre + versión + licencia

## 🔄 Contrato de datos (Extension ↔ Analyzer/Simulador)

El payload que la extensión empuja a cada tool debe cumplir un schema Zod central.

```ts
// Versión base del contrato — lo que TODA tool necesita saber
const BaseScrapedPayload = z.object({
  extensionVersion: z.string(),
  scrapedAt: z.string().datetime(),
  source: z.literal("chrome-extension"),
  url: z.string().url(),
  siteId: z.enum(["MLA", "MLB", "MLM", "MLC", "MCO", "MPE"]),
  itemId: z.string().regex(/^ML[A-Z]\d+$/).optional(),
  catalogProductId: z.string().regex(/^ML[A-Z]\d+$/).optional(),
});

// Cada tool extiende con sus campos propios
const AnalyzerScrapedPayload = BaseScrapedPayload.extend({
  toolId: z.literal("analyzer-pack-visual"),
  title: z.string(),
  description: z.string().nullable(),
  images: z.array(z.string().url()),
  attributes: z.record(z.string()),
});

const SimulatorScrapedPayload = BaseScrapedPayload.extend({
  toolId: z.literal("simulator-calc"),
  price: z.number().positive(),
  currency: z.string(),
  hasFreeShipping: z.boolean(),
  hasOffer: z.boolean().optional(),
  categoryPath: z.string().nullable(),
  weight: z.number().optional(),
});
```

## 📊 Telemetría

**Anónima y mínima**. Solo contamos:
- Tool-invocations-per-day (por tool)
- Versión de extensión en uso
- Sitios donde se usa (AR/BR/etc.)
- Errores del scraper (qué campo faltó, sin data sensible)

Enviados a `POST /api/extension/telemetry` con un `clientId` generado random al instalar (rotado cada 30 días).

## 🚀 Distribución

1. **Dev** → `npm run dev` → cargar `dist/` como unpacked en `chrome://extensions/`
2. **Beta interna** → `npm run pack` → zip + compartir por link
3. **Prod** → Chrome Web Store (cuenta dev USD 5 one-time, review 1-3 días)
4. Auto-update: Chrome refresca todos los users cuando publicamos nueva versión

## 🔮 Roadmap

| Versión | Scope |
|---|---|
| **0.1.0** | Pack Visual + scraper básico AR |
| **0.2.0** | Simulador + scraper completo |
| **0.3.0** | Launch Pad (publicación completa con 1 click) |
| **0.4.0** | BR/MX site support + i18n del menú |
| **0.5.0** | Side panel con preview in-situ |
| **1.0.0** | Publicación directa desde extension |

## 🧪 Testing

- **Unit** — scrapers con HTML fixtures reales (`tests/fixtures/`)
- **E2E manual** — checklist de 5 URLs distintas de MeLi por release (item propio, catálogo con/sin pdp_filters, slug-only, categoría mixta)
- **CI** — GitHub Actions corre lint + typecheck + vitest en cada PR

## 📁 Estructura de archivos

```
DigitalSellers-Extension/
├── src/
│   ├── manifest.json               # Generado en build
│   ├── background/
│   │   ├── background.ts           # Service worker entry
│   │   └── router.ts               # OPEN_TOOL → abrir tab correcta
│   ├── content/
│   │   ├── content-script.ts       # Entry, detecta PDP, inyecta botón
│   │   ├── button.ts               # Componente del botón flotante
│   │   ├── menu.ts                 # Menú desplegable de tools
│   │   ├── content-style.css       # Estilos Shadow-DOM scoped
│   │   └── scrapers/
│   │       ├── _core.ts            # Helpers compartidos (meta, JSON-LD, images)
│   │       ├── analyzer.ts         # Scraper para Analyzer
│   │       ├── simulator.ts        # Scraper para Simulador (v0.2)
│   │       └── index.ts            # Registry
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── options/
│   │   ├── options.html
│   │   ├── options.ts
│   │   └── options.css
│   ├── shared/
│   │   ├── config.ts               # URLs base, constants
│   │   ├── tools.ts                # Tool Registry
│   │   ├── messaging.ts            # Tipos de mensajes
│   │   ├── schemas.ts              # Zod schemas del payload
│   │   ├── storage.ts              # Wrapper chrome.storage
│   │   └── types.ts                # Interfaces globales
│   └── assets/
│       └── icons/
│           ├── icon-16.png
│           ├── icon-32.png
│           ├── icon-48.png
│           └── icon-128.png
├── tests/
│   ├── scrapers/
│   │   └── analyzer.test.ts
│   └── fixtures/
│       ├── pdp-common.html
│       ├── pdp-catalog.html
│       └── pdp-slug.html
├── scripts/
│   ├── build.mjs
│   └── generate-icons.mjs
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── README.md
├── CHANGELOG.md
├── PRIVACY.md                      # Obligatorio para Chrome Web Store
└── PROJECT_CONTEXT.md              # Este archivo
```

## 📞 Endpoints del Analyzer que la extensión consume

| Endpoint | Método | Uso |
|---|---|---|
| `/api/extension/health` | GET | Healthcheck + versión mínima requerida |
| `/api/extension/pack-visual` | POST | Arranca generación con payload scrapeado |
| `/api/extension/telemetry` | POST | Reporta evento anónimo |

Todos validan sesión del user (cookie del Analyzer).
