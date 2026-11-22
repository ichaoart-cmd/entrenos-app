# Importación automática desde Strava (en pausa)

Desde junio de 2026 la API de Strava exige suscripción de pago, así que esto no está activo.
Si algún día hay suscripción:

1. Crear la aplicación en strava.com/settings/api (dominio de devolución: `localhost`).
2. En `entrenos-data` → Settings → Secrets → Actions: `STRAVA_CLIENT_ID` y `STRAVA_CLIENT_SECRET`.
3. Copiar `strava.yml` a `entrenos-data/.github/workflows/`.
4. Abrir `https://www.strava.com/oauth/authorize?client_id=ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all`,
   aceptar y pegar la dirección a la que lleva en la acción «Carreras de Strava» → Run workflow.

El código está en `scripts/strava.ts` y `scripts/strava/cliente.ts`.
