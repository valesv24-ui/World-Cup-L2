// src/api/httpClient.js
//
// Motor de resiliencia de la aplicación. Todo el consumo de la API pública
// del Mundial 2026 (https://worldcup26.ir) pasa por aquí.
//
// Trazabilidad a clases:
// - Clase #13 (Temas 1-2): clases ES6+, campos privados (#), miembros static,
//   herencia con "extends Error" para errores personalizados.
// - Clase #11 Parte 1 (Tema 2): closures — sleep() y el bucle de reintentos
//   dependen de que la función interna recuerde el "attempt" entre esperas.
// - Clase #10: fetch() y localStorage son APIs del entorno, no ECMAScript puro.

import { CacheStore } from './cacheStore.js';

// En desarrollo, todas las peticiones pasan por el proxy de Vite
// (ver vite.config.js) para evitar que el navegador bloquee las
// respuestas de https://worldcup26.ir por CORS. En una build de
// producción sin ese proxy disponible, se usaría la URL real.
export const API_BASE_URL = import.meta.env.DEV ? '/wc26-api' : 'https://worldcup26.ir';

const MAX_RETRIES = 4; // 1s, 2s, 4s, 8s
const BASE_DELAY_MS = 1000;

/**
 * Error base para cualquier fallo de la capa HTTP.
 * "class ApiClientError extends Error" — patrón visto en Clase #13, Tema 2.3
 * (herencia estructural con extends/super), igual que "class ValidationError
 * extends Error" mencionado como patrón estándar de Node.js.
 */
export class ApiClientError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

/** Error específico para un 401: la sesión ya no es válida. */
export class SessionExpiredError extends ApiClientError {
  constructor() {
    super('La sesión expiró o el token es inválido', 401, null);
    this.name = 'SessionExpiredError';
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Cliente HTTP con:
 *  - Encabezado Authorization: Bearer <token> automático.
 *  - async/await exclusivo (ningún .then/.catch en todo el archivo).
 *  - Backoff exponencial ante 429/500, con countdown visible para 429.
 *  - Caché en localStorage con datos "stale" si la petición final falla.
 *  - Un solo canal para detectar 401 y notificar a quien escucha (sin
 *    window.location.reload() en ningún punto).
 */
export class ApiClient {
  #token = null;
  #onSessionExpired;
  #onRateLimitTick;

  constructor({ onSessionExpired, onRateLimitTick } = {}) {
    this.#onSessionExpired = onSessionExpired ?? (() => {});
    this.#onRateLimitTick = onRateLimitTick ?? (() => {});
  }

  setToken(token) {
    this.#token = token;
  }

  clearToken() {
    this.#token = null;
  }

  get hasToken() {
    return this.#token !== null;
  }

  async get(path, { cacheKey = path, useCache = true } = {}) {
    return this.#requestWithResilience(path, { cacheKey, useCache });
  }

  async #requestWithResilience(path, { cacheKey, useCache }) {
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const data = await this.#singleAttempt(path);
        if (useCache) CacheStore.save(cacheKey, data);
        return { data, stale: false, cachedAt: null };
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          this.#onSessionExpired();
          throw error;
        }

        const isRetryable = error.status === 500 || error.status === 429;
        if (isRetryable && attempt < MAX_RETRIES) {
          const waitMs = BASE_DELAY_MS * 2 ** attempt;
          await this.#waitWithCountdown(waitMs, attempt + 1, error.status);
          attempt += 1;
          continue;
        }

        if (useCache) {
          const cached = CacheStore.read(cacheKey);
          if (cached) {
            return { data: cached.data, stale: true, cachedAt: cached.timestamp };
          }
        }

        throw error;
      }
    }
  }

  /**
   * Espera "waitMs" milisegundos. Si el motivo es 429, publica un countdown
   * en segundos visible en la UI (banner global). Para 500 también se
   * muestra, aunque el enunciado solo lo exige para 429.
   */
  async #waitWithCountdown(waitMs, attempt, status) {
    const totalSeconds = Math.ceil(waitMs / 1000);
    for (let secondsLeft = totalSeconds; secondsLeft > 0; secondsLeft -= 1) {
      this.#onRateLimitTick({ secondsLeft, attempt, maxAttempts: MAX_RETRIES, status });
      await sleep(1000);
    }
    this.#onRateLimitTick({ secondsLeft: 0, attempt, maxAttempts: MAX_RETRIES, status, done: true });
  }

  async #singleAttempt(path) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.#token) {
      headers.Authorization = `Bearer ${this.#token}`;
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { method: 'GET', headers });
    } catch {
      // Fallo de red real (offline, DNS, bloqueo en DevTools, CORS...).
      // Se trata igual que un 500: es candidato a backoff exponencial.
      throw new ApiClientError('No se pudo contactar la API (red)', 500, null);
    }

    if (response.status === 401) {
      throw new SessionExpiredError();
    }

    if (!response.ok) {
      const payload = await this.#safeJson(response);
      throw new ApiClientError(`La API respondió ${response.status}`, response.status, payload);
    }

    return response.json();
  }

  async #safeJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}
