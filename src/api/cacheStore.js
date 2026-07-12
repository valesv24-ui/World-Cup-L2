// src/api/cacheStore.js
//
// Envoltorio sobre localStorage para el "modo offline" exigido en la
// Arquitectura Base de Resiliencia (sección 1.5 del catálogo del proyecto).
// Guarda la última respuesta exitosa de cada endpoint junto con su
// timestamp, para poder mostrarla marcada como "no actualizada" si una
// petición nueva falla.
//
// Clase #13, Tema 2.4: miembros "static" — CacheStore no se instancia,
// funciona como una utilidad de clase, igual que Math o JSON nativos.

export class CacheStore {
  static #prefix = 'wc26_cache_';

  static save(key, data) {
    const record = { data, timestamp: Date.now() };
    try {
      localStorage.setItem(`${CacheStore.#prefix}${key}`, JSON.stringify(record));
    } catch {
      // localStorage lleno o no disponible: el cacheo es "best effort",
      // no debe romper el flujo principal de la app.
    }
  }

  static read(key) {
    try {
      const raw = localStorage.getItem(`${CacheStore.#prefix}${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static remove(key) {
    localStorage.removeItem(`${CacheStore.#prefix}${key}`);
  }

  /** Borra todo lo cacheado por esta app (útil para reiniciar el modo offline desde DevTools). */
  static clearAll() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CacheStore.#prefix))
      .forEach((key) => localStorage.removeItem(key));
  }
}
