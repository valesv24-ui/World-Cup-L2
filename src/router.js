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

  if (!requiresAuth) {
    unmountAppShell();
    appContainer.innerHTML = '';
    const cleanup = await view(appContainer, appContext);
    currentCleanup = typeof cleanup === 'function' ? cleanup : null;
    return;
  }

  const shell = getShellRefs() ?? mountAppShell(appContainer, appContext);
  const theme = themeFor(hash);
  shell.setActive(hash);
  shell.setHeader(theme.label, theme.description);

  shell.contentSlot.innerHTML = '';
  const cleanup = await view(shell.contentSlot, appContext);
  currentCleanup = typeof cleanup === 'function' ? cleanup : null;
}

export function startRouter() {
  window.addEventListener('hashchange', renderCurrentRoute);
  renderCurrentRoute();
}
