# Política de Privacidad — DigitalSellers Hub

_Última actualización: 20 de abril de 2026_

## Resumen

**DigitalSellers Hub no recolecta, almacena ni vende datos personales.** La extensión es una herramienta que opera sobre páginas de MercadoLibre que el usuario visita voluntariamente, y sólo transmite los datos de la publicación al ecosistema DigitalSellers (Analyzer / Simulador) **cuando el usuario hace click explícito** en una de las herramientas del menú.

## ¿Qué datos procesamos?

### Datos que la extensión lee del DOM de MercadoLibre
Únicamente cuando el usuario hace click en una herramienta del menú:

- Título, descripción y atributos del producto
- URLs de las imágenes publicadas
- Precio y moneda
- Categoría (breadcrumb)
- Nombre del vendedor (visible públicamente)
- IDs de la publicación y del catálogo (MLA…)

**Todo esto es información pública** que ya figura visible en la página. La extensión no accede a cuentas, mensajes privados, órdenes ni datos de compradores.

### Datos que se envían al servidor DS
Cuando el usuario dispara una herramienta:

- El payload scrapeado mencionado arriba
- Versión de la extensión
- Timestamp del evento

**NO se envía**:
- Cookies del usuario
- Credenciales
- Historial de navegación
- Datos de otras pestañas
- Información del sistema operativo o browser fingerprint

### Almacenamiento local de la extensión
La extensión usa `chrome.storage.local` solamente para:

- Guardar sesiones efímeras (ttl 5 minutos) con el payload mientras se abre la tab del Analyzer.
- Preferencias del usuario (tema, posición del botón) vía `chrome.storage.sync`.

Estos datos no salen del navegador salvo para sincronizarse entre tus propios dispositivos (feature nativa de Chrome, no de DS).

## Telemetría anónima (opt-out)

Opcionalmente, la extensión envía al servidor DS:

- Contador de usos por herramienta (ej. "pack-visual fue invocado 3 veces")
- Versión de la extensión
- Sitio MeLi usado (AR / BR / MX / etc.)
- Errores del scraper (qué campo no encontró, sin contenido)

**Estos datos son agregados y anónimos.** No identifican al usuario. Podés deshabilitar la telemetría completa desde la página de opciones de la extensión.

## Terceros

La extensión no integra servicios de analítica de terceros (Google Analytics, Facebook Pixel, Mixpanel, Hotjar, etc.).

## Permisos solicitados

| Permiso | Uso |
|---|---|
| `storage` | Guardar sesiones efímeras y preferencias locales |
| `tabs` | Abrir el Analyzer/Simulador en una pestaña nueva |
| `activeTab` | Inyectar el botón solo en la pestaña activa de MeLi |

**No usamos** `cookies`, `webRequest`, `history`, `bookmarks`, `downloads`, `declarativeNetRequest`.

## Tus derechos

Al ser una herramienta self-service sin cuenta propia, no tenemos datos personales tuyos. Podés:

- Desactivar la extensión desde `chrome://extensions/`
- Deshabilitar telemetría desde la página de opciones
- Eliminar todos los datos locales quitando la extensión (esto purga `chrome.storage`)

## Contacto

Para consultas sobre privacidad escribinos a **privacy@digitalsellers.com.ar**.

## Cambios a esta política

Si actualizamos esta política, los cambios se reflejarán en este archivo y se mostrará una notificación en la página de opciones. Usar la extensión luego de un cambio implica aceptar la versión actualizada.
