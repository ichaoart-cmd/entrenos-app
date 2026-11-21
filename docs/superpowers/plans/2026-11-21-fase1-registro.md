# Fase 1 — Registro de fuerza y Metcon + histórico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA instalable en el móvil para registrar sesiones (fuerza + Metcon) en < 30 s, sincronizada con un repo privado de GitHub y con el histórico de Notion importado.

**Architecture:** App estática (Vite + Preact + TS) desplegada en GitHub Pages desde `ichaoart-cmd/entrenos-app`. Datos offline-first en IndexedDB, sincronizados como un único `data/entrenos.json` en el repo privado `ichaoart-cmd/entrenos-data` vía la API de contenidos de GitHub con un token fine-grained. Lógica de dominio pura (rampa, RM, récords, fusión, importación) separada de la UI y cubierta por tests.

**Tech Stack:** Vite 6, Preact 10, TypeScript (strict), vite-plugin-pwa, idb-keyval, Vitest + @testing-library/preact + fake-indexeddb.

**Spec:** `docs/superpowers/specs/2026-11-21-app-registro-entrenamientos-design.md`

**Fuera de esta fase** (planes posteriores): Fase 2 = pantalla Progreso (gráficas, RMs, porcentajes) + Calendario. Fase 3 = carrera (manual + importación Strava con GitHub Action). Esta fase sí incluye las funciones de dominio de RM y récords porque el aviso de PR al guardar las necesita.

## Global Constraints
- Todo el texto de la interfaz en español.
- Unidades: kg (redondeo a 0,5) y km.
- Funciona sin conexión: guardar nunca depende de la red.
- Coste 0 €; sin backend propio.
- Repos: app `ichaoart-cmd/entrenos-app` (público), datos `ichaoart-cmd/entrenos-data` (privado), archivo `data/entrenos.json`.
- Base path de Vite: `/entrenos-app/`.
- Diseño móvil, una mano: objetivos táctiles ≥ 44 px, entrada numérica con botones +/-.
- El token de GitHub nunca se registra en logs ni se incluye en exportaciones.

## Review Focus
1. **Guardar sin cobertura y reabrir la app**: la sesión sigue ahí y se sube al volver la red → test en Task 5 (`persiste-y-marca-pendiente`) y Task 6 (`sincroniza-pendientes`).
2. **Token ausente, inválido o caducado (401/403)**: la app sigue funcionando en local y muestra "Sin sincronizar: revisa el token" → test en Task 6 (`token-invalido-no-pierde-datos`).
3. **El archivo remoto cambió desde la última lectura (409/422 por sha)**: se fusiona y reintenta sin perder registros de ninguno de los dos lados → test en Task 6 (`conflicto-sha-fusiona-y-reintenta`).
4. **Decimales con coma** ("82,5") en kg → 82.5 → test en Task 2 (`parsearKg-acepta-coma`).
5. **Móvil nuevo o datos del navegador borrados**: con el token, la primera sincronización restaura todo desde GitHub → test en Task 6 (`local-vacio-restaura-remoto`).

---

## File Structure

```
src/
  domain/
    types.ts          # tipos de datos (Datos, Sesion, Fuerza, Metcon, Carrera, Ejercicio)
    numeros.ts        # parsearKg, redondear05
    rampa.ts          # generarRampa
    rm.ts             # e1rm, rmEstimado, esFiable
    records.ts        # recordsPorReps, detectarPR, ejercicioSugerido
    fusion.ts         # fusionar(local, remoto)
    ids.ts            # nuevoId
  store/
    local.ts          # IndexedDB: cargarLocal, guardarLocal, ajustes
    github.ts         # leerRemoto, escribirRemoto
    sync.ts           # sincronizar
    estado.ts         # estado global de la app (signals)
  ui/
    App.tsx           # router por hash: #/ #/registrar #/historial #/ajustes
    Inicio.tsx
    Registrar.tsx     # contiene FuerzaForm + MetconForm + guardar
    FuerzaForm.tsx
    MetconForm.tsx
    Historial.tsx
    Ajustes.tsx
    componentes/      # Stepper, Chips, Aviso
  main.tsx
  estilos.css
scripts/
  importar-notion.ts  # export Notion (JSON) → data/entrenos.json
  notion/parsers.ts   # normalizarEjercicio, extraerVariante, normalizarTempo, extraerReps, parsearMetcon
  notion/export/      # fuerza.json, sesiones.json (generados en Task 8)
tests/                # espejo de src/ y scripts/
.github/workflows/deploy.yml
```

---

### Task 1: Esqueleto PWA desplegable

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `src/estilos.css`, `public/icon-192.png`, `public/icon-512.png`, `.github/workflows/deploy.yml`, `vitest.config.ts`
- Test: `tests/ui/App.test.tsx`

**Interfaces:**
- Produces: `App()` componente raíz con router por hash (`#/`, `#/registrar`, `#/historial`, `#/ajustes`).

- [ ] **Step 1:** `npm create vite@latest . -- --template preact-ts`; añadir `vite-plugin-pwa`, `idb-keyval`, `vitest`, `@testing-library/preact`, `jsdom`, `fake-indexeddb`.
- [ ] **Step 2: Test que falla**
```tsx
test('muestra el botón Registrar en inicio', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /registrar/i })).toBeTruthy();
});
```
- [ ] **Step 3:** `npx vitest run tests/ui/App.test.tsx` → FAIL.
- [ ] **Step 4:** `App` con las 4 rutas (páginas vacías salvo Inicio con enlace "＋ Registrar"). `vite.config.ts`: `base: '/entrenos-app/'`, VitePWA con `registerType: 'autoUpdate'`, manifest `name: 'Entrenos'`, `display: 'standalone'`, `theme_color: '#111111'`, iconos 192/512.
- [ ] **Step 5:** Test PASS. `npm run build` sin errores.
- [ ] **Step 6:** Workflow `deploy.yml`: en push a `main`, `npm ci && npm test && npm run build`, publicar `dist/` con `actions/deploy-pages`.
- [ ] **Step 7: Commit** `feat: esqueleto PWA con despliegue a Pages`

---

### Task 2: Tipos, números y rampa

**Files:**
- Create: `src/domain/types.ts`, `src/domain/numeros.ts`, `src/domain/rampa.ts`, `src/domain/ids.ts`
- Test: `tests/domain/numeros.test.ts`, `tests/domain/rampa.test.ts`

**Interfaces:**
- Produces:
```ts
type Lugar = 'box' | 'casa';
type FormatoMetcon = 'AMRAP' | 'EMOM' | 'ForTime' | 'Intervalos' | 'Otro';
type TipoResultado = 'rondas+reps' | 'tiempo' | 'reps' | 'kg' | 'bloques';
interface Base { id: string; actualizado: string /*ISO*/; borrado?: boolean }
interface Ejercicio { id: string; nombre: string; grupo: string }
interface Fuerza { ejercicio: string; variante?: string; reps: number | null; series: number[]; tempo?: string; nota?: string }
interface Metcon { formato: FormatoMetcon; duracionMin?: number; equipo?: boolean;
  resultado?: { tipo: TipoResultado; valor: string }; rx?: boolean; descripcion?: string }
interface Sesion extends Base { fecha: string /*YYYY-MM-DD*/; lugar: Lugar; fuerza: Fuerza[]; metcon?: Metcon; nota?: string }
interface Carrera extends Base { fecha: string; tipo?: string; distanciaKm: number; tiempoSeg: number; nota?: string; stravaId?: number }
interface Datos { version: 1; ejercicios: Ejercicio[]; sesiones: Sesion[]; carreras: Carrera[] }
parsearKg(texto: string): number | null
redondear05(kg: number): number
generarRampa(top: number, anterior?: number[]): number[]
nuevoId(): string   // crypto.randomUUID()
```
- Nota: el spec usa `tiempo: "00:42:10"`; aquí se guarda `tiempoSeg` (entero) para calcular; la UI formatea. `actualizado`/`borrado` existen para la fusión (Task 6).

- [ ] **Step 1: Tests que fallan**
```ts
test('parsearKg-acepta-coma', () => { expect(parsearKg('82,5')).toBe(82.5); expect(parsearKg('94')).toBe(94); expect(parsearKg('abc')).toBeNull(); });
test('redondear05', () => { expect(redondear05(84.26)).toBe(84.5); expect(redondear05(84.2)).toBe(84); });
test('rampa repite el salto de la vez anterior', () => {
  expect(generarRampa(96, [74, 79, 84, 89, 94])).toEqual([76, 81, 86, 91, 96]);
});
test('rampa respeta el número de series anterior', () => {
  expect(generarRampa(132, [110, 120, 130])).toEqual([112, 122, 132]);
});
test('rampa sin historial: 5 series desde el 80 %', () => {
  expect(generarRampa(100)).toEqual([80, 85, 90, 95, 100]);
});
test('rampa con historial de una sola serie usa la regla del 80 %', () => {
  expect(generarRampa(100, [100])).toEqual([80, 85, 90, 95, 100]);
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementar. Rampa: con `anterior` de ≥ 2 series, `n = anterior.length`, `primera = top - (max(anterior) - anterior[0])`; si no, `n = 5`, `primera = top * 0.8`. Series equiespaciadas de `primera` a `top`, cada una `redondear05`, la última exactamente `top`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat: tipos de dominio, parseo de kg y rampa`

---

### Task 3: Estimación de RM

**Files:**
- Create: `src/domain/rm.ts`
- Test: `tests/domain/rm.test.ts`

**Interfaces:**
- Produces: `e1rm(kg: number, reps: number): number` · `rmEstimado(unoRM: number, reps: number): number` · `esFiable(reps: number): boolean`

- [ ] **Step 1: Tests**
```ts
test('1 rep = el propio peso', () => expect(e1rm(100, 1)).toBe(100));
test('media de Epley y Brzycki', () => expect(e1rm(94, 5)).toBeCloseTo(107.71, 1)); // Epley 109.67, Brzycki 105.75
test('inversa: 5RM desde 1RM', () => expect(rmEstimado(107.71, 5)).toBeCloseTo(94, 0));
test('fiabilidad', () => { expect(esFiable(10)).toBe(true); expect(esFiable(12)).toBe(false); });
```
- [ ] **Step 2:** FAIL. **Step 3:** Epley `kg*(1+reps/30)`, Brzycki `kg*36/(37-reps)`; `e1rm` = media (reps=1 → kg). `rmEstimado` = media de las inversas `unoRM/(1+r/30)` y `unoRM*(37-r)/36`. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: estimación de RM (Epley+Brzycki)`

---

### Task 4: Récords y ejercicio sugerido

**Files:**
- Create: `src/domain/records.ts`
- Test: `tests/domain/records.test.ts`

**Interfaces:**
- Consumes: `Sesion`, `Fuerza` (Task 2).
- Produces:
```ts
interface Marca { reps: number; kg: number; fecha: string }   // no usar 'Record' (choca con el tipo de TS)
interface PR { reps: number; kg: number; anteriorKg: number | null }
recordsPorReps(sesiones: Sesion[], ejercicioId: string): Map<number, Marca>   // mejor max(series) por número de reps; ignora borrado y reps null
detectarPR(f: Fuerza, fecha: string, historial: Sesion[]): PR | null
ejercicioSugerido(sesiones: Sesion[], rotacion: string[]): string   // el de la rotación con la fecha más antigua (o nunca hecho)
ultimaFuerza(sesiones: Sesion[], ejercicioId: string): Fuerza | null
ROTACION = ['back-squat','press-banca','shoulder-press','deadlift','front-squat']
```

- [ ] **Step 1: Tests** (fixture con 3 sesiones de back-squat: 5×92 el 11-jun, 5×94 el 18-jun, 8×96 el 24-nov-2025)
```ts
test('récord por reps', () => { const r = recordsPorReps(fx, 'back-squat'); expect(r.get(5)).toEqual({ reps: 5, kg: 94, fecha: '2026-06-18' }); expect(r.get(8)?.kg).toBe(96); });
test('PR nuevo', () => expect(detectarPR({ ejercicio: 'back-squat', reps: 5, series: [76,81,86,91,96] }, '2026-11-21', fx)).toEqual({ reps: 5, kg: 96, anteriorKg: 94 }));
test('igualar no es PR', () => expect(detectarPR({ ejercicio: 'back-squat', reps: 5, series: [94] }, '2026-11-21', fx)).toBeNull());
test('primer registro a unas reps es PR con anterior null', () => expect(detectarPR({ ejercicio: 'back-squat', reps: 3, series: [100] }, '2026-11-21', fx)?.anteriorKg).toBeNull());
test('sugerido = el más antiguo de la rotación', () => expect(ejercicioSugerido(fx, ROTACION)).toBe('press-banca')); // nunca hecho en fx
test('ignora sesiones borradas', () => { const r = recordsPorReps([...fx, sesionBorrada5x100], 'back-squat'); expect(r.get(5)?.kg).toBe(94); });
```
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: récords, detección de PR y ejercicio sugerido`

---

### Task 5: Almacén local (IndexedDB)

**Files:**
- Create: `src/store/local.ts`
- Test: `tests/store/local.test.ts` (con `fake-indexeddb/auto`)

**Interfaces:**
- Produces:
```ts
interface Ajustes { token?: string; ultimoSha?: string; pendiente: boolean; ultimaSync?: string; minSesionesSemana: number /*=3*/ }
cargarLocal(): Promise<Datos>            // vacío por defecto: { version:1, ejercicios: EJERCICIOS_BASE, sesiones:[], carreras:[] }
guardarSesion(s: Sesion): Promise<void>  // upsert por id, pone actualizado=now, marca pendiente=true
borrarSesion(id: string): Promise<void>  // borrado=true (tombstone), pendiente=true
reemplazarDatos(d: Datos): Promise<void>
cargarAjustes(): Promise<Ajustes>; guardarAjustes(a: Partial<Ajustes>): Promise<void>
EJERCICIOS_BASE: Ejercicio[]  // Back Squat, Front Squat, Press Banca, Shoulder Press, Deadlift, Push Press, Snatch, Power Snatch, Clean, Power Clean, Dips, Push Ups
```

- [ ] **Step 1: Tests**: `persiste-y-marca-pendiente` (guardar → nueva instancia de `cargarLocal` lo devuelve y `cargarAjustes().pendiente === true`); `borrar-es-tombstone`; `upsert-no-duplica`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar con `idb-keyval` (claves `datos`, `ajustes`). **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: almacén local en IndexedDB`

---

### Task 6: Fusión y sincronización con GitHub

**Files:**
- Create: `src/domain/fusion.ts`, `src/store/github.ts`, `src/store/sync.ts`
- Test: `tests/domain/fusion.test.ts`, `tests/store/sync.test.ts` (fetch mockeado)

**Interfaces:**
- Consumes: Task 5.
- Produces:
```ts
fusionar(local: Datos, remoto: Datos): Datos   // unión por id en sesiones/carreras/ejercicios; mismo id → gana mayor `actualizado`; tombstones se conservan
leerRemoto(token: string): Promise<{ datos: Datos; sha: string } | null>  // null si el archivo no existe (404)
escribirRemoto(token: string, datos: Datos, sha: string | undefined, mensaje: string): Promise<string /*nuevo sha*/>
type ResultadoSync = { ok: true } | { ok: false; motivo: 'sin-token' | 'token' | 'red' | 'conflicto' }
sincronizar(): Promise<ResultadoSync>   // leer → fusionar → escribir si cambió → reemplazarDatos; reintenta 1 vez en 409/422
```
- API: `GET/PUT https://api.github.com/repos/ichaoart-cmd/entrenos-data/contents/data/entrenos.json`, cabeceras `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`; contenido en base64 UTF-8 (usar `TextEncoder`, no `btoa` directo, por las tildes). JSON escrito con indentación 2 para que los diffs sean legibles.

- [ ] **Step 1: Tests fusión**: unión de sesiones distintas; mismo id gana el más reciente; tombstone remoto más reciente borra el local; idempotente (`fusionar(a,a)` ≡ `a`).
- [ ] **Step 2: Tests sync**:
  - `sincroniza-pendientes`: local con 1 sesión pendiente, remoto vacío → PUT con la sesión, `pendiente=false`, `ultimoSha` actualizado.
  - `local-vacio-restaura-remoto`: local vacío, remoto con 165 sesiones → local queda con 165, sin PUT.
  - `conflicto-sha-fusiona-y-reintenta`: primer PUT → 409; segundo GET trae una sesión nueva remota → PUT final contiene ambas.
  - `token-invalido-no-pierde-datos`: GET → 401 → `{ok:false, motivo:'token'}`, datos locales intactos, `pendiente` sigue true.
  - `sin-red`: fetch lanza → `{ok:false, motivo:'red'}`.
  - `primer-uso-crea-archivo`: GET 404 → PUT sin sha.
- [ ] **Step 3:** FAIL. **Step 4:** Implementar. **Step 5:** PASS.
- [ ] **Step 6: Commit** `feat: sincronización con repo privado de GitHub`

---

### Task 7: Pantallas de registro (fuerza + Metcon)

**Files:**
- Create: `src/store/estado.ts`, `src/ui/Registrar.tsx`, `src/ui/FuerzaForm.tsx`, `src/ui/MetconForm.tsx`, `src/ui/componentes/{Stepper,Chips,Aviso}.tsx`
- Test: `tests/ui/Registrar.test.tsx`

**Interfaces:**
- Consumes: `generarRampa`, `parsearKg` (T2), `detectarPR`, `ejercicioSugerido`, `ultimaFuerza`, `ROTACION` (T4), `guardarSesion` (T5), `sincronizar` (T6).
- Produces: `estado` (signals de `@preact/signals`): `datos`, `ajustes`, `estadoSync: 'ok'|'pendiente'|'error'`; `registrar(s: Sesion): Promise<PR | null>` (`PR` de T4) que guarda, lanza `sincronizar()` sin esperar y devuelve el PR detectado.

Comportamiento (del spec §7.2–7.3):
- Fecha = hoy (editable); lugar chips Box/Casa (por defecto Box).
- Fuerza: ejercicio preseleccionado `ejercicioSugerido`; variante y tempo como chips, preseleccionando los de `ultimaFuerza` de ese ejercicio. Tempos: `3s+pausa`, `4s+pausa`, `sin tempo`. Variantes: `normal`, `btn`, `close grip`, `agarre medio`, `barra alta` + "otra" (texto). Stepper de serie top (paso 0,5; valor inicial = top anterior) y reps (paso 1; inicial = reps anteriores). La rampa se recalcula al cambiar top y se muestra como 5 casillas editables. Se puede quitar la fuerza (sesión solo Metcon).
- Metcon (opcional, plegado): chips de formato; el campo resultado cambia: AMRAP → `rondas` + `reps` (valor `"3+200"`); ForTime → `mm:ss`; EMOM/Intervalos → reps totales o "por bloque" (lista de números, valor `"40/51"`); Otro → texto. Duración (min), RX sí/no, equipo sí/no, descripción opcional.
- Guardar → `Aviso` "Nuevo 5RM: 96 kg (+2 kg)" si hay PR, o "Guardado"; vuelve a Inicio.

- [ ] **Step 1: Tests**
```tsx
test('preselecciona el ejercicio sugerido y genera la rampa', ...)   // con datos fixture: muestra "Press Banca" y 5 casillas
test('cambiar la serie top recalcula la rampa', ...)               // top 96 con anterior [74..94] → 76,81,86,91,96
test('AMRAP guarda resultado rondas+reps', ...)                    // rondas 3, reps 200 → metcon.resultado = {tipo:'rondas+reps', valor:'3+200'}
test('guardar sin red guarda en local y muestra Guardado', ...)    // sincronizar mock → {ok:false,motivo:'red'}
test('muestra aviso de PR', ...)
```
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: registro de fuerza y Metcon`

---

### Task 8: Importación del histórico de Notion

**Files:**
- Create: `scripts/notion/parsers.ts`, `scripts/importar-notion.ts`, `scripts/notion/export/fuerza.json`, `scripts/notion/export/sesiones.json`
- Test: `tests/scripts/parsers.test.ts`, `tests/scripts/importar.test.ts`

**Interfaces:**
- Consumes: tipos (T2).
- Produces: `npx tsx scripts/importar-notion.ts > data/entrenos.json` (se sube a `entrenos-data` en Task 10) y:
```ts
normalizarEjercicio(sel: string | null): string | null   // 'Back Squat'→'back-squat', 'SNACH'|'Snach'→'snatch', 'Puss Press'→'push-press', 'Puss ups'→'push-ups', 'Shoulder press'→'shoulder-press', 'Press Banca'→'press-banca', 'Deadlift'→'deadlift', 'Front Squat'→'front-squat', 'Clean'→'clean', 'Power Clean'→'power-clean', 'Dips'→'dips'
extraerVariante(titulo: string): string | undefined      // /btn|btw/i→'btn', /close/i→'close grip', /\bMG\b|medio|mis grip/i→'agarre medio', /h\.?\s?l\.?/i→'barra alta'
normalizarTempo(t: string | null): string | undefined    // contiene 3 o "tres" → '3s+pausa' si hay "pausa", si no '3s'; igual con 4/"cuatro"
extraerReps(titulo: string): number | null              // '5x94kg'→5, '96x8'→8, '42kg x6'→6, '100kg x4'→4 (la cifra pequeña ≤ 20 junto a la x)
parsearMetcon(texto: string): Metcon | undefined
```
- `parsearMetcon`: formato por palabra clave (`amrap`→AMRAP, `emom`→EMOM, `for time`/`21,15,9`/`\d+,\d+,\d+`→ForTime, `on.*off`/`i go you go`→Intervalos, si no Otro); duración de `\d+\s*(min|’|')`; resultado del primer paréntesis: `(\d+\+\d+)`→rondas+reps, `(\d+:\d\d)`→tiempo, `(\d+)`→reps; varios paréntesis en EMOM → bloques `"40/51"`; `descripcion` = texto sin el título "Metcom"/"Performance". Texto vacío → `undefined`.
- Origen de datos: el ejecutor genera los dos JSON con el conector de Notion: `fuerza.json` = SQL sobre `collection://8f59237c-8953-4573-9700-20edfe252e66` (todas las columnas + `Entrenamiento [DB]`); `sesiones.json` = SQL sobre `collection://ef00cbf6-ce94-4d9b-a219-1a943fe84baa` + `notion-fetch` de cada página para el cuerpo (Metcon). Las sesiones se emparejan con su fuerza por la relación; una fuerza sin sesión crea su propia sesión con su fecha.

- [ ] **Step 1: Tests parsers** con casos reales:
```ts
expect(extraerReps('Back Squad 5x94kg')).toBe(5); expect(extraerReps('Back Squad. 96x8')).toBe(8); expect(extraerReps('Shoulder press btw 42kg x6')).toBe(6);
expect(extraerVariante('Shoulder press btw 42kg x6')).toBe('btn'); expect(extraerVariante('Back Squad H.L. close 6x90')).toBe('close grip'); // close tiene prioridad sobre H.L.
expect(normalizarTempo('Cuatro segundos con pausa')).toBe('4s+pausa'); expect(normalizarTempo(',4seg.')).toBe('4s');
expect(parsearMetcon('Metcom\nAMRAP 1’ on, 1’ off 16’ (153)\n30’’ maxBack Squat 50kg\n30’’ Max burpee')).toMatchObject({ formato:'Intervalos', duracionMin:16, resultado:{tipo:'reps', valor:'153'} });
expect(parsearMetcon('Metcom\n21,15,9 (11:50)\nDealdfit 102kg\nToes2bar\nBurpees obb')?.resultado).toEqual({ tipo:'tiempo', valor:'11:50' });
expect(parsearMetcon('Performamce\nAmrap 20 min\n400m run\n30 Swim KB (16kg)\n20 burpees\nMarca (3+200)')).toMatchObject({ formato:'AMRAP', duracionMin:20, resultado:{tipo:'rondas+reps', valor:'3+200'} });  // ignora "(16kg)"
expect(parsearMetcon('Metcom\nEMOM 10’\n10Cal row\nMax burpees (40)\n\nEMOM 10’\n10Cal Bk\nMax reps KB Swim (51)')?.resultado).toEqual({ tipo:'bloques', valor:'40/51' });
expect(parsearMetcon('Metcom\n')).toBeUndefined();
```
- [ ] **Step 2:** FAIL. **Step 3:** Implementar parsers. **Step 4:** PASS.
- [ ] **Step 5:** Generar `export/*.json` con el conector de Notion. Test de importación: nº de sesiones resultante ≥ 165, todas con `fecha` válida, ninguna `fuerza` con `series` vacías, ejercicios todos en `EJERCICIOS_BASE` o `null`→ nota.
- [ ] **Step 6:** Ejecutar el script; revisar a mano 5 sesiones al azar contra Notion.
- [ ] **Step 7: Commit** `feat: importación del histórico de Notion`

---

### Task 9: Inicio, Historial y Ajustes

**Files:**
- Create: `src/ui/Inicio.tsx`, `src/ui/Historial.tsx`, `src/ui/Ajustes.tsx`
- Test: `tests/ui/Historial.test.tsx`, `tests/ui/Ajustes.test.tsx`

**Interfaces:**
- Consumes: `estado` (T7), `borrarSesion` (T5), `sincronizar` (T6).

Comportamiento:
- Inicio: botón grande "＋ Registrar"; tarjeta de la última sesión (fecha, "Back Squat 5×94", resultado Metcon); indicador de sincronización (✓ / pendiente / error con motivo).
- Historial: lista descendente por fecha, sin borradas; tocar → abre Registrar en modo edición (mismo formulario con los valores); borrar con confirmación en la propia UI (no `confirm()` nativo).
- Ajustes: campo token (tipo password) con enlace e instrucciones para crearlo (fine-grained, solo `entrenos-data`, Contents read & write); botón "Sincronizar ahora" con el resultado; "Exportar JSON" y "Exportar CSV" (una fila por serie top: fecha, ejercicio, variante, reps, kg, tempo, metcon formato, resultado), sin token.

- [ ] **Step 1: Tests**: historial ordena y oculta borradas; editar conserva el `id`; exportar JSON no contiene el token; mensaje "Sin sincronizar: revisa el token" cuando `motivo==='token'`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: inicio, historial y ajustes`

---

### Task 10: Puesta en marcha

- [ ] **Step 1:** Crear repo público `ichaoart-cmd/entrenos-app`, subir código, activar Pages (fuente: GitHub Actions). Verificar que `https://ichaoart-cmd.github.io/entrenos-app/` carga y el manifest es válido (Lighthouse PWA "installable").
- [ ] **Step 2:** Crear repo privado `ichaoart-cmd/entrenos-data` con `data/entrenos.json` (salida de Task 8) y un README de una línea.
- [ ] **Step 3:** Guiar al usuario para crear el token fine-grained (solo `entrenos-data`, Contents read & write, caducidad 1 año) y pegarlo en Ajustes desde el móvil.
- [ ] **Step 4:** Verificación con el usuario en su móvil: instalar en pantalla de inicio; ver el histórico; registrar una sesión en modo avión; volver a conectar → aparece commit en `entrenos-data`.
- [ ] **Step 5:** Commit final y nota de cambios en el proyecto.
