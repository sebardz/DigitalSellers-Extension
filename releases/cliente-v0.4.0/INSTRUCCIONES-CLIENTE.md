# DigitalSellers Hub — Instalación para testing

> Esta guía es para instalar la extensión en tu navegador Chrome mientras todavía no está publicada en la Chrome Web Store.

---

## ¿Qué hace la extensión?

Cuando estés en una publicación de MercadoLibre, aparece un botón flotante **"DS"** abajo a la derecha. Lo apretás, elegís "Generar Pack Visual" y automáticamente se abre el Analyzer con **todos los datos** de esa publicación cargados y generando las 15 imágenes del pack visual.

---

## Requisitos

- Google Chrome (versión 120 o superior)
- El archivo `digitalsellers-hub-v0.3.0.zip` que te mandamos
- 2 minutos

---

## Instalación paso a paso

### 1. Descomprimir el zip

Bajá el archivo `digitalsellers-hub-v0.3.0.zip` a una carpeta **permanente** en tu PC (ej. `C:\DigitalSellers\Extension\` o `Documentos\Extension\`).

**⚠️ IMPORTANTE:** No lo pongas en una carpeta temporal (Descargas, Escritorio, etc.). Si movés o borrás la carpeta, la extensión deja de funcionar.

Descomprimí el zip ahí mismo. Vas a tener una carpeta con archivos adentro (manifest.json, icons/, assets/, etc.).

### 2. Abrir la configuración de extensiones de Chrome

En Chrome, andá a esta dirección:

```
chrome://extensions/
```

(Pegá eso en la barra de direcciones y presioná Enter)

### 3. Activar el "Modo de desarrollador"

Arriba a la derecha de esa página vas a ver un toggle (interruptor) que dice **"Modo de desarrollador"**. Activalo.

Se van a desplegar 3 botones: "Cargar extensión desempaquetada", "Empaquetar extensión" y "Actualizar".

### 4. Cargar la extensión

Click en **"Cargar extensión desempaquetada"**.

Se abre un explorador de archivos. Navegá hasta la carpeta donde descomprimiste el zip y seleccionala. Click en "Seleccionar carpeta".

### 5. Fijar la extensión a la barra

Ya debería aparecer **"DigitalSellers Hub 0.3.0"** en la lista de extensiones.

Opcional pero recomendado: arriba a la derecha de Chrome, click en el ícono de la pieza de puzzle (extensiones), buscá DigitalSellers Hub y click en el ícono de alfiler 📌 para fijarla en la barra.

---

## Cómo usarla

### 1. Entrá a una publicación cualquiera de MercadoLibre

Ejemplo: https://www.mercadolibre.com.ar/cualquier-producto

### 2. Vas a ver un botón flotante

Abajo a la derecha aparece un círculo azul-violeta con las letras **"DS"**.

### 3. Click al botón

Se despliega un menú con las herramientas:
- 🎨 **Generar Pack Visual** — 15 imágenes optimizadas listas para publicar
- 🎬 **Generar Video Pack** (Beta) — 3 videos verticales

### 4. Elegí "Generar Pack Visual"

Se abre una pestaña nueva con `analyzer.digitalsellers.com.ar`. Ahí vas a ver un wizard que:

1. **Procesa los datos** (2-3 segundos)
2. **Te muestra todo lo detectado** (título, precio, atributos, fotos, etc.) para que revises/edites
3. **Genera las 15 imágenes** en paralelo (~1 minuto)
4. **Te deja descargar** el ZIP completo o imagen por imagen

---

## Aviso de Chrome

Mientras la extensión está en modo desarrollo, cada vez que abrís Chrome te va a mostrar un banner amarillo arriba que dice algo como:

> "Desactive el modo de desarrollador de extensiones"

**Ignoralo** — es solo porque todavía no está publicada en el Chrome Web Store. Cuando la subamos al Store (1-3 días), el banner desaparece y la extensión se auto-actualiza sola.

---

## Desinstalación

Si querés sacarla en cualquier momento:

1. `chrome://extensions/`
2. Buscá "DigitalSellers Hub"
3. Click en "Quitar"

---

## Problemas frecuentes

### No aparece el botón DS en MeLi

- Asegurate de estar en una **página de producto** (PDP), no en la home ni en búsqueda.
- Refrescá la página (Ctrl+F5).
- Verificá en `chrome://extensions/` que el toggle de DigitalSellers Hub esté encendido.

### El pack no genera imágenes

- Necesitás una API key de Google Gemini configurada en **Ajustes → API Keys** dentro de `analyzer.digitalsellers.com.ar`. Te pasamos la instrucción aparte.

### La extensión se desinstaló sola

- Pasó porque moviste la carpeta descomprimida. Volvé a cargarla desde la carpeta nueva siguiendo los pasos 2-4.

---

## Contacto

Si algo no anda, mandale screenshot de la pantalla + URL de MeLi donde falló a Seba.
