// src/api/authService.js
//
// Como no existe ninguna cuenta previa contra la API pública del Mundial,
// esta capa permite CREAR una cuenta (POST /auth/register) o iniciar
// sesión con una ya creada (POST /auth/authenticate), y persiste la sesión
// (token + usuario) en localStorage para no perderla al refrescar.
//
// Clase #13, Tema 2.4: campo privado real (#token) — nadie fuera de la
// clase puede leerlo ni modificarlo directamente, ni siquiera vía
// console.log(authService).

import { API_BASE_URL } from './httpClient.js';

const SESSION_KEY = 'wc26_session';

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export class AuthService {
  #client;
  #token = null;
  #user = null;

  constructor(client) {
    this.#client = client;
    this.#restoreSession();
  }

  get isAuthenticated() {
    return this.#token !== null;
  }

  get currentUser() {
    return this.#user;
  }

  #restoreSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const { token, user } = JSON.parse(raw);
      this.#token = token;
      this.#user = user;
      this.#client.setToken(token);
    } catch {
      // Sesión corrupta en localStorage: se ignora, el usuario simplemente
      // deberá iniciar sesión de nuevo.
      localStorage.removeItem(SESSION_KEY);
    }
  }

  async register({ name, email, password }) {
    return this.#authRequest('/auth/register', { name, email, password }, 'No se pudo crear la cuenta');
  }

  async login({ email, password }) {
    return this.#authRequest('/auth/authenticate', { email, password }, 'No se pudo iniciar sesión');
  }

  async #authRequest(path, body, defaultMessage) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new AuthError('No se pudo contactar la API. Revise su conexión.', 0);
    }

    const payload = await this.#safeJson(response);

    if (!response.ok) {
      throw new AuthError(payload?.message ?? defaultMessage, response.status);
    }

    this.#persistSession(payload);
    return payload.user;
  }

  logout() {
    this.#token = null;
    this.#user = null;
    localStorage.removeItem(SESSION_KEY);
    this.#client.clearToken();
  }

  #persistSession({ token, user }) {
    this.#token = token;
    this.#user = user;
    this.#client.setToken(token);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
    } catch {
      // Si localStorage falla, la sesión sigue viva en memoria durante
      // esta pestaña, solo no sobrevive a un refresh.
    }
  }

  async #safeJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}
