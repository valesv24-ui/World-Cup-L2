// src/components/appShell.js
//
// Shell persistente de la aplicación: barra de navegación HORIZONTAL
// arriba + una segunda franja con el título de la sección activa. Antes
// cada vista era una página completa con su propio botón "volver al
// menú"; ahora la navegación vive en un solo lugar (la barra superior) y
// las vistas solo llenan el panel de contenido, igual que un dashboard
// real.

import { PROJECT_THEME, HOME_THEME } from '../theme.js';
import { ICONS } from './icons.js';

const NAV_ITEMS = [
  { hash: '#/menu', label: 'Inicio', icon: HOME_THEME.icon },
  ...Object.entries(PROJECT_THEME).map(([hash, theme]) => ({ hash, label: theme.label, icon: theme.icon })),
];

let shellRefs = null;

export function mountAppShell(root, { authService, navigateTo }) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="app-topnav">
        <div class="app-topnav__brand">
          <span class="app-sidebar__logo">${ICONS.trophy}</span>
          <div>
            <strong>Mundial 26 Suite</strong>
            <small>Laboratorio #2 · ISW-521</small>
          </div>
        </div>

        <nav class="app-topnav__tabs">
          ${NAV_ITEMS.map(
            (item) => `
              <button type="button" class="nav-item" data-hash="${item.hash}">
                <span class="nav-item__icon">${item.icon}</span>
                <span class="nav-item__label">${item.label}</span>
              </button>
            `
          ).join('')}
        </nav>

        <div class="profile-menu">
          <button
            type="button"
            class="app-avatar"
            id="profile-button"
            aria-haspopup="true"
            aria-expanded="false"
            title="Cuenta"
          >?</button>
          <div class="profile-dropdown" id="profile-dropdown" hidden role="menu">
            <p class="profile-dropdown__name" id="profile-name">—</p>
            <p class="profile-dropdown__email" id="profile-email">—</p>
            <hr />
            <button type="button" class="profile-dropdown__logout" data-action="logout" role="menuitem">
              <span class="app-sidebar__logout-icon">${ICONS.logout}</span> Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div class="app-main">
        <header class="app-topbar">
          <div>
            <h1 id="topbar-title">Panel principal</h1>
            <p id="topbar-subtitle" class="app-topbar__subtitle"></p>
          </div>
        </header>
        <main class="app-content" id="content-slot"></main>
      </div>
    </div>
  `;

  const navButtons = [...root.querySelectorAll('.nav-item')];
  navButtons.forEach((button) => {
    button.addEventListener('click', () => navigateTo(button.dataset.hash));
  });

  function performLogout() {
    authService.logout();
    navigateTo('#/login');
  }

  root.querySelectorAll('[data-action="logout"]').forEach((button) => {
    button.addEventListener('click', performLogout);
  });

  const user = authService.currentUser;
  const displayName = (user?.name ?? 'Sin nombre').trim();
  const initial = displayName.charAt(0).toUpperCase() || '?';
  const profileButton = root.querySelector('#profile-button');
  const profileDropdown = root.querySelector('#profile-dropdown');
  profileButton.textContent = initial;
  root.querySelector('#profile-name').textContent = displayName;
  root.querySelector('#profile-email').textContent = user?.email ?? 'Sin correo registrado';

  profileButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !profileDropdown.hidden;
    profileDropdown.hidden = isOpen;
    profileButton.setAttribute('aria-expanded', String(!isOpen));
  });

  shellRefs = {
    contentSlot: root.querySelector('#content-slot'),
    profileButton,
    profileDropdown,
    setActive(hash) {
      navButtons.forEach((button) => {
        button.classList.toggle('nav-item--active', button.dataset.hash === hash);
      });
    },
    setHeader(title, subtitle) {
      root.querySelector('#topbar-title').textContent = title;
      root.querySelector('#topbar-subtitle').textContent = subtitle ?? '';
    },
  };

  return shellRefs;
}

// Estos dos listeners se registran UNA sola vez a nivel de módulo (no
// dentro de mountAppShell) para no acumular listeners duplicados en
// `document` si el usuario cierra sesión y vuelve a entrar varias veces
// en la misma pestaña. Siempre consultan el shell activo vía shellRefs.
function closeProfileMenuIfOpen() {
  if (!shellRefs?.profileDropdown || shellRefs.profileDropdown.hidden) return;
  shellRefs.profileDropdown.hidden = true;
  shellRefs.profileButton?.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', (event) => {
  if (!shellRefs?.profileDropdown || shellRefs.profileDropdown.hidden) return;
  const clickedInsideDropdown = shellRefs.profileDropdown.contains(event.target);
  const clickedButton = event.target === shellRefs.profileButton;
  if (!clickedInsideDropdown && !clickedButton) {
    closeProfileMenuIfOpen();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeProfileMenuIfOpen();
});

export function getShellRefs() {
  return shellRefs;
}

export function unmountAppShell() {
  shellRefs = null;
}
