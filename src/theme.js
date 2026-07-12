// src/theme.js
//
// Identidad visual de cada subproyecto: un color de acento y un icono.
// Vive en un solo lugar para que el menú y cada vista pinten exactamente
// lo mismo (Clase #11 Parte 2, Tema 5: un módulo, una fuente de verdad).

export const PROJECT_THEME = {
  '#/dream-team': {
    label: 'Creador de Dream Team',
    description: 'Elegí 11 equipos y calculá sus goles a favor en partidos ya finalizados.',
    icon: '⚽',
    color: '#22c55e',
    soft: 'rgba(34, 197, 94, 0.16)',
  },
  '#/head-to-head': {
    label: 'Buscador Cara a Cara',
    description: 'Compará dos equipos en paralelo con autocompletado y Promise.all.',
    icon: '🔍',
    color: '#38bdf8',
    soft: 'rgba(56, 189, 248, 0.16)',
  },
  '#/surprise-tracker': {
    label: 'Seguidor de Sorpresas',
    description: 'Polling periódico que avisa cuando tu equipo favorito va perdiendo.',
    icon: '🚨',
    color: '#fb923c',
    soft: 'rgba(251, 146, 60, 0.16)',
  },
  '#/quiniela': {
    label: 'Quiniela Local',
    description: 'Predicciones guardadas localmente, comparadas contra el resultado real.',
    icon: '🎯',
    color: '#eab308',
    soft: 'rgba(234, 179, 8, 0.16)',
  },
  '#/draw': {
    label: 'Simulador de Sorteo Loco',
    description: 'Fisher-Yates sobre los 48 equipos reales, en 12 grupos ficticios.',
    icon: '🎲',
    color: '#a855f7',
    soft: 'rgba(168, 85, 247, 0.16)',
  },
};

export const HOME_THEME = {
  label: 'Panel principal',
  description: 'Próximos partidos, resultados recientes y los equipos clasificados.',
  icon: '🏠',
  color: '#64748b',
  soft: 'rgba(100, 116, 139, 0.14)',
};

export function themeFor(hash) {
  if (hash === '#/menu') return HOME_THEME;
  return PROJECT_THEME[hash] ?? { icon: '📋', color: '#9aa7c2', soft: 'rgba(154, 167, 194, 0.16)' };
}

// Un color fijo por cada grupo REAL del Mundial 2026 (A-L), para que dos
// equipos del mismo grupo se distingan de un vistazo por color, sin
// depender de leer la letra. Son 12 tonos distintos repartidos en el
// círculo cromático, no colores al azar.
export const GROUP_COLORS = {
  A: '#ef4444',
  B: '#f97316',
  C: '#f59e0b',
  D: '#eab308',
  E: '#84cc16',
  F: '#22c55e',
  G: '#10b981',
  H: '#14b8a6',
  I: '#06b6d4',
  J: '#3b82f6',
  K: '#6366f1',
  L: '#a855f7',
};

export function colorForGroup(groupLetter) {
  return GROUP_COLORS[groupLetter] ?? '#9aa7c2';
}
