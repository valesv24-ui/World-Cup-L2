// src/components/a11yPanel.js
//
// Accesibilidad: tema oscuro/claro, tamaño de letra, y alto contraste.
// Las tres preferencias se guardan en localStorage y se aplican sobre
// <html>, así que funcionan igual en el login (antes de iniciar sesión)
// y en el resto de la app. Esto reutiliza la misma idea de Web Storage
// del Laboratorio #1 (localStorage para tema/tamaño de fuente/contraste),
// pero adaptada a este proyecto.

const STORAGE_KEY = 'wc26_a11y_prefs';
const FONT_SCALES = [100, 115, 130];
const DEFAULT_PREFS = { theme: 'light', fontScaleIndex: 0, highContrast: false };

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Si falla, las preferencias solo duran esta sesión en memoria.
  }
}

/**
 * Aplica las preferencias actuales sobre <html>. Se llama una vez al
 * arrancar la app (para que no haya "parpadeo" de tema equivocado) y cada
 * vez que el usuario cambia algo en el panel.
 */
export function applyA11yPrefs(prefs) {
  const root = document.documentElement;
  root.classList.toggle('dark', prefs.theme === 'dark');
  root.classList.toggle('high-contrast', prefs.highContrast);
  root.style.fontSize = `${FONT_SCALES[prefs.fontScaleIndex] ?? 100}%`;
}

export function initA11y() {
  const prefs = loadPrefs();
  applyA11yPrefs(prefs);
  return prefs;
}

/**
 * Monta el botón + panel desplegable de accesibilidad dentro de `root`.
 * Se puede montar tanto en la barra superior de la app (ya con sesión)
 * como en la pantalla de login (sin sesión).
 */
export function mountA11yControl(root) {
  let prefs = loadPrefs();

  root.innerHTML = `
    <div class="a11y-menu">
      <button type="button" class="a11y-button" id="a11y-button" aria-haspopup="true" aria-expanded="false" title="Accesibilidad">
        <span aria-hidden="true">Aa</span>
      </button>
      <div class="a11y-dropdown" id="a11y-dropdown" hidden role="menu">
        <p class="a11y-dropdown__title">Accesibilidad</p>

        <div class="a11y-row">
          <span>Tamaño de letra</span>
          <div class="a11y-row__buttons">
            <button type="button" class="a11y-mini-btn" data-action="font-smaller" aria-label="Reducir tamaño de letra">A−</button>
            <button type="button" class="a11y-mini-btn" data-action="font-reset" aria-label="Tamaño de letra normal">A</button>
            <button type="button" class="a11y-mini-btn" data-action="font-bigger" aria-label="Aumentar tamaño de letra">A+</button>
          </div>
        </div>

        <div class="a11y-row">
          <span>Tema</span>
          <div class="a11y-row__buttons">
            <button type="button" class="a11y-mini-btn" data-action="theme-light" aria-label="Tema claro">☀️</button>
            <button type="button" class="a11y-mini-btn" data-action="theme-dark" aria-label="Tema oscuro">🌙</button>
          </div>
        </div>

        <label class="a11y-toggle">
          <input type="checkbox" id="a11y-contrast">
          Alto contraste
        </label>
      </div>
    </div>
  `;

  const button = root.querySelector('#a11y-button');
  const dropdown = root.querySelector('#a11y-dropdown');
  const contrastCheckbox = root.querySelector('#a11y-contrast');

  function refreshControlsFromPrefs() {
    contrastCheckbox.checked = prefs.highContrast;
    root.querySelectorAll('[data-action^="theme-"]').forEach((btn) => {
      const isActive = btn.dataset.action === `theme-${prefs.theme}`;
      btn.classList.toggle('a11y-mini-btn--active', isActive);
    });
  }

  function update(partial) {
    prefs = { ...prefs, ...partial };
    savePrefs(prefs);
    applyA11yPrefs(prefs);
    refreshControlsFromPrefs();
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
    button.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.hidden && !dropdown.contains(event.target) && event.target !== button) {
      dropdown.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    }
  });

  root.querySelector('[data-action="font-smaller"]').addEventListener('click', () => {
    update({ fontScaleIndex: Math.max(0, prefs.fontScaleIndex - 1) });
  });
  root.querySelector('[data-action="font-reset"]').addEventListener('click', () => {
    update({ fontScaleIndex: 0 });
  });
  root.querySelector('[data-action="font-bigger"]').addEventListener('click', () => {
    update({ fontScaleIndex: Math.min(FONT_SCALES.length - 1, prefs.fontScaleIndex + 1) });
  });
  root.querySelector('[data-action="theme-light"]').addEventListener('click', () => update({ theme: 'light' }));
  root.querySelector('[data-action="theme-dark"]').addEventListener('click', () => update({ theme: 'dark' }));
  contrastCheckbox.addEventListener('change', () => update({ highContrast: contrastCheckbox.checked }));

  refreshControlsFromPrefs();
}
