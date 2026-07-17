// src/router.js
//
// Enrutador mínimo basado en location.hash. Cada vista es una función
// async (container, context) => cleanupFn|void. Al cambiar de ruta se
// invoca el cleanup de la vista anterior (importante para detener el
// polling del Seguidor de Sorpresas, por ejemplo) y jamás se recarga la
// página: la navegación es puro DOM + hashchange.
//
// Las rutas autenticadas se renderizan DENTRO del shell persistente
// (barra lateral + barra superior, ver components/appShell.js); el shell
// se monta una sola vez y solo se reemplaza el panel de contenido al
// cambiar de sección. La ruta de login es la única que no usa shell.

import { mountAppShell, getShellRefs, unmountAppShell } from './components/appShell.js';
import { themeFor } from './theme.js';

const routes = new Map();
let currentCleanup = null;
let appContext = null;
let appContainer = null;

// Cada llamada a renderCurrentRoute() "reclama" un número de generación
// nuevo. Si el usuario navega otra vez mientras una vista todavía está
// esperando datos (por ejemplo, a mitad de un await a la API), la
// generación cambia; cuando esa vista vieja por fin resuelve su promesa,
// compara su número contra el actual y, si ya no coincide, se sabe stale
// y no debe tocar el DOM (que para entonces ya pertenece a otra vista).
let renderGeneration = 0;

export function registerRoute(hash, viewFn) {
  routes.set(hash, viewFn);
}

export function setAppContext(context, container) {
  appContext = context;
  appContainer = container;
}

export function navigateTo(hash) {
  if (location.hash === hash) {
    renderCurrentRoute();
  } else {
    location.hash = hash;
  }
}

async function renderCurrentRoute() {
  const myGeneration = ++renderGeneration;
  const isStale = () => myGeneration !== renderGeneration;

  const hash = location.hash || '#/menu';
  const requiresAuth = hash !== '#/login';

  if (requiresAuth && !appContext.authService.isAuthenticated) {
    unmountAppShell();
    location.hash = '#/login';
    return;
  }

  if (typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  const view = routes.get(hash) ?? routes.get('#/menu');
  const viewContext = { ...appContext, isStale };

  if (!requiresAuth) {
    unmountAppShell();
    appContainer.innerHTML = '';
    const cleanup = await view(appContainer, viewContext);
    applyCleanup(cleanup, isStale);
    return;
  }

  const shell = getShellRefs() ?? mountAppShell(appContainer, appContext);
  const theme = themeFor(hash);
  shell.setActive(hash);
  shell.setHeader(theme.label, theme.description);

  shell.contentSlot.innerHTML = '';
  const cleanup = await view(shell.contentSlot, viewContext);
  applyCleanup(cleanup, isStale);
}

/**
 * Si para cuando la vista terminó de cargar ya arrancó una navegación más
 * nueva, esta vista quedó "huérfana": se descarta su cleanup ejecutándolo
 * de una vez (por ejemplo, para detener un polling que alcanzó a
 * programarse) en vez de guardarlo como si fuera el activo.
 */
function applyCleanup(cleanup, isStale) {
  if (isStale()) {
    if (typeof cleanup === 'function') cleanup();
    return;
  }
  currentCleanup = typeof cleanup === 'function' ? cleanup : null;
}

export function startRouter() {
  window.addEventListener('hashchange', renderCurrentRoute);
  renderCurrentRoute();
}
