// src/utils/format.js
//
// Ayudas puntuales. Se usan map/filter/reduce en vez de bucles imperativos
// (Clase #13, Temas 3-5) para mantener el estilo declarativo del curso.

/**
 * Suma los goles a favor de un equipo dentro de un arreglo de partidos,
 * contando home_score cuando el equipo es local y away_score cuando es
 * visitante, solo en partidos con finished === true (o "TRUE" como string,
 * porque la API a veces entrega booleanos como texto).
 */
export function sumGoalsForTeam(games, teamId) {
  const isFinished = (game) => game.finished === true || `${game.finished}`.toUpperCase() === 'TRUE';

  return games
    .filter(isFinished)
    .filter((game) => game.home_team_id === teamId || game.away_team_id === teamId)
    .reduce((total, game) => {
      const goals =
        game.home_team_id === teamId ? Number(game.home_score ?? 0) : Number(game.away_score ?? 0);
      return total + (Number.isNaN(goals) ? 0 : goals);
    }, 0);
}

/**
 * Suma total de goles del Dream Team, excluyendo equipos con goles
 * pendientes (null) sin producir NaN en el resultado.
 */
export function sumPendingSafe(entries, pluck) {
  return entries.reduce((total, entry) => {
    const value = pluck(entry);
    return value === null || value === undefined ? total : total + value;
  }, 0);
}

export function formatDateEs(rawDate) {
  // Formato recibido: "06/11/2026 13:00" (MM/DD/AAAA HH:mm)
  if (!rawDate) return 'Fecha por definir';
  const [datePart, timePart] = rawDate.split(' ');
  const [month, day, year] = datePart?.split('/') ?? [];
  if (!month || !day || !year) return rawDate;
  return `${day}/${month}/${year} · ${timePart ?? ''}`;
}

export function isTrue(value) {
  return value === true || `${value}`.toUpperCase() === 'TRUE';
}

/**
 * Para partidos de eliminación directa cuyo rival todavía no está
 * definido, la API entrega home_team_id/away_team_id = "0" y en su lugar
 * describe la posición con home_team_label/away_team_label (por ejemplo
 * "Ganador Grupo A" o "3ro Grupo C/D/F/G/H"). Sin este fallback, un
 * nullish coalescing simple caía en el "0" del id y la fila se veía como
 * un confuso "0 vs 0".
 */
export function describeMatchSide(game, side) {
  const teamName = side === 'home' ? game.home_team_name_en : game.away_team_name_en;
  const bracketLabel = side === 'home' ? game.home_team_label : game.away_team_label;
  const teamId = side === 'home' ? game.home_team_id : game.away_team_id;

  if (teamName) return teamName;
  if (bracketLabel) return bracketLabel;
  if (teamId && teamId !== '0') return `Equipo #${teamId}`;
  return 'Por definir';
}
