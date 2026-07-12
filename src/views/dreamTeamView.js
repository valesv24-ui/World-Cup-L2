// src/views/dreamTeamView.js
//
// 2.1 Creador de "Dream Team"
// Estado en memoria (Map) sincronizado con el DOM en cada cambio de
// selección. El "Reto de Resiliencia": si el cálculo de goles de un
// equipo recién agregado falla (sin caché disponible todavía), el equipo
// queda con goles = null ("pendientes de calcular") y el total general lo
// excluye sin producir NaN (ver sumPendingSafe en utils/format.js).

import { extractTeamsArray, extractGamesArray } from '../api/worldCupApi.js';
import { sumGoalsForTeam, sumPendingSafe } from '../utils/format.js';
import { staleBadgeHtml } from '../components/staleBadge.js';
import { themeFor } from '../theme.js';

const MAX_TEAMS = 11;

export async function renderDreamTeamView(container, { worldCupApi }) {
  container.innerHTML = layout();

  const searchInput = container.querySelector('#team-search');
  const availableList = container.querySelector('#available-teams');
  const selectedList = container.querySelector('#selected-teams');
  const totalGoalsEl = container.querySelector('#total-goals');
  const limitMessageEl = container.querySelector('#limit-message');
  const loadErrorEl = container.querySelector('#load-error');

  /** @type {Map<string, { team: object, goals: number|null }>} */
  const selectedTeams = new Map();
  let allTeams = [];
  let staleNotice = '';

  try {
    const { data, stale, cachedAt } = await worldCupApi.getTeams();
    allTeams = extractTeamsArray(data);
    staleNotice = stale ? staleBadgeHtml(cachedAt) : '';
  } catch (error) {
    loadErrorEl.innerHTML = `No se pudo cargar la lista de equipos: ${error.message}`;
  }

  renderAvailableTeams(allTeams, '');

  searchInput.addEventListener('input', () => {
    renderAvailableTeams(allTeams, searchInput.value.trim().toLowerCase());
  });

  function renderAvailableTeams(teams, query) {
    const atLimit = selectedTeams.size >= MAX_TEAMS;
    limitMessageEl.hidden = !atLimit;

    const filtered = teams.filter((team) => {
      const matchesQuery =
        !query ||
        team.name_en?.toLowerCase().includes(query) ||
        team.name_fa?.toLowerCase().includes(query);
      return matchesQuery && !selectedTeams.has(team.id);
    });

    availableList.innerHTML =
      staleNotice +
      (filtered.length === 0
        ? '<p class="empty-hint">Sin resultados.</p>'
        : filtered
            .map(
              (team) => `
                <li>
                  <button type="button" class="team-pill" data-team-id="${team.id}" ${atLimit ? 'disabled' : ''}>
                    <img src="${team.flag}" alt="" class="flag" loading="lazy" />
                    ${escapeHtml(team.name_en ?? team.name_fa ?? team.id)}
                  </button>
                </li>
              `
            )
            .join(''));

    availableList.querySelectorAll('[data-team-id]').forEach((button) => {
      button.addEventListener('click', () => addTeam(button.dataset.teamId));
    });
  }

  async function addTeam(teamId) {
    if (selectedTeams.size >= MAX_TEAMS) return;
    const team = allTeams.find((candidate) => candidate.id === teamId);
    if (!team) return;

    selectedTeams.set(teamId, { team, goals: null });
    renderSelectedTeams();
    renderAvailableTeams(allTeams, searchInput.value.trim().toLowerCase());

    // Reto de resiliencia: se intenta calcular los goles justo al agregar.
    // Si /get/games falla sin caché disponible, el equipo queda "pendiente".
    try {
      const { data, stale, cachedAt } = await worldCupApi.getGames();
      const games = extractGamesArray(data);
      const goals = sumGoalsForTeam(games, teamId);
      selectedTeams.set(teamId, { team, goals });
      if (stale) {
        selectedTeams.get(teamId).staleNotice = staleBadgeHtml(cachedAt);
      }
    } catch {
      selectedTeams.set(teamId, { team, goals: null });
    }

    renderSelectedTeams();
  }

  function removeTeam(teamId) {
    selectedTeams.delete(teamId);
    renderSelectedTeams();
    renderAvailableTeams(allTeams, searchInput.value.trim().toLowerCase());
  }

  function renderSelectedTeams() {
    const entries = [...selectedTeams.values()];

    selectedList.innerHTML =
      entries.length === 0
        ? '<p class="empty-hint">Todavía no ha seleccionado equipos.</p>'
        : entries
            .map(
              ({ team, goals, staleNotice: rowStale }) => `
                <li class="selected-row">
                  <img src="${team.flag}" alt="" class="flag" loading="lazy" />
                  <span class="selected-row__name">${escapeHtml(team.name_en ?? team.id)}</span>
                  <span class="selected-row__goals">
                    ${goals === null ? '<em class="pending">goles pendientes de calcular</em>' : `${goals} goles`}
                  </span>
                  ${rowStale ?? ''}
                  <button type="button" class="btn btn-ghost btn-small" data-remove="${team.id}">Quitar</button>
                </li>
              `
            )
            .join('');

    selectedList.querySelectorAll('[data-remove]').forEach((button) => {
      button.addEventListener('click', () => removeTeam(button.dataset.remove));
    });

    totalGoalsEl.textContent = sumPendingSafe(entries, (entry) => entry.goals);
    container.querySelector('#selected-count').textContent = entries.length;
  }
}

function layout() {
  const theme = themeFor('#/dream-team');
  return `
    <div class="content-panel" style="--accent: ${theme.color}; --accent-soft: ${theme.soft};">
      <p id="load-error" class="form-feedback form-feedback--error"></p>

      <div class="two-columns">
        <section>
          <h2>Equipos disponibles</h2>
          <input id="team-search" type="search" placeholder="Buscar equipo…" class="search-input" />
          <p id="limit-message" class="limit-message" hidden>
            Ya seleccionó 11 equipos. Quite alguno para agregar otro.
          </p>
          <ul id="available-teams" class="team-list"></ul>
        </section>

        <section>
          <h2>Dream Team (<span id="selected-count">0</span>/11)</h2>
          <p class="total-goals">Goles totales: <strong id="total-goals">0</strong></p>
          <ul id="selected-teams" class="selected-list"></ul>
        </section>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}
