// src/views/quinielaView.js
//
// 2.4 Quiniela Local
//
// Reto de resiliencia: las predicciones guardadas se leen primero de
// localStorage y se muestran de inmediato al abrir la página, incluso si
// la API está caída en ese momento (renderPredictionsFromStorage corre
// ANTES de cualquier await a la red). La comparación contra el resultado
// real solo se actualiza cuando /get/games finalmente responde.

import { extractGamesArray } from '../api/worldCupApi.js';
import { isTrue, describeMatchSide } from '../utils/format.js';
import { staleBadgeHtml } from '../components/staleBadge.js';
import { themeFor } from '../theme.js';

const PREDICTIONS_KEY = 'wc26_quiniela_predictions';

export async function renderQuinielaView(container, { worldCupApi }) {
  container.innerHTML = layout();

  const pendingListEl = container.querySelector('#pending-matches');
  const resolvedListEl = container.querySelector('#resolved-predictions');
  const loadStatusEl = container.querySelector('#load-status');

  const predictions = loadPredictions();
  let latestGames = [];

  // 1) Se muestra de inmediato lo que ya había en localStorage, sin red.
  renderResolvedFromStorageOnly();

  // 2) Solo después se intenta traer los partidos reales (puede fallar).
  try {
    const { data, stale, cachedAt } = await worldCupApi.getGames();
    latestGames = extractGamesArray(data);
    loadStatusEl.innerHTML = stale ? staleBadgeHtml(cachedAt) : '';
    renderPendingMatches(latestGames);
    renderResolvedComparisons(latestGames);
  } catch (error) {
    loadStatusEl.innerHTML = `<p class="form-feedback form-feedback--error">
      No se pudo cargar la lista de partidos (${escapeHtml(error.message)}). Se muestran solo las predicciones ya guardadas.
    </p>`;
  }

  container.querySelector('[data-action="clear-predictions"]').addEventListener('click', () => {
    Object.keys(predictions).forEach((key) => delete predictions[key]);
    savePredictions(predictions);
    renderResolvedFromStorageOnly();
    if (latestGames.length > 0) {
      renderPendingMatches(latestGames);
      renderResolvedComparisons(latestGames);
    }
  });

  /** Borra UNA sola predicción (no todas), y refresca las listas afectadas. */
  function deletePrediction(matchId) {
    delete predictions[matchId];
    savePredictions(predictions);
    renderResolvedFromStorageOnly();
    if (latestGames.length > 0) {
      renderPendingMatches(latestGames);
      renderResolvedComparisons(latestGames);
    }
  }

  function wireDeleteButtons() {
    resolvedListEl.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', () => deletePrediction(button.dataset.delete));
    });
  }

  function renderResolvedFromStorageOnly() {
    const entries = Object.entries(predictions);
    resolvedListEl.innerHTML =
      entries.length === 0
        ? '<p class="empty-hint">Todavía no ha guardado predicciones.</p>'
        : entries
            .map(
              ([matchId, prediction]) => `
                <li class="prediction-row" data-match="${matchId}">
                  <span class="prediction-row__text">Partido #${matchId}: predicción ${prediction.home}-${prediction.away}</span>
                  <span class="badge">cargando resultado real…</span>
                  <button type="button" class="prediction-row__delete" data-delete="${matchId}" aria-label="Eliminar esta predicción" title="Eliminar esta predicción">✕</button>
                </li>
              `
            )
            .join('');
    wireDeleteButtons();
  }

  function renderPendingMatches(games) {
    const pending = games.filter((game) => !isTrue(game.finished));
    pendingListEl.innerHTML =
      pending.length === 0
        ? '<p class="empty-hint">No hay partidos pendientes.</p>'
        : pending
            .map((game) => {
              const existing = predictions[game.id];
              const homeLabel = describeMatchSide(game, 'home');
              const awayLabel = describeMatchSide(game, 'away');
              return `
                <li class="pending-row">
                  <span>${escapeHtml(homeLabel)} vs ${escapeHtml(awayLabel)}</span>
                  <input type="number" min="0" class="score-input" data-match="${game.id}" data-side="home" value="${existing?.home ?? ''}" placeholder="0" />
                  <span>-</span>
                  <input type="number" min="0" class="score-input" data-match="${game.id}" data-side="away" value="${existing?.away ?? ''}" placeholder="0" />
                  <button type="button" class="btn btn-secondary btn-small" data-save="${game.id}">Guardar predicción</button>
                </li>
              `;
            })
            .join('');

    pendingListEl.querySelectorAll('[data-save]').forEach((button) => {
      button.addEventListener('click', () => {
        const matchId = button.dataset.save;
        const homeInput = pendingListEl.querySelector(`[data-match="${matchId}"][data-side="home"]`);
        const awayInput = pendingListEl.querySelector(`[data-match="${matchId}"][data-side="away"]`);
        const home = Number(homeInput.value);
        const away = Number(awayInput.value);
        if (Number.isNaN(home) || Number.isNaN(away)) return;
        predictions[matchId] = { home, away };
        savePredictions(predictions);
        renderResolvedFromStorageOnly();
      });
    });
  }

  function renderResolvedComparisons(games) {
    const finishedById = new Map(games.filter((game) => isTrue(game.finished)).map((game) => [game.id, game]));

    const entries = Object.entries(predictions);
    resolvedListEl.innerHTML =
      entries.length === 0
        ? '<p class="empty-hint">Todavía no ha guardado predicciones.</p>'
        : entries
            .map(([matchId, prediction]) => {
              const game = finishedById.get(matchId);
              if (!game) {
                return `
                  <li class="prediction-row">
                    <span class="prediction-row__text">Partido #${matchId}: predicción ${prediction.home}-${prediction.away}</span>
                    <span class="badge">aún no finaliza</span>
                    <button type="button" class="prediction-row__delete" data-delete="${matchId}" aria-label="Eliminar esta predicción" title="Eliminar esta predicción">✕</button>
                  </li>
                `;
              }
              const actualHome = Number(game.home_score);
              const actualAway = Number(game.away_score);
              const outcome = classifyPrediction(prediction, actualHome, actualAway);

              return `
                <li class="prediction-row">
                  <span class="prediction-row__text">
                    ${escapeHtml(game.home_team_name_en)} ${actualHome}-${actualAway} ${escapeHtml(game.away_team_name_en)}
                    — predicción: ${prediction.home}-${prediction.away}
                  </span>
                  <span class="badge badge--${outcome.className}">${outcome.label}</span>
                  <button type="button" class="prediction-row__delete" data-delete="${matchId}" aria-label="Eliminar esta predicción" title="Eliminar esta predicción">✕</button>
                </li>
              `;
            })
            .join('');
    wireDeleteButtons();
  }
}

function classifyPrediction(prediction, actualHome, actualAway) {
  if (prediction.home === actualHome && prediction.away === actualAway) {
    return { label: 'Marcador exacto', className: 'success' };
  }
  const predictedOutcome = outcomeOf(prediction.home, prediction.away);
  const actualOutcome = outcomeOf(actualHome, actualAway);
  if (predictedOutcome === actualOutcome) {
    return { label: 'Acertó el resultado', className: 'warning' };
  }
  return { label: 'Falló la predicción', className: 'error' };
}

function outcomeOf(home, away) {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

function loadPredictions() {
  try {
    return JSON.parse(localStorage.getItem(PREDICTIONS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function savePredictions(predictions) {
  try {
    localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(predictions));
  } catch {
    // Si falla, la predicción queda solo en memoria durante esta sesión.
  }
}

function layout() {
  const theme = themeFor('#/quiniela');
  return `
    <div class="content-panel" style="--accent: ${theme.color}; --accent-soft: ${theme.soft};">
      <div id="load-status"></div>

      <div class="two-columns">
        <section>
          <h2>Partidos pendientes</h2>
          <ul id="pending-matches" class="pending-list">
            <li class="empty-hint">Cargando partidos…</li>
          </ul>
        </section>

        <section>
          <div class="section-header">
            <h2>Mis predicciones</h2>
            <button type="button" class="btn btn-ghost btn-small" data-action="clear-predictions">Limpiar predicciones</button>
          </div>
          <ul id="resolved-predictions" class="prediction-list"></ul>
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
