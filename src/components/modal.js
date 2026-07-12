// src/components/modal.js
//
// Modal genérico. Se usa, sobre todo, para la pantalla de "sesión expirada"
// exigida ante un 401: NUNCA se resuelve con window.location.reload(), solo
// se limpia el token y se muestra este modal con opción de reautenticarse.

const root = document.getElementById('modal-root');

export function showModal({ title, message, actionLabel, onAction }) {
  root.innerHTML = '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">${title}</h2>
      <p>${message}</p>
      <button type="button" class="btn btn-primary" data-action="modal-confirm">${actionLabel}</button>
    </div>
  `;

  overlay.querySelector('[data-action="modal-confirm"]').addEventListener('click', () => {
    hideModal();
    onAction?.();
  });

  root.appendChild(overlay);
}

export function hideModal() {
  root.innerHTML = '';
}

export function showSessionExpiredModal(onReauthenticate) {
  showModal({
    title: 'Sesión expirada',
    message:
      'El servidor respondió 401: el token ya no es válido. Su sesión se cerró de forma segura, sin recargar la página. Puede volver a iniciar sesión cuando quiera.',
    actionLabel: 'Iniciar sesión de nuevo',
    onAction: onReauthenticate,
  });
}
