# App de registro de entrenamientos — Diseño

Fecha: 21-nov-2026 · Usuario GitHub: `ichaoart-cmd`

## 1. Intención

Registrar marcas de CrossFit y carrera **desde el móvil, en segundos, justo al terminar de entrenar**. Hoy se registra en Notion y la fricción hace que se deje de apuntar (Metcons vacíos desde 2025, erratas, hueco jun→oct-2026). Si registrar es fácil, se registra siempre, y con datos completos se ve la progresión.

## 2. Objetivos, no-objetivos, anti-objetivos

**Objetivos**
- Registrar una sesión típica (1 levantamiento + 1 Metcon) en < 30 s, casi sin teclear.
- Registrar carrera.
- Ver récords personales, 1RM estimado y progresión por ejercicio sin hacer nada.
- No perder nunca los datos, ni al cambiar de móvil.
- Arrancar con el histórico de Notion importado (≈165 sesiones, ene-2024 → oct-2026).

**No-objetivos**
- Sincronizar con Notion (se abandona Notion como registro).
- Planificar entrenamientos o generar WODs.
- Multiusuario, social, compartir.
- App en tiendas (App Store / Play).

**Anti-objetivos** (aunque funcione, sería un fracaso si…)
- Obliga a escribir texto largo para guardar una sesión.
- No funciona sin cobertura en el box.
- Se pierden datos.

## 3. Restricciones
- Uso exclusivo desde móvil, una mano, con prisa → botones grandes, listas, valores por defecto inteligentes.
- Funciona offline.
- Coste 0 €.
- Un solo usuario.

## 4. Enfoques considerados
| Enfoque | Pros | Contras |
|---|---|---|
| **A. PWA (web instalable)** ✅ elegido | Instalación con un enlace, offline, cambios rápidos, gratis | Datos en el navegador → se resuelve con sincronización a GitHub |
| B. App nativa (Expo/React Native) | Sensación nativa | Instalación con herramientas de desarrollo o cuenta de pago de Apple; cada cambio cuesta más |
| C. Sin código (Glide/AppSheet) | Rapidísima de montar | No permite rampa automática, resultado por formato de WOD ni récords calculados |

**Almacenamiento:** elegido **repo privado de GitHub** (vs. Supabase/Firebase). Motivo: gratis, sin caducidad por inactividad, historial de versiones, datos propios y legibles, cambio de móvil trivial. Firebase/Supabase añaden montaje y dependencia sin aportar nada para un solo usuario.

## 5. Arquitectura (decidido)
- **App**: PWA estática alojada en GitHub Pages, repo público `ichaoart-cmd/entrenos-app` (solo código, sin datos).
- **Datos**: repo **privado** `ichaoart-cmd/entrenos-data`, archivo `data/entrenos.json` (un único JSON; tamaño estimado < 1 MB tras años).
- **Acceso**: token *fine-grained* de GitHub con permiso *Contents: read & write* **solo** sobre `entrenos-data`. Se pega una vez en Ajustes; se guarda en el móvil.
- **Offline-first**: los datos viven en IndexedDB del móvil. Cada guardado queda en cola y se sube a GitHub (API de contenidos, un commit por cambio) al haber conexión. Al abrir la app se descarga la última versión.
- **Conflictos**: se usa el `sha` del archivo; si cambió en remoto, se fusiona por id de registro (los registros son independientes) y se reintenta.
- **Copia extra**: botón "Exportar JSON/CSV" en Ajustes.

## 6. Modelo de datos
```json
{
  "version": 1,
  "ejercicios": [{ "id": "back-squat", "nombre": "Back Squat", "grupo": "Dom. Rodilla" }],
  "sesiones": [{
    "id": "uuid", "fecha": "2026-10-20", "lugar": "box|casa",
    "fuerza": [{
      "ejercicio": "shoulder-press", "variante": "btn",
      "reps": 6, "series": [34, 36, 38, 40, 42], "tempo": "4s+pausa", "nota": ""
    }],
    "metcon": {
      "formato": "AMRAP|EMOM|ForTime|Intervalos|Otro",
      "duracionMin": 20, "equipo": false,
      "resultado": { "tipo": "rondas+reps|tiempo|reps|kg|bloques", "valor": "3+200" },
      "rx": true, "descripcion": "400m run / 30 KB swing 16kg / 20 burpees"
    },
    "carrera": null,
    "nota": ""
  }],
  "carreras": [{
    "id": "uuid", "fecha": "…", "tipo": "rodaje|series|tirada larga|competición",
    "distanciaKm": 8.0, "tiempo": "00:42:10", "nota": ""
  }]
}
```

## 7. Pantallas
1. **Inicio**: botón grande "＋ Registrar" y la última sesión de un vistazo; accesos a Fuerza, Metcon y Carrera.
2. **Registrar fuerza**
   - Ejercicio preseleccionado: el que te toca según tu rotación (Back Squat → Banca → Shoulder → Peso muerto → Front, el que lleve más tiempo sin hacerse). Lista para cambiarlo.
   - Chips de variante (btn, close grip, agarre medio, barra alta…) y de tempo (3s+pausa, 4s+pausa, sin tempo); recuerda la última elección por ejercicio.
   - Introduces **serie top (kg)** y **reps** con botones +/-. La rampa de 5 series se genera sola (mismo incremento que la última vez de ese ejercicio; si no hay, S1 = 80 % de la top, redondeo a 0,5 kg). Cada serie editable con un toque.
   - Al guardar: aviso si es récord personal.
3. **Registrar Metcon**: formato (chips) → el campo de resultado se adapta (rondas+reps, mm:ss, reps, kg, uno por bloque) → RX/escalado → descripción opcional.
4. **Registrar carrera**: tipo, distancia, tiempo → ritmo (min/km) calculado.
5. **Progreso** (parte central de la app — petición explícita del usuario: gráficas de progreso y estimaciones de RM)
   - **Por ejercicio de fuerza**
     - Gráfica de **1RM estimado** en el tiempo (de la mejor serie de cada sesión), con la **serie top real** superpuesta. Filtro por periodo (3 m / 6 m / 1 año / todo) y por variante.
     - **Tarjeta de RMs estimados**: 1RM, 3RM, 5RM, 8RM, 10RM calculados del mejor registro reciente, junto a los RMs **reales** conseguidos (récord por número de reps, con fecha).
     - **Tabla de porcentajes**: 50–100 % del 1RM estimado en kg redondeados a 0,5 → útil para saber con qué peso entrar.
     - **Comparativa por bloque**: "la última vez que hiciste 5 reps de Back Squat" vs. hoy.
     - **Volumen** (kg × reps) por semana.
   - **Fórmula RM**: media de Epley y Brzycki (más estable entre 3 y 10 reps); con > 10 reps se muestra con aviso de baja fiabilidad.
   - **Récords**: línea de tiempo de PRs y aviso al guardar ("Nuevo 5RM: 94 kg, +2 kg").
   - **Resumen general**: sesiones por semana/mes (constancia), racha actual, distribución por patrón de movimiento.
   - **Metcon**: WODs repetidos (mismo formato y descripción, o marcados como benchmark) se comparan entre sí.
   - **Carrera**: ritmo medio en el tiempo, km por semana, mejores tiempos por distancia (1, 5, 10 km, media) y **predicción de tiempos** a otras distancias (fórmula de Riegel).
6. **Calendario de constancia** (petición del usuario: ver de un vistazo la constancia)
   - **Vista mes**: cada día con puntos de color por tipo (fuerza, Metcon, carrera); tocar un día abre su sesión. Arriba: sesiones del mes, media semanal y racha actual (semanas seguidas cumpliendo un mínimo de sesiones, configurable, por defecto 3).
   - **Vista año**: mapa de calor tipo GitHub (un cuadrado por día, más oscuro = más carga), para ver huecos como el de jun→oct-2026.
7. **Historial**: lista por fecha, editar o borrar.
8. **Ajustes**: token de GitHub, estado de sincronización, exportar, gestión de ejercicios y variantes.

## 8. Importación de Notion (una sola vez)
- Fuerza: `Selección Ejercicio` → ejercicio (unificando SNACH/Snach→Snatch, Puss Press→Push Press, Puss ups→Push ups); `Serie 1–5` → series (ignorando vacías); `Reps`; `Tempo` normalizado a chips; variante extraída del título (btn, close grip, MG/medio, H.L.); si falta `Reps`, se intenta sacar del título ("x8").
- Sesiones: fecha y lugar (Box/Casa); el texto del Metcon va a `descripcion`, y el resultado entre paréntesis se intenta parsear (formato y resultado) — si no se puede, queda solo como descripción.
- Registros sin ejercicio (4) se importan como nota.

## 9. Stack (decisión del constructor)
Vite + Preact + TypeScript, sin backend. Service worker para offline. Gráficas ligeras (uPlot o SVG propio). Tests unitarios de: generación de rampa, 1RM, récords, parseo de importación y fusión de conflictos.

## 10. Decisiones mías (revisables)
- Nombres de repos `entrenos-app` / `entrenos-data`.
- Regla de la rampa y redondeo.
- Rotación de ejercicios para la preselección.
- Fórmula de RM: media de Epley y Brzycki; Riegel para predicción de carrera.
- Unidades: kg y km.

## 11. Carreras automáticas desde el reloj Xiaomi
El usuario usa reloj Xiaomi (app Mi Fitness). Mi Fitness sincroniza actividades con Strava. Cadena:
**Reloj → Mi Fitness → Strava → GitHub Action → `entrenos-data`**.
- Una **GitHub Action** programada en `entrenos-data` (cada pocas horas) consulta la API de Strava, toma las actividades de tipo carrera nuevas y las añade a `carreras` (distancia, tiempo, ritmo, desnivel, FC media si existe, id de Strava para no duplicar).
- Las credenciales de Strava (client id/secret, refresh token) viven como *secrets* del repo, nunca en el móvil.
- En la app se puede completar el tipo (rodaje, series…) y una nota.
- Siempre disponible el registro manual como alternativa.
- Riesgo conocido: la sincronización Mi Fitness → Strava a veces falla o tarda; no afecta a la app, solo al momento en que aparece la carrera.

- Confirmado (21-nov-2026): el usuario tiene cuenta de Strava y ya la tiene conectada a Mi Fitness.

## 12. Pendiente
- Nada abierto. Para activar la importación hará falta crear una "API Application" en Strava (ajustes de Strava → API) y autorizarla una vez; se guiará paso a paso durante la construcción.
