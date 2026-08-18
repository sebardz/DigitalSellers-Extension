# Publicacion manual desde un artifact local

> Nombre histórico conservado para no romper links. GitHub Actions está deshabilitado y no forma parte del release.

## 1. Preparar la versión

Actualizar el mismo SemVer en `package.json`, `package-lock.json` y `src/manifest.json`, y documentar el cambio en `CHANGELOG.md`.

## 2. Validar y empaquetar localmente

```powershell
D:\CC\Agent-Master\local-workflows.ps1 -Workflow extension-release -Version 0.4.0
```

El perfil ejecuta iconos, lint, tests, typecheck y `npm run pack`. Falla si las versiones no coinciden o si el artifact ya existe; `-ForceArtifact` permite reemplazarlo de forma explícita.

## 3. Revisar y distribuir

Inspeccionar `releases/digitalsellers-hub-v<version>.zip` y probarlo como extensión desempaquetada antes de subirlo manualmente al canal aprobado. El runner local no hace commit, tag, push, GitHub Release ni Chrome Web Store publish.

Las credenciales de publicación permanecen fuera del repo. No pasarlas por argumentos ni guardarlas en scripts.
