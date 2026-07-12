// src/utils/debounce.js
//
// Clase #11 Parte 1, Tema 2.2 (Closures): "debounce y throttle dependen de
// una closure para recordar el último timestamp/temporizador de ejecución".
// Aquí "timeoutId" vive dentro de la función devuelta gracias a la closure,
// aunque debounce() ya haya terminado de ejecutarse hace rato.

export function debounce(fn, delayMs = 400) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}
