# Laboratorio #2 — Mundial 26 Suite (Simuladores y Manejo de Estado)

**Curso:** ISW-521 Programación en Ambiente Web I
**Universidad:** Universidad Técnica Nacional (UTN)
**Docente:** Bryan Miguel Chaves Salas

## 📋 Descripción

Suite de 5 simuladores del Mundial 2026, construida con **Vite + JavaScript
vanilla** (sin frameworks), que consume la API pública `https://worldcup26.ir`
con autenticación JWT real. Incluye registro/login contra la API, un panel de
Inicio con datos reales del torneo (próximos partidos, resultados, los 48
equipos), y una **arquitectura de resiliencia** compartida por los 5
subproyectos: reintentos con backoff exponencial, caché offline, y manejo de
sesión expirada sin recargar la página.

## 🏗️ Estructura del proyecto

```
mundial26-suite/
├── index.html
├── vite.config.js        # proxy de desarrollo (evita bloqueo CORS de la API)
├── README.md
└── src/
    ├── main.js            # composición raíz
    ├── router.js          # enrutador por hash, sin recargas
    ├── style.css
    ├── theme.js           # color/ícono por subproyecto + colores por grupo real
    ├── api/
    │   ├── httpClient.js  # ApiClient: JWT, 401/429/500, backoff, caché
    │   ├── cacheStore.js  # wrapper de localStorage (modo offline)
    │   ├── authService.js # registro / login / logout
    │   └── worldCupApi.js # getTeams / getGames / getGroups / getTeamByName
    ├── utils/
    │   ├── debounce.js    # debounce por closures
    │   ├── fisherYates.js # algoritmo Fisher-Yates + reparto en grupos
    │   └── format.js      # sumas de goles, fechas, isTrue(), etc.
    ├── components/
    │   ├── icons.js          # íconos SVG compartidos (Lucide, licencia ISC)
    │   ├── appShell.js       # menú horizontal + barra superior persistentes
    │   ├── modal.js          # modal de "sesión expirada"
    │   ├── rateLimitBanner.js # countdown visible (429/500)
    │   └── staleBadge.js     # insignia "datos no actualizados"
    └── views/
        ├── loginView.js             # login + registro
        ├── menuView.js               # Inicio: partidos y equipos reales
        ├── dreamTeamView.js          # 2.1 Creador de Dream Team
        ├── headToHeadView.js         # 2.2 Buscador Cara a Cara
        ├── surpriseTrackerView.js    # 2.3 Seguidor de Sorpresas
        ├── quinielaView.js           # 2.4 Quiniela Local
        └── drawView.js               # 2.5 Simulador de Sorteo Loco
```

## ✅ Requerimientos técnicos cumplidos

**Autenticación**
- Registro y login reales contra la API (`POST /auth/register`, `POST /auth/authenticate`)
- Token JWT en `localStorage`, agregado como `Authorization: Bearer` en cada petición
- Sesión persiste al recargar la página

**Arquitectura de resiliencia (compartida por los 5 subproyectos)**
- `async/await` exclusivo — sin un solo `.then()`/`.catch()` en todo el proyecto
- 401 → cierra sesión y muestra un modal, sin `window.location.reload()`
- 429 / 500 → backoff exponencial (1s, 2s, 4s, 8s) con countdown visible
- Modo offline: última respuesta exitosa de cada endpoint queda cacheada en `localStorage`

**JavaScript ES6+**
- Clases con campos privados (`#token`) y miembros `static`
- `extends Error` para errores personalizados (`ApiClientError`, `SessionExpiredError`)
- Closures (debounce), arrow functions, `this` léxico
- Destructuring, spread/rest, optional chaining `?.`, nullish coalescing `??`
- Módulos ES nativos (`import`/`export`) servidos por Vite

**Los 5 subproyectos**
- ✅ 2.1 Creador de Dream Team — selección de 11 equipos + cálculo de goles a favor
- ✅ 2.2 Buscador Cara a Cara — debounce + autocompletado + `Promise.all`
- ✅ 2.3 Seguidor de Sorpresas — polling configurable + alertas visuales + favoritos
- ✅ 2.4 Quiniela Local — predicciones persistentes + comparación contra el resultado real
- ✅ 2.5 Simulador de Sorteo Loco — Fisher-Yates + 12 grupos ficticios

## 📱 Responsividad

| Dispositivo | Comportamiento |
|---|---|
| Escritorio (> 780px) | Menú horizontal completo con texto, grillas en varias columnas |
| Tablet / Móvil (≤ 780px) | Menú se compacta a solo íconos, contenido en una columna, fondo decorativo del login se oculta |

## 🎨 Sistema de diseño

Variables CSS en `:root` (`src/style.css`):

```
--color-bg        /* Gris claro de fondo */
--color-primary   /* Verde cancha */
--color-accent    /* Índigo — enlaces y foco */
--color-warning   /* Ámbar — marca / alertas */
--color-danger    /* Rojo — errores */
```

Cada subproyecto tiene su propio color de acento (`⚽` verde, `🔍` azul, `🚨`
naranja, `🎯` dorado, `🎲` morado — ver `theme.js`), y cada grupo real del
Mundial (A-L) tiene un color fijo para identificar equipos del mismo grupo de
un vistazo en el Buscador Cara a Cara.

## 🚀 Cómo ejecutar

```bash
npm install
npm run dev
```

No hay ninguna cuenta preexistente: use **"Crear cuenta"** la primera vez
para registrarse contra la API real. El proxy de Vite (`vite.config.js`)
reenvía las peticiones a `https://worldcup26.ir` automáticamente en
desarrollo, para evitar un bloqueo de CORS del lado de la API.

## 🔍 Funcionalidades por subproyecto

- **Dream Team** — buscador con lista completa de los 48 equipos, límite de
  11 selecciones, goles calculados desde `/get/games`; si el cálculo falla
  sin caché disponible, el equipo queda marcado "pendiente" sin romper el total.
- **Cara a Cara** — dos columnas con lista explorable + debounce (300-500ms)
  contra `/get/team/?name=`; si una de las dos búsquedas en paralelo falla,
  la otra columna se muestra completa igual.
- **Seguidor de Sorpresas** — marcar equipos favoritos, polling con intervalo
  configurable, alerta visual (parpadeo) cuando el favorito va perdiendo, y
  botón para limpiar los favoritos guardados.
- **Quiniela Local** — predicciones guardadas en `localStorage`, visibles de
  inmediato aunque la API esté caída, comparadas contra el resultado real
  cuando el partido finaliza; botón para limpiar todas las predicciones.
- **Sorteo Loco** — trae los 48 equipos una sola vez, los reparte con
  Fisher-Yates en 12 grupos ficticios, y "Repetir sorteo" no vuelve a llamar
  la API.

## 🧪 Cómo probar los errores de red (401 / 429 / 500) desde DevTools

Esta app no trae un botón para fingir errores — se reproducen condiciones
reales desde el inspector del navegador:

- **401**: DevTools → Application → Local Storage → editar el `token` dentro
  de `wc26_session` → recargar (F5) → entrar a cualquier subproyecto.
- **429**: en la pestaña Console, con sesión iniciada: `for (let i = 0; i < 150; i++) fetch('/wc26-api/get/teams');`
- **500 / fallo de red**: DevTools → Network → Request blocking → bloquear
  `**/wc26-api/*` → recargar datos dentro de un subproyecto.

## 📚 Tecnologías

| Tecnología | Uso |
|---|---|
| Vite | Bundler, servidor de desarrollo, proxy CORS |
| JavaScript ES6+ | Clases, closures, módulos, `fetch`, `localStorage` |
| CSS3 | Variables, Flexbox, Grid, animaciones |
| API pública `worldcup26.ir` | Datos reales del Mundial 2026 (JWT) |
| Lucide (SVG, licencia ISC) | Íconos de la interfaz |

Laboratorio desarrollado para el curso ISW-521 — UTN Sede San Carlos.
