// src/utils/fisherYates.js
//
// Algoritmo Fisher-Yates para el Simulador de Sorteo Loco (2.5).
// Se trabaja de forma inmutable (Clase #13, Tema 3.3): se copia el arreglo
// original con spread antes de mezclar, así "teams" nunca se muta y queda
// disponible para repetir el sorteo sin volver a pedirlo a la API.

export function fisherYatesShuffle(originalArray) {
  const result = [...originalArray];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Reparte un arreglo ya mezclado en grupos de "size" elementos cada uno. */
export function chunkInto(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
