# DigitalSellers Extension — contexto

Extensión Chrome del ecosistema DigitalSellers. Su objetivo es ofrecer accesos y flujos explícitos desde publicaciones de MercadoLibre hacia herramientas vigentes del ecosistema.

## Estado actual

- El Simulador permanece registrado como integración futura y está deshabilitado hasta contar con un scraper validado.
- No existe telemetría remota ni health check dependiente de servicios externos.
- Los datos sólo se procesan después de una acción explícita del usuario.

## Validación local

```powershell
npm ci
npm run typecheck
npm test
npm run build
```
