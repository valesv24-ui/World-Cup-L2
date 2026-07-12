// src/views/surpriseTrackerView.js
//
// 2.3 Seguidor de Sorpresas
//
// Reto de resiliencia: si un ciclo de polling falla, se conserva el último
// marcador conocido (en memoria y en localStorage) y se reintenta en el
// siguiente ciclo. La alerta visual activa NO se apaga ni el marcador se
// resetea a "0-0" solo porque una petición falló: ApiClient ya entrega el
// dato cacheado con stale=true cuando puede, y si no puede ni eso, esta
// vista simplemente no toca el estado anterior.

import { extractTeamsArray, extractGamesArray } from '../api/worldCupApi.js';
import { isTrue } from '../utils/format.js';
import { themeFor } from '../theme.js';

const FAVORITES_KEY = 'wc26_favorite_teams';
const DEFAULT_INTERVAL_MS = 15000;

export async function renderSurpriseTrackerView(container, { worldCupApi }) {
  container.innerHTML = layout();

  const favoriteIds = new Set(loadFavorites());
  /** @type {Map<string, { rivalName: string, teamScore: number, rivalScore: number, losing: boolean, finished: boolean }>} */
  const lastKnownState = new Map();

  const teamListEl = container.querySelector('#team-checklist');
  const trackerListEl = container.querySelector('#tracker-list');
  const statusEl = container.querySelector('#polling-status');
  const intervalInput = container.querySelector('#interval-input');

  let allTeams = [];
  try {
    const { data } = await worldCupApi.getTeams();
    allTeams = extractTeamsArray(data);
  } catch (error) {
    statusEl.textContent = `No se pudo cargar la lista de equipos: ${error.message}`;
  }

  renderTeamChecklist();
  renderTracker();

  let pollingActive = false;
  let pollingTimeoutId = null;

  async function pollOnce() {
    try {
      const { data, stale } = await worldCupApi.getGames();
      const games = extractGamesArray(data);
      favoriteIds.forEach((teamId) => updateFavoriteState(teamId, games, stale));
      statusEl.textContent = stale
        ? 'Última actualización: usando copia local (la API no respondió a tiempo).'
        : `Última actualización: ${new Date().toLocaleTimeString('es-CR')}`;
    } catch {
      // Fallo total (ni siquiera hay caché): NO se toca lastKnownState.
      statusEl.textContent = 'No se pudo actualizar este ciclo. Se conserva el último marcador conocido.';
    }
    renderTracker();
  }

  function updateFavoriteState(teamId, games, stale) {
    const teamGames = games.filter((game) => game.home_team_id === teamId || game.away_team_id === teamId);
    if (teamGames.length === 0) return;

    const mostRecent = [...teamGames].sort((a, b) => Number(b.matchday) - Number(a.matchday))[0];
    const isHome = mostRecent.home_team_id === teamId;
    const teamScore = Number(isHome ? mostRecent.home_score : mostRecent.away_score) || 0;
    const rivalScore = Number(isHome ? mostRecent.away_score : mostRecent.home_score) || 0;
    const rivalName = isHome ? mostRecent.away_team_name_en : mostRecent.home_team_name_en;

    lastKnownState.set(teamId, {
      rivalName: rivalName ?? 'rival por definir',
      teamScore,
      rivalScore,
      losing: teamScore < rivalScore,
      finished: isTrue(mostRecent.finished),
      stale,
    });
  }

  function scheduleNextPoll() {
    if (!pollingActive) return;
    const intervalMs = Math.max(3000, Number(intervalInput.value) * 1000 || DEFAULT_INTERVAL_MS);
    pollingTimeoutId = setTimeout(async () => {
      await pollOnce();
      scheduleNextPoll();
    }, intervalMs);
  }

  container.querySelector('[data-action="start-polling"]').addEventListener('click', async () => {
    if (pollingActive) return;
    pollingActive = true;
    await pollOnce();
    scheduleNextPoll();
  });

  container.querySelector('[data-action="stop-polling"]').addEventListener('click', () => {
    pollingActive = false;
    clearTimeout(pollingTimeoutId);
    statusEl.textContent = 'Polling detenido.';
  });

  container.querySelector('[data-action="clear-favorites"]').addEventListener('click', () => {
    favoriteIds.clear();
    lastKnownState.clear();
    saveFavorites([]);
    renderTeamChecklist();
    renderTracker();
  });

  function renderTeamChecklist() {
    teamListEl.innerHTML = allTeams
      .map(
        (team) => `
          <label class="checklist-item">
            <input type="checkbox" data-team-id="${team.id}" ${favoriteIds.has(team.id) ? 'checked' : ''} />
            ${escapeHtml(team.name_en ?? team.id)}
          </label>
        `
      )
      .join('');

    teamListEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) favoriteIds.add(checkbox.dataset.teamId);
        else favoriteIds.delete(checkbox.dataset.teamId);
        saveFavorites([...favoriteIds]);
        renderTracker();
      });
    });
  }

  function renderTracker() {
    const favorites = [...favoriteIds];
    trackerListEl.innerHTML =
      favorites.length === 0
        ? '<p class="empty-hint">Marque uno o más equipos como favoritos para seguirlos.</p>'
        : favorites
            .map((teamId) => {
              const team = allTeams.find((candidate) => candidate.id === teamId);
              const state = lastKnownState.get(teamId);
              if (!state) {
                return `<li class="tracker-row"><strong>${escapeHtml(team?.name_en ?? teamId)}</strong> — sin datos todavía.</li>`;
              }
              return `
                <li class="tracker-row ${state.losing ? 'tracker-row--alert' : ''}">
                  <strong>${escapeHtml(team?.name_en ?? teamId)}</strong>
                  vs ${escapeHtml(state.rivalName)}:
                  ${state.teamScore} - ${state.rivalScore}
                  ${state.finished ? '(finalizado)' : '(en curso / próximo)'}
                  ${state.stale ? '<span class="badge badge--stale">⚠ no actualizado</span>' : ''}
                  ${state.losing ? '<span class="badge badge--alert">⚠ va perdiendo</span>' : ''}
                </li>
              `;
            })
            .join('');
  }

  return () => {
    pollingActive = false;
    clearTimeout(pollingTimeoutId);
  };
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveFavorites(ids) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // localStorage no disponible: los favoritos solo viven en memoria.
  }
}

function layout() {
  const theme = themeFor('#/surprise-tracker');
  return `
    <div class="content-panel" style="--accent: ${theme.color}; --accent-soft: ${theme.soft};">
      <div class="two-columns">
        <section>
          <div class="section-header">
            <h2>Marcar favoritos</h2>
            <button type="button" class="btn btn-ghost btn-small" data-action="clear-favorites">Limpiar favoritos</button>
          </div>
          <ul id="team-checklist" class="checklist"></ul>
        </section>

        <section>
          <h2>Seguimiento en vivo</h2>
          <div class="polling-controls">
            <label for="interval-input">Intervalo (segundos)</label>
            <input id="interval-input" type="number" min="3" value="15" />
            <button type="button" class="btn btn-primary" data-action="start-polling">Iniciar polling</button>
            <button type="button" class="btn btn-ghost" data-action="stop-polling">Detener</button>
          </div>
          <p id="polling-status" class="polling-status" role="status">Polling detenido.</p>
          <ul id="tracker-list" class="tracker-list"></ul>
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
