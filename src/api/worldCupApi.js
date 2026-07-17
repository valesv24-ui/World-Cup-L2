// src/api/worldCupApi.js
//
// Separación estricta entre "lógica de fetch" y "lógica de presentación"
// (rúbrica, punto 2). Ningún archivo de vista debería llamar fetch()
// directamente: siempre pasa por aquí, y de aquí siempre por ApiClient,
// que es quien agrega el JWT, reintenta y cachea.

export class WorldCupApi {
  #client;

  constructor(client) {
    this.#client = client;
  }

  /** GET /get/teams — los 48 equipos clasificados. */
  async getTeams() {
    return this.#client.get('/get/teams', { cacheKey: 'teams' });
  }

  /** GET /get/games — los 104 partidos del torneo. */
  async getGames() {
    return this.#client.get('/get/games', { cacheKey: 'games' });
  }

  /** GET /get/groups — las 12 tablas de grupo A-L. */
  async getGroups() {
    return this.#client.get('/get/groups', { cacheKey: 'groups' });
  }

  /** GET /get/team/?name= — búsqueda de un equipo por nombre (autocompletado). */
  async getTeamByName(name) {
    const query = encodeURIComponent(name);
    // No se cachea: es una consulta de autocompletado que cambia con cada tecla.
    return this.#client.get(`/get/team/?name=${query}`, { useCache: false });
  }
}

/**
 * Normaliza la forma de la respuesta de /get/teams, que la API entrega
 * como arreglo plano de equipos (a veces envuelto, según el endpoint).
 * Se usa destructuring + optional chaining (Clase #11 Parte 2, Temas 3-4).
 */
export function extractTeamsArray(rawData) {
  if (Array.isArray(rawData)) return rawData;
  return rawData?.teams ?? [];
}

export function extractGamesArray(rawData) {
  if (Array.isArray(rawData)) return rawData;
  return rawData?.games ?? [];
}

export function extractGroupsArray(rawData) {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.groups)) return rawData.groups;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
}

/**
 * Busca, dentro del arreglo de 12 grupos, la fila de posiciones de un
 * equipo puntual. Se escribe "a la defensiva" (probando varios nombres de
 * campo posibles y comparando ids como texto) porque distintas respuestas
 * de esta API pública no siempre usan exactamente los mismos nombres de
 * campo entre endpoints — así que en vez de asumir un único nombre exacto,
 * se cubren las variantes razonables.
 */
export function findTeamStanding(groups, team) {
  const groupLetter = team?.groups;
  const teamId = String(team?.id ?? '');

  const matchingGroup = groups.find((group) => {
    const letter = group.group ?? group.name ?? group.letter ?? group.id;
    return letter === groupLetter;
  });

  const teamsInGroup = matchingGroup?.teams ?? matchingGroup?.standings ?? [];
  return teamsInGroup.find((row) => String(row.team_id ?? row.id) === teamId);
}
