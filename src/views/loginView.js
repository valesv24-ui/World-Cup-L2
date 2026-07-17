// src/views/loginView.js
//
// Como la API no trae ninguna cuenta preexistente, esta vista ofrece
// registrarse (POST /auth/register) o iniciar sesión (POST /auth/authenticate)
// con una cuenta ya creada. Ambas terminan guardando un JWT real de
// https://worldcup26.ir a través de AuthService.
//
// Un solo formulario visible a la vez; se alterna con el enlace de abajo
// en vez de pestañas arriba, para que la pantalla se sienta como un login
// de producto real y no como un formulario de laboratorio con dos modos
// visibles al mismo tiempo.

import { ICONS } from '../components/icons.js';
import { mountA11yControl } from '../components/a11yPanel.js';

const COPY = {
  login: {
    heading: 'Bienvenido de nuevo',
    subtitle: 'Ingresá con tu cuenta para volver a tus simuladores.',
    submitLabel: 'Entrar al dashboard',
    submitLoading: 'Ingresando…',
    switchQuestion: '¿No tenés cuenta?',
    switchAction: 'Crear una',
  },
  register: {
    heading: 'Creá tu cuenta',
    subtitle: 'Se registra un usuario real contra la API pública del Mundial 2026.',
    submitLabel: 'Crear cuenta y entrar',
    submitLoading: 'Creando cuenta…',
    switchQuestion: '¿Ya tenés cuenta?',
    switchAction: 'Iniciar sesión',
  },
};

export async function renderLoginView(container, { authService, navigateTo }) {
  function mount(mode) {
    container.innerHTML = markup(mode);
    wireForm(container, mode, authService, navigateTo, mount);
    mountA11yControl(container.querySelector('#a11y-slot'));
  }
  mount('login');
}

function markup(mode) {
  const copy = COPY[mode];
  return `
    <main class="auth-screen">
      <div id="a11y-slot" class="a11y-slot--login"></div>
      <span class="auth-ball-decoration auth-ball-decoration--one" aria-hidden="true"></span>
      <span class="auth-ball-decoration auth-ball-decoration--two" aria-hidden="true"></span>

      <div class="auth-backdrop" aria-hidden="true">
        ${decorativeBackdropHtml()}
      </div>

      <div class="auth-center">
        <section class="auth-card auth-card--compact" id="auth-card">
          <div class="auth-brand">
            <span class="auth-brand__logo">${ICONS.trophy}</span>
            <div>
              <strong>Mundial 26 Suite <span class="auth-brand__ball" aria-hidden="true">⚽</span></strong>
              <small>ISW-521 · Programación Web I</small>
            </div>
          </div>

          <h2 class="auth-heading">${copy.heading}</h2>
          <p class="auth-subtitle">${copy.subtitle}</p>

          <form id="auth-form" class="auth-form" novalidate>
            <label for="auth-email" class="field-label">
              <span class="field-icon field-icon--mail">${ICONS.mail}</span>
              Correo electrónico
            </label>
            <input id="auth-email" type="email" required autocomplete="email" placeholder="nombre@correo.com" class="plain-input">

            ${
              mode === 'register'
                ? `
                  <label for="auth-name" class="field-label">
                    <span class="field-icon field-icon--user">${ICONS.user}</span>
                    Nombre completo
                  </label>
                  <input id="auth-name" type="text" required autocomplete="name" placeholder="Su nombre" class="plain-input">
                `
                : ''
            }

            <label for="auth-password" class="field-label">
              <span class="field-icon field-icon--lock">${ICONS.lock}</span>
              Contraseña
            </label>
            <div class="password-input">
              <input
                id="auth-password"
                type="password"
                required
                minlength="${mode === 'register' ? '8' : '1'}"
                autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}"
                placeholder="••••••••"
                class="plain-input"
              />
              <button type="button" class="password-input__toggle" data-action="toggle-password" aria-label="Mostrar contraseña">
                ${ICONS.eye}
              </button>
            </div>

            ${
              mode === 'register'
                ? `
                  <ul class="password-requirements" id="password-requirements">
                    <li data-check="length"><span class="password-requirements__icon"></span> Al menos 8 caracteres</li>
                    <li data-check="upper"><span class="password-requirements__icon"></span> Una letra mayúscula</li>
                    <li data-check="number"><span class="password-requirements__icon"></span> Un número</li>
                  </ul>

                  <label for="auth-password-confirm" class="field-label">
                    <span class="field-icon field-icon--lock">${ICONS.lock}</span>
                    Confirmar contraseña
                  </label>
                  <div class="password-input">
                    <input
                      id="auth-password-confirm"
                      type="password"
                      required
                      autocomplete="new-password"
                      placeholder="••••••••"
                      class="plain-input"
                    />
                    <button type="button" class="password-input__toggle" data-action="toggle-password-confirm" aria-label="Mostrar contraseña">
                      ${ICONS.eye}
                    </button>
                  </div>
                  <p class="field-hint" id="password-match-hint"></p>
                `
                : ''
            }

            <button type="submit" class="btn btn-brand btn-block" id="auth-submit">
              <span data-field="submit-label">${copy.submitLabel}</span> <span aria-hidden="true" data-field="submit-arrow">→</span>
            </button>
            <p class="form-feedback" data-feedback role="status"></p>
          </form>

          <p class="auth-switch">
            ${copy.switchQuestion} <button type="button" class="link-button" data-action="switch-mode">${copy.switchAction}</button>
          </p>

          <p class="auth-security-note">
            <span class="auth-security-note__icon">${ICONS.shield}</span>
            Tu sesión se protege con un token JWT. Nunca compartas tus credenciales.
          </p>
        </section>
      </div>
    </main>
  `;
}

/**
 * Fondo puramente decorativo: una vista previa del panel de Inicio real
 * (mismas clases CSS que menuView.js), pero con datos de relleno en vez
 * de pedirlos a la API — todavía no hay sesión iniciada, así que no tiene
 * sentido llamar al backend solo para un efecto visual. Se desenfoca con
 * CSS (`filter: blur(...)`), así que el contenido exacto no importa, solo
 * la silueta general de tarjetas y filas.
 */
function decorativeBackdropHtml() {
  const fakeMatches = ['Equipo A 2-1 Equipo B', 'Equipo C 0-0 Equipo D', 'Equipo E 3-1 Equipo F', 'Equipo G 1-2 Equipo H'];
  const fakeChipCount = 18;

  return `
    <div class="content-panel">
      <div class="home-grid">
        <section class="home-card">
          <h2>📅 Próximos partidos</h2>
          <ul class="home-match-list">
            ${fakeMatches.map((label) => `<li class="home-match-row"><span>${label}</span></li>`).join('')}
          </ul>
        </section>
        <section class="home-card">
          <h2>🏁 Resultados recientes</h2>
          <ul class="home-match-list">
            ${fakeMatches.map((label) => `<li class="home-match-row"><span>${label}</span></li>`).join('')}
          </ul>
        </section>
      </div>
      <section class="home-teams">
        <h2>🌍 Equipos clasificados</h2>
        <div class="teams-grid">
          ${Array.from({ length: fakeChipCount }, (_, i) => `<div class="team-chip"><span class="fake-flag" style="background: hsl(${(i * 47) % 360}, 65%, 55%)"></span><span>Equipo ${i + 1}</span></div>`).join('')}
        </div>
      </section>
    </div>
  `;
}

function wireForm(container, mode, authService, navigateTo, rerender) {
  const form = container.querySelector('#auth-form');
  const feedback = form.querySelector('[data-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabelEl = form.querySelector('[data-field="submit-label"]');
  const submitArrowEl = form.querySelector('[data-field="submit-arrow"]');
  const authCard = container.querySelector('#auth-card');

  container.querySelector('[data-action="switch-mode"]').addEventListener('click', () => {
    rerender(mode === 'login' ? 'register' : 'login');
  });

  const passwordInput = form.querySelector('#auth-password');
  const toggleButton = form.querySelector('[data-action="toggle-password"]');
  toggleButton.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    toggleButton.innerHTML = isHidden ? ICONS.eyeOff : ICONS.eye;
    toggleButton.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  // Seguridad al crear la cuenta: medidor de fortaleza + confirmación de
  // contraseña, solo tienen sentido (y solo existen en el markup) en modo
  // registro.
  let confirmInput = null;
  if (mode === 'register') {
    const requirementsList = form.querySelector('#password-requirements');
    const matchHint = form.querySelector('#password-match-hint');
    const toggleConfirmButton = form.querySelector('[data-action="toggle-password-confirm"]');
    confirmInput = form.querySelector('#auth-password-confirm');

    toggleConfirmButton.addEventListener('click', () => {
      const isHidden = confirmInput.type === 'password';
      confirmInput.type = isHidden ? 'text' : 'password';
      toggleConfirmButton.innerHTML = isHidden ? ICONS.eyeOff : ICONS.eye;
      toggleConfirmButton.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });

    passwordInput.addEventListener('input', () => {
      const checks = getPasswordChecks(passwordInput.value);
      Object.entries(checks).forEach(([key, met]) => {
        const item = requirementsList.querySelector(`[data-check="${key}"]`);
        item.classList.toggle('password-requirements__item--met', met);
        item.querySelector('.password-requirements__icon').innerHTML = met ? ICONS.check : '';
      });
    });

    const checkMatch = () => {
      if (!confirmInput.value) {
        matchHint.textContent = '';
        matchHint.className = 'field-hint';
        return;
      }
      const matches = confirmInput.value === passwordInput.value;
      matchHint.textContent = matches ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden';
      matchHint.className = `field-hint ${matches ? 'field-hint--ok' : 'field-hint--error'}`;
    };
    confirmInput.addEventListener('input', checkMatch);
    passwordInput.addEventListener('input', checkMatch);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.querySelector('#auth-email').value.trim();
    const password = passwordInput.value;
    const name = form.querySelector('#auth-name')?.value.trim();

    feedback.textContent = '';
    feedback.className = 'form-feedback';

    if (mode === 'register') {
      const checks = getPasswordChecks(password);
      if (!Object.values(checks).every(Boolean)) {
        feedback.textContent = 'Completá los tres requisitos de la contraseña marcados arriba.';
        feedback.classList.add('form-feedback--error');
        return;
      }
      if (password !== confirmInput.value) {
        feedback.textContent = 'Las contraseñas no coinciden.';
        feedback.classList.add('form-feedback--error');
        return;
      }
    }

    submitButton.disabled = true;
    submitLabelEl.textContent = COPY[mode].submitLoading;

    try {
      if (mode === 'register') {
        await authService.register({ name, email, password });
      } else {
        await authService.login({ email, password });
      }
      await playSuccessAnimation({ authCard, submitButton, submitLabelEl, submitArrowEl });
      navigateTo('#/menu');
    } catch (error) {
      feedback.textContent = error.message ?? 'Ocurrió un error inesperado.';
      feedback.classList.add('form-feedback--error');
      submitButton.disabled = false;
      submitLabelEl.textContent = COPY[mode].submitLabel;
    }
  });
}

/**
 * Evalúa la fortaleza de una contraseña combinando longitud y variedad de
 * categorías de caracteres (minúsculas, mayúsculas, números, símbolos).
 * No es un análisis criptográfico real — es la validación de UX razonable
 * para el registro de una cuenta de este proyecto.
 */
/**
 * Devuelve, para una contraseña dada, cuáles de los 3 requisitos visibles
 * en el checklist del registro ya se cumplen. Se usa tanto para pintar la
 * lista en vivo mientras el usuario escribe, como para bloquear el envío
 * del formulario si todavía falta alguno.
 */
function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

/**
 * Pequeña animación de éxito antes de entrar al dashboard: el botón se
 * pone verde con un check, la tarjeta completa hace un pulso suave, y
 * sale un estallido de confetti (generado con CSS/JS, sin usar ninguna
 * imagen) desde el botón. Es solo estético — la navegación real ocurre
 * después con await.
 */
function playSuccessAnimation({ authCard, submitButton, submitLabelEl, submitArrowEl }) {
  return new Promise((resolve) => {
    submitButton.classList.add('btn-brand--success');
    submitLabelEl.textContent = '¡Listo!';
    submitArrowEl.innerHTML = ICONS.check;
    authCard.classList.add('auth-card--success');
    spawnConfetti(submitButton);
    setTimeout(resolve, 650);
  });
}

/** Genera un puñado de puntos de color que salen disparados y se desvanecen. */
function spawnConfetti(anchorEl) {
  const colors = ['#22c55e', '#38bdf8', '#eab308', '#fb923c', '#a855f7'];
  const burst = document.createElement('div');
  burst.className = 'confetti-burst';

  for (let i = 0; i < 18; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'confetti-dot';
    const angle = (360 / 18) * i + (Math.random() * 18 - 9);
    const distance = 55 + Math.random() * 45;
    const radians = (angle * Math.PI) / 180;
    dot.style.setProperty('--dx', `${Math.cos(radians) * distance}px`);
    dot.style.setProperty('--dy', `${Math.sin(radians) * distance}px`);
    dot.style.background = colors[i % colors.length];
    dot.style.animationDelay = `${Math.random() * 0.08}s`;
    burst.appendChild(dot);
  }

  anchorEl.appendChild(burst);
  setTimeout(() => burst.remove(), 900);
}
