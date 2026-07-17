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
├── vite.config.js        # proxy de desarrollo (CORS) + inyección de fallos 401/429/500
├── README.md
├── public/
│   └── robots.txt
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
    │   └── format.js      # sumas de goles, fechas, isTrue(), escapeHtml()
    ├── components/
    │   ├── icons.js          # íconos SVG compartidos (Lucide, licencia ISC)
    │   ├── appShell.js       # menú horizontal + barra superior persistentes
    │   ├── a11yPanel.js      # tema claro/oscuro, tamaño de letra, alto contraste
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
- Al crear la cuenta: checklist en vivo de 3 requisitos (mínimo 8
  caracteres, una mayúscula, un número) que se marcan con ✓ a medida que
  se escribe, más campo de confirmación — el registro no se envía hasta
  que los tres estén cumplidos y las contraseñas coincidan

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
| Tablet / Móvil (≤ 780px) | La barra superior pasa a dos filas: logo + accesibilidad + perfil arriba, y los 6 accesos (con solo ícono, sin texto) en su propia fila con ancho completo debajo; el fondo decorativo del login (balones, patrón, vista previa borrosa) se oculta |

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
un vistazo en el Buscador Cara a Cara. Ese mismo color de acento tiñe
suavemente el fondo de cada subproyecto (`--accent-soft`, en
`.content-panel::before`), y un patrón decorativo (balones, estrellas,
trofeo, dibujados en SVG/CSS, sin ninguna imagen externa) corre por debajo
de toda la app. En el login, ese fondo incluye además dos balones giratorios
y, al iniciar sesión con éxito, un pequeño estallido de confetti (también
generado con CSS/JS, sin imágenes) antes de entrar al dashboard.

## ♿ Accesibilidad

Un análisis con Lighthouse detectó que `--color-text-muted` y
`--color-warning-text` no llegaban al contraste mínimo de WCAG AA (4.5:1)
cuando el texto queda directamente sobre el fondo de la página (sí
pasaban sobre las tarjetas blancas, pero no sobre el gris del fondo). Se
verificó con la fórmula de luminancia relativa de WCAG y se oscurecieron
ambos colores — ahora dan 6.7:1 y 6.3:1 respectivamente contra el fondo,
bien por encima del mínimo, y siguen dando buen contraste sobre blanco.

Botón "Aa" en la barra superior (y también en el login, arriba a la
derecha) que abre un panel con tres controles, todos persistentes en
`localStorage` (`wc26_a11y_prefs`) — mismo patrón de Web Storage del
Laboratorio #1, adaptado a este proyecto:

- **Tamaño de letra** — 3 niveles (100% / 115% / 130%). Como toda la hoja
  de estilos usa `rem`, cambiar el `font-size` de `<html>` escala
  proporcionalmente toda la interfaz, no solo el texto.
- **Tema claro / oscuro** — redefine las variables CSS de color en
  `html.dark`; como el resto de la hoja de estilos ya usa esas variables
  en vez de colores sueltos, el resto de la app cambia solo.
- **Alto contraste** (WCAG AAA, amarillo sobre negro) — además de las
  variables, apaga los patrones decorativos de baja opacidad, que solo
  restan legibilidad.

Las preferencias se aplican en `main.js` ANTES de renderizar nada
(`initA11y()`), para que no haya parpadeo del tema por defecto al cargar.

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

## 🧭 Enrutador: navegar mientras una vista todavía está cargando

Cada vista es `async` y suele empezar con un `await` a la API antes de
tocar el DOM. Si el usuario cambia de pantalla ANTES de que esa petición
responda, el enrutador ya reemplazó el contenido por la vista nueva — y
sin protección, la vista vieja seguiría ejecutándose después de su
`await` e intentaría buscar elementos que ya no existen
(`Cannot read properties of null (reading 'addEventListener')`).

`router.js` lleva un número de generación que se incrementa en cada
navegación. Cada vista recibe una función `isStale()` en su contexto; si
al terminar su `await` la generación ya cambió, la vista simplemente
retorna sin tocar el DOM (y si de todos modos alcanzó a devolver una
función de limpieza — por ejemplo el polling de Seguidor de Sorpresas—,
el enrutador la ejecuta de inmediato en vez de dejarla corriendo
huérfana). Se verificó con una prueba que simula justo esa carrera
(navegar a otra pantalla mientras `/get/teams` todavía no responde): cero
errores, y la pantalla final es la correcta.

## 🛡️ Protección contra XSS

El ataque que más le compete a una SPA como esta (sin backend propio) es
**Cross-Site Scripting (XSS)**: la app renderiza, en 5 subproyectos
distintos, nombres de equipo, etiquetas de partido y URLs de bandera que
vienen de una API externa — y esos datos no son 100% confiables por
definición, así que se tratan siempre como texto, nunca como HTML válido.

- `escapeHtml()` vive en un solo lugar (`src/utils/format.js`) y lo
  importan los 6 archivos que renderizan datos externos, en vez de tener
  6 copias sueltas que se podrían desincronizar.
- Escapa `&`, `<`, `>`, `"` y `'` — las comillas importan porque varias
  banderas se insertan dentro de un atributo (`src="${...}"`), y una
  comilla sin escapar ahí alcanza para "salirse" del atributo e inyectar
  un manejador de evento (`onerror="..."`) sin necesidad de ningún
  `<script>` literal.
- Se verificó con una prueba real: se simuló una respuesta de API con un
  nombre de equipo conteniendo `<script>` y una bandera diseñada para
  romper el atributo `src`, y en ningún caso se ejecutó código.
- El único campo de **entrada del propio usuario** que se muestra en
  pantalla (el nombre elegido al registrarse) también pasa por
  `escapeHtml()` en el saludo de Inicio, o se inserta con `textContent`
  (que nunca interpreta HTML) en el menú de perfil — cualquiera de los
  dos caminos es seguro.
- CSRF no aplica a esta arquitectura: la API usa un token JWT que viaje
  en el encabezado `Authorization`, no en una cookie — un sitio malicioso
  no puede forzar al navegador a adjuntar ese encabezado automáticamente,
  a diferencia de lo que sí pasaría con credenciales basadas en cookies.

## 🧪 Cómo probar los errores de red (401 / 429 / 500) desde DevTools

Esta app no trae ningún botón para fingir errores dentro de su propio
código — pero el proxy de desarrollo de `vite.config.js` sí incluye un
interruptor de fallos pensado exactamente para esto. Vive en
`vite.config.js` (nunca se empaqueta en producción) y solo responde a una
señal que se manda a mano desde el inspector, nunca por sí solo:

- En la pestaña **Console** de DevTools, con sesión iniciada, pegue
  cualquiera de estos (cambia solo el número al final):
  ```js
  fetch('/wc26-api/get/teams?__force=401');
  fetch('/wc26-api/get/teams?__force=429');
  fetch('/wc26-api/get/teams?__force=500');
  ```
- El servidor de Vite responde de inmediato con ese código de estado real
  (visible en la pestaña Network, con cuerpo JSON incluido) sin haber
  tocado siquiera a `worldcup26.ir` — así que funciona igual sin importar
  si la API real está arriba o no en ese momento.
- Después de eso, entre a cualquier subproyecto (o dispare de nuevo la
  petición real de esa vista): como `ApiClient` no distingue entre un 401
  "real" y uno inyectado por el proxy, el modal de sesión expirada o el
  backoff con countdown se activan exactamente igual.

Alternativas igual de válidas, sin depender del proxy (por si se quiere
demostrar la condición contra la API real de verdad):

- **401 real**: DevTools → Application → Local Storage → editar el `token`
  dentro de `wc26_session` → recargar (F5) → entrar a cualquier subproyecto.
- **429 real**: en la pestaña Console, con sesión iniciada:
  `for (let i = 0; i < 150; i++) fetch('/wc26-api/get/teams');`
- **500 / fallo de red real**: DevTools → Network → Request blocking →
  bloquear `**/wc26-api/*` → recargar datos dentro de un subproyecto.

## 📚 Tecnologías

| Tecnología | Uso |
|---|---|
| Vite | Bundler, servidor de desarrollo, proxy CORS |
| JavaScript ES6+ | Clases, closures, módulos, `fetch`, `localStorage` |
| CSS3 | Variables, Flexbox, Grid, animaciones |
| API pública `worldcup26.ir` | Datos reales del Mundial 2026 (JWT) |
| Lucide (SVG, licencia ISC) | Íconos de la interfaz |

Laboratorio desarrollado para el curso ISW-521 — UTN Sede San Carlos.
