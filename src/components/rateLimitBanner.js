// src/components/rateLimitBanner.js
//
// Banner global, fijo en la parte superior, que muestra el countdown visible
// exigido específicamente para el error 429 (sección 1.5). Se reutiliza
// también para 500 / fallos de red, aunque ahí el enunciado no lo exige.
// Nunca es un alert(): es un elemento normal del DOM.

const banner = document.getElementById('rate-limit-banner');

export function updateRateLimitBanner({ secondsLeft, attempt, maxAttempts, status, done }) {
  if (done) {
    hideRateLimitBanner();
    return;
  }

  const reason = status === 429 ? 'Límite de tasa (429) alcanzado' : 'Error de servidor (500 / red)';

  banner.hidden = false;
  banner.textContent = `${reason}. Reintentando en ${secondsLeft}s (intento ${attempt} de ${maxAttempts})…`;
  banner.classList.toggle('rate-limit-banner--warning', status === 429);
  banner.classList.toggle('rate-limit-banner--danger', status !== 429);
}

export function hideRateLimitBanner() {
  banner.hidden = true;
  banner.textContent = '';
}
