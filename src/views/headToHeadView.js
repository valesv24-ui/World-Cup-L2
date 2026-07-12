// src/views/headToHeadView.js
//
// 2.2 Buscador Cara a Cara
//
// Reto de resiliencia: si una de las dos búsquedas paralelas falla, la
// columna que sí resolvió debe mostrarse completa, y la otra debe mostrar
// su propio estado de error local — sin descartar ambos resultados.
//
// Técnica: SÍ se usa Promise.all (como pide el enunciado), pero cada
// función interna atrapa su propio error y siempre RESUELVE con un objeto
// { ok, ... }, nunca rechaza. Así Promise.all nunca se cae por completo
// aunque una de las dos búsquedas falle.

import { extractTeamsArray, extractGamesArray, extractGroupsArray } from '../api/worldCupApi.js';
import { debounce } from '../utils/debounce.js';
import { isTrue } from '../utils/format.js';
import { staleBadgeHtml } from '../components/staleBadge.js';
import { themeFor, colorForGroup } from '../theme.js';

export async function renderHeadToHeadView(container, { worldCupApi }) {
  container.innerHTML = layout();

  const state = { teamA: null, teamB: null };
  const loadStatusEl = container.querySelector('#teams-load-status');

  // Se carga el roster completo UNA sola vez (mismo patrón que el Dream
  // Team) para que el usuario pueda explorar los 48 equipos sin necesitar
  // saber el nombre exacto. La búsqueda con debounce contra
  // /get/team/?name= (exigida por el enunciado) sigue funcionando en
  // paralelo como confirmación del lado del servidor.
  let allTeams = [];
  try {
    const { data, stale, cachedAt } = await worldCupApi.getTeams();
    allTeams = extractTeamsArray(data);
    loadStatusEl.innerHTML = stale ? staleBadgeHtml(cachedAt) : '';
  } catch (error) {
    loadStatusEl.innerHTML = `<p class="form-feedback form-feedback--error">
      No se pudo cargar la lista de equipos para explorar (${escapeHtml(error.message)}). Puede escribir el nombre exacto igual.
    </p>`;
  }

  setupSearchColumn(container, 'a', worldCupApi, allTeams, (team) => {
    state.teamA = team;
    tryCompare();
  });
  setupSearchColumn(container, 'b', worldCupApi, allTeams, (team) => {
    state.teamB = team;
    tryCompare();
  });

  async function tryCompare() {
    if (!state.teamA || !state.teamB) return;
    await runComparison(container, worldCupApi, state.teamA, state.teamB);
  }
}

function setupSearchColumn(container, columnId, worldCupApi, allTeams, onSelect) {
  const input = container.querySelector(`#search-${columnId}`);
  const suggestions = container.querySelector(`#suggestions-${columnId}`);
  const countEl = container.querySelector(`#team-count-${columnId}`);

  function renderList(matches) {
    countEl.textContent =
      matches.length === allTeams.length
        ? `${allTeams.length} equipos clasificados al Mundial 2026`
        : `${matches.length} de ${allTeams.length} equipos`;

    if (matches.length === 0) {
      suggestions.innerHTML =
        '<li class="empty-hint">Ningún equipo clasificado coincide. Solo participan los 48 equipos de esta lista.</li>';
      return;
    }
    suggestions.innerHTML = matches
      .map(
        (team) => `
          <li>
            <button type="button" data-id="${team.id}">
              <img src="${team.flag}" alt="" class="flag" loading="lazy" />
              ${escapeHtml(team.name_en ?? team.id)}
              <span class="group-dot" style="--group-color: ${colorForGroup(team.groups)};" title="Grupo ${escapeHtml(team.groups ?? '?')}"></span>
            </button>
          </li>
        `
      )
      .join('');
    suggestions.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        const team = matches.find((candidate) => candidate.id === button.dataset.id);
        input.value = team?.name_en ?? '';
        suggestions.innerHTML = '';
        countEl.textContent = `Elegido: ${team?.name_en ?? ''}`;
        onSelect(team);
      });
    });
  }

  function localFilter(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allTeams;
    return allTeams.filter(
      (team) => team.name_en?.toLowerCase().includes(normalized) || team.name_fa?.toLowerCase().includes(normalized)
    );
  }

  // Confirmación contra el servidor: esta es la parte que exige el
  // enunciado (debounce de 300-500ms + GET /get/team/?name=). La lista
  // visible ya viene del roster local, así que un fallo aquí no rompe la
  // experiencia; si el servidor encuentra algo que el roster local no
  // tenía, simplemente se agrega a la lista ya mostrada.
  const confirmWithServer = debounce(async (query) => {
    if (query.trim().length < 2) return;
    try {
      const { data } = await worldCupApi.getTeamByName(query.trim());
      const serverMatches = extractTeamMatches(data);
      const localMatches = localFilter(query);
      const localIds = new Set(localMatches.map((team) => team.id));
      const extraMatches = serverMatches.filter((team) => !localIds.has(team.id));
      if (extraMatches.length > 0) {
        renderList([...localMatches, ...extraMatches]);
      }
    } catch {
      // La lista local ya está en pantalla; un 401/429/500 puntual en la
      // búsqueda del servidor no debe dejar al usuario sin nada que elegir.
    }
  }, 400); // debounce entre 300-500ms, según lo exigido

  input.addEventListener('input', () => {
    const query = input.value;
    renderList(localFilter(query));
    confirmWithServer(query);
  });

  // Lista completa visible desde el inicio: se puede elegir sin escribir.
  renderList(allTeams);
}

/**
 * La API a veces entrega el resultado como arreglo, a veces como un
 * único objeto suelto, y a veces envuelto en { team: {...} } o
 * { teams: [...] } (el mismo patrón que ya documenta /get/team/${id}).
 * Esta función normaliza cualquiera de esas formas a un arreglo plano de
 * equipos, para que el resto del código no dependa de la forma exacta de
 * la respuesta.
 */
function extractTeamMatches(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.teams)) return data.teams;
  if (data.team) return [data.team];
  if (data.id || data.name_en) return [data];
  return [];
}

async function safeTeamComparison(worldCupApi, team) {
  try {
    const [teamResult, groupsResult] = await Promise.all([
      worldCupApi.getTeamByName(team.name_en),
      worldCupApi.getGroups(),
    ]);
    const groups = extractGroupsArray(groupsResult.data);
    const groupRow = groups.find((group) => group.group === team.groups);
    const standing = groupRow?.teams?.find((row) => row.team_id === team.id);
    return { ok: true, team, standing, stale: groupsResult.stale };
  } catch (error) {
    return { ok: false, team, error };
  }
}

async function runComparison(container, worldCupApi, teamA, teamB) {
  const resultsEl = container.querySelector('#comparison-results');
  resultsEl.innerHTML = '<p class="empty-hint">Comparando en paralelo…</p>';

  // Promise.all real: ninguna de las dos promesas internas rechaza jamás,
  // así que un fallo en una no cancela el resultado de la otra.
  const [resultA, resultB] = await Promise.all([
    safeTeamComparison(worldCupApi, teamA),
    safeTeamComparison(worldCupApi, teamB),
  ]);

  let matchHtml = '<p class="empty-hint">Los equipos no comparten grupo, o el partido no se pudo determinar.</p>';
  if (resultA.ok && resultB.ok && teamA.groups && teamA.groups === teamB.groups) {
    try {
      const { data } = await worldCupApi.getGames();
      const games = extractGamesArray(data);
      const directMatch = games.find(
        (game) =>
          (game.home_team_id === teamA.id && game.away_team_id === teamB.id) ||
          (game.home_team_id === teamB.id && game.away_team_id === teamA.id)
      );
      if (directMatch) {
        matchHtml = `
          <div class="direct-match">
            <h3>Partido entre ambos</h3>
            <p>${escapeHtml(directMatch.home_team_name_en)} ${directMatch.home_score} - ${directMatch.away_score} ${escapeHtml(
              directMatch.away_team_name_en
            )}</p>
            <p>${isTrue(directMatch.finished) ? 'Finalizado' : 'Aún no se juega'}</p>
          </div>
        `;
      }
    } catch {
      matchHtml = '<p class="empty-hint">No se pudo confirmar el partido directo por un fallo de red.</p>';
    }
  }

  resultsEl.innerHTML = `
    <div class="comparison-grid">
      ${renderColumn(resultA)}
      ${renderColumn(resultB)}
    </div>
    ${matchHtml}
  `;
}

function renderColumn(result) {
  if (!result.ok) {
    return `
      <div class="comparison-column comparison-column--error">
        <h3>${escapeHtml(result.team.name_en ?? result.team.id)}</h3>
        <p class="form-feedback form-feedback--error">
          No se pudo cargar esta columna: ${escapeHtml(result.error.message ?? 'error desconocido')}
        </p>
      </div>
    `;
  }

  const { team, standing, stale } = result;
  const groupColor = colorForGroup(team.groups);
  return `
    <div class="comparison-column">
      <img src="${team.flag}" alt="" class="flag flag--large" />
      <h3>${escapeHtml(team.name_en ?? team.id)}</h3>
      <span class="group-badge" style="--group-color: ${groupColor};" title="Grupo ${escapeHtml(team.groups ?? '?')}">
        Grupo ${escapeHtml(team.groups ?? '—')}
      </span>
      <p>Puntos: ${standing?.pts ?? '—'}</p>
      ${stale ? '<span class="badge badge--stale">⚠ Datos no actualizados</span>' : ''}
    </div>
  `;
}

function layout() {
  const theme = themeFor('#/head-to-head');
  return `
    <div class="content-panel" style="--accent: ${theme.color}; --accent-soft: ${theme.soft};">
      <div id="teams-load-status"></div>

      <div class="two-columns">
        <section>
          <label for="search-a">Equipo A</label>
          <p class="input-hint">Solo participan los 48 equipos clasificados al Mundial 2026.</p>
          <input id="search-a" type="search" placeholder="Escriba o elija de la lista…" class="search-input" />
          <p id="team-count-a" class="team-count"></p>
          <ul id="suggestions-a" class="suggestions-list"></ul>
        </section>
        <section>
          <label for="search-b">Equipo B</label>
          <p class="input-hint">Solo participan los 48 equipos clasificados al Mundial 2026.</p>
          <input id="search-b" type="search" placeholder="Escriba o elija de la lista…" class="search-input" />
          <p id="team-count-b" class="team-count"></p>
          <ul id="suggestions-b" class="suggestions-list"></ul>
        </section>
      </div>

      <div id="comparison-results" class="comparison-results">
        <p class="empty-hint">Elija un equipo en cada columna para comparar.</p>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}
