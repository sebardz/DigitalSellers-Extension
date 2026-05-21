# Setup GitHub Release — una vez

> Esta guía te lleva de **repo local → primer release publicado en GitHub** en 3 pasos (~5 min).
> Después, cada `git tag vX.Y.Z && git push --tags` genera una release nueva automáticamente.

---

## Paso 1 — Autenticar `gh` con tu cuenta GitHub

```bash
gh auth login
```

Elegí:
- **GitHub.com**
- **HTTPS**
- **Y** (autorizar con credenciales)
- **Login with a web browser**

Te va a dar un **código de 8 caracteres** (ej. `ABCD-1234`). Copialo, abrí el link que te muestra (`https://github.com/login/device`), pegá el código y autorizá.

Al volver a la terminal vas a ver `✓ Authentication complete.`

---

## Paso 2 — Crear el repo + push inicial

Desde la carpeta de la extensión:

```bash
cd "D:/CC/DigitalSellers/DS-APP/DigitalSellers-Extension"

# Crea repo privado "DigitalSellers-Extension" en tu cuenta
# + configura remote origin + push del main + push de tags
gh repo create DigitalSellers-Extension \
  --private \
  --source=. \
  --remote=origin \
  --push \
  --description "Chrome extension paraguas del ecosistema DigitalSellers — Pack visual con IA desde MercadoLibre"

# Push de todos los tags (v0.2.0, v0.3.0, v0.4.0)
git push origin --tags
```

Al pushear los tags, **GitHub Actions va a disparar 3 workflows** (uno por tag) y va a crear **3 releases automáticas** con los zips correspondientes.

---

## Paso 3 — Verificar

Abrí en el browser:

```
https://github.com/<TU-USUARIO>/DigitalSellers-Extension/releases
```

Vas a ver:
- `v0.2.0`, `v0.3.0`, `v0.4.0` con sus zips adjuntos
- Notas del CHANGELOG renderizadas

**Link directo para clientes (siempre la última):**

```
https://github.com/<TU-USUARIO>/DigitalSellers-Extension/releases/latest
```

---

## 🔁 A partir de ahora, cada vez que quieras liberar una versión nueva

1. Editá `package.json` y `src/manifest.json`: bump de `version` (ej. `0.4.0` → `0.5.0`)
2. Agregá una entrada al `CHANGELOG.md` describiendo los cambios
3. Commit + tag + push:

```bash
git add .
git commit -m "chore: bump v0.5.0"
git tag v0.5.0
git push origin main --tags
```

4. Esperá ~2 min
5. La release aparece en `/releases/latest` con el zip listo para descargar

Al cliente le mandás un único link:
```
👉 https://github.com/<TU-USUARIO>/DigitalSellers-Extension/releases/latest
```

Y él siempre baja la última versión disponible.

---

## 🛠️ Troubleshooting

### "gh auth login" no avanza

Si no tenés terminal para browser, probá:

```bash
gh auth login --with-token < token.txt
```

Donde `token.txt` contiene un Personal Access Token generado en
https://github.com/settings/tokens (scope: `repo` + `workflow`).

### El workflow falla en tests

Corré `npm run test:run` localmente antes de pushear el tag. Si rompe local,
también va a romper en CI.

### Quiero hacer el repo público

Desde la web de GitHub: repo → Settings → Danger Zone → Change visibility.
O:

```bash
gh repo edit sebardz/DigitalSellers-Extension --visibility public
```
