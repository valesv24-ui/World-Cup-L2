// src/views/menuView.js
//
// El "Inicio" ya no repite las mismas 5 tarjetas que el menú de arriba
// (redundante). En su lugar, muestra un vistazo real al torneo — como la
// portada de un sitio oficial del Mundial — con los próximos partidos,
// los resultados más recientes, y los 48 equipos clasificados.

import { extractTeamsArray, extractGamesArray } from '../api/worldCupApi.js';
import { isTrue, describeMatchSide, formatDateEs } from '../utils/format.js';
import { staleBadgeHtml } from '../components/staleBadge.js';

export async function renderMenuView(container, { authService, worldCupApi }) {
  container.innerHTML = `
    <div class="content-panel">
      <p class="menu-welcome">
        Hola, ${escapeHtml(authService.currentUser?.name ?? 'jugador/a')} 👋 — un vistazo rápido al
        Mundial 2026. Elegí un subproyecto en el menú de arriba para jugar.
      </p>

      <div id="games-load-status"></div>

      <div class="home-grid">
        <section class="home-card">
          <h2>📅 Próximos partidos</h2>
          <ul id="upcoming-matches" class="home-match-list">
            <li class="empty-hint">Cargando…</li>
          </ul>
        </section>

        <section class="home-card">
          <h2>🏁 Resultados recientes</h2>
          <ul id="recent-results" class="home-match-list">
            <li class="empty-hint">Cargando…</li>
          </ul>
        </section>
      </div>

      <section class="home-teams">
        <h2>🌍 Los 48 equipos clasificados</h2>
        <div id="teams-grid" class="teams-grid">
          <p class="empty-hint">Cargando…</p>
        </div>
      </section>
    </div>
  `;

  const loadStatusEl = container.querySelector('#games-load-status');
  const upcomingEl = container.querySelector('#upcoming-matches');
  const recentEl = container.querySelector('#recent-results');
  const teamsGridEl = container.querySelector('#teams-grid');

  try {
    const { data, stale, cachedAt } = await worldCupApi.getGames();
    const games = extractGamesArray(data);
    loadStatusEl.innerHTML = stale ? staleBadgeHtml(cachedAt) : '';

    const recentResults = games
      .filter((game) => isTrue(game.finished))
      .sort((a, b) => Number(b.matchday) - Number(a.matchday))
      .slice(0, 6);

    const upcomingMatches = games
      .filter((game) => !isTrue(game.finished))
      .sort((a, b) => Number(a.matchday) - Number(b.matchday))
      .slice(0, 6);

    recentEl.innerHTML =
      recentResults.length === 0
        ? '<li class="empty-hint">Todavía no hay resultados.</li>'
        : recentResults
            .map(
              (game) => `
                <li class="home-match-row">
                  <span>${escapeHtml(describeMatchSide(game, 'home'))} <strong>${game.home_score}-${game.away_score}</strong> ${escapeHtml(describeMatchSide(game, 'away'))}</span>
                  <span class="home-match-row__date">${escapeHtml(formatDateEs(game.local_date))}</span>
                </li>
              `
            )
            .join('');

    upcomingEl.innerHTML =
      upcomingMatches.length === 0
        ? '<li class="empty-hint">No hay partidos programados por ahora.</li>'
        : upcomingMatches
            .map(
              (game) => `
                <li class="home-match-row">
                  <span>${escapeHtml(describeMatchSide(game, 'home'))} vs ${escapeHtml(describeMatchSide(game, 'away'))}</span>
                  <span class="home-match-row__date">${escapeHtml(formatDateEs(game.local_date))}</span>
                </li>
              `
            )
            .join('');
  } catch (error) {
    const message = `<li class="empty-hint">No se pudo cargar (${escapeHtml(error.message)}).</li>`;
    upcomingEl.innerHTML = message;
    recentEl.innerHTML = message;
  }

  try {
    const { data, stale, cachedAt } = await worldCupApi.getTeams();
    const teams = extractTeamsArray(data);
    const staleNotice = stale ? staleBadgeHtml(cachedAt) : '';

    teamsGridEl.innerHTML =
      staleNotice +
      teams
        .map(
          (team) => `
            <div class="team-chip" title="${escapeHtml(team.name_en ?? team.id)}">
              <img src="${team.flag}" alt="" class="flag" loading="lazy" />
              <span>${escapeHtml(team.name_en ?? team.id)}</span>
            </div>
          `
        )
        .join('');
  } catch (error) {
    teamsGridEl.innerHTML = `<p class="empty-hint">No se pudo cargar la lista de equipos (${escapeHtml(error.message)}).</p>`;
  }
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}
