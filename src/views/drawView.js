// src/views/drawView.js
//
// 2.5 Simulador de Sorteo Loco
//
// Reto de resiliencia: el sorteo se guarda en localStorage. Si el usuario
// refresca antes de pedir un sorteo nuevo, ve el mismo sorteo ficticio de
// antes en vez de una pantalla vacía. /get/teams solo se llama una vez por
// sesión (en realidad, una vez por navegador, hasta que se fuerce la
// recarga), y "Repetir sorteo" jamás vuelve a pedir datos a la API: solo
// reordena el arreglo de 48 equipos que ya se tiene en memoria.

import { extractTeamsArray } from '../api/worldCupApi.js';
import { fisherYatesShuffle, chunkInto } from '../utils/fisherYates.js';
import { themeFor } from '../theme.js';

const DRAW_STORAGE_KEY = 'wc26_crazy_draw';
const GROUPS_COUNT = 12;
const TEAMS_PER_GROUP = 4;

export async function renderDrawView(container, { worldCupApi }) {
  container.innerHTML = layout();

  const groupsEl = container.querySelector('#draw-groups');
  const statusEl = container.querySelector('#draw-status');

  let teams = [];

  const stored = loadDraw();
  if (stored) {
    teams = stored.teams;
    renderGroups(stored.groups);
    statusEl.textContent = `Sorteo cargado desde localStorage (guardado el ${new Date(stored.drawnAt).toLocaleString('es-CR')}). No se volvió a llamar la API.`;
  } else {
    await fetchTeamsAndDraw();
  }

  container.querySelector('[data-action="repeat-draw"]').addEventListener('click', () => {
    if (teams.length === 0) return;
    const groups = buildGroups(teams);
    persistDraw(teams, groups);
    renderGroups(groups);
    statusEl.textContent = 'Sorteo repetido sin volver a llamar la API: se reordenó el mismo arreglo de 48 equipos.';
  });

  container.querySelector('[data-action="reload-from-api"]').addEventListener('click', async () => {
    await fetchTeamsAndDraw(true);
  });

  async function fetchTeamsAndDraw(forceReload = false) {
    statusEl.textContent = 'Cargando los 48 equipos desde la API…';
    try {
      const { data, stale } = await worldCupApi.getTeams();
      teams = extractTeamsArray(data);
      const groups = buildGroups(teams);
      persistDraw(teams, groups);
      renderGroups(groups);
      statusEl.textContent = stale
        ? 'Se usaron datos cacheados de equipos (la API no respondió). Sorteo generado igualmente.'
        : forceReload
          ? 'Equipos recargados desde la API y sorteo generado de nuevo.'
          : 'Equipos cargados y sorteo generado.';
    } catch (error) {
      statusEl.textContent = `No se pudo cargar la lista de equipos: ${error.message}`;
    }
  }

  function buildGroups(teamList) {
    const shuffled = fisherYatesShuffle(teamList);
    return chunkInto(shuffled, TEAMS_PER_GROUP).slice(0, GROUPS_COUNT);
  }

  function renderGroups(groups) {
    groupsEl.innerHTML = groups
      .map(
        (group, index) => `
          <article class="draw-group">
            <h3>Grupo Ficticio ${index + 1}</h3>
            <ul>
              ${group
                .map(
                  (team) => `
                    <li>
                      <img src="${team.flag}" alt="" class="flag" loading="lazy" />
                      ${escapeHtml(team.name_en ?? team.id)}
                    </li>
                  `
                )
                .join('')}
            </ul>
          </article>
        `
      )
      .join('');
  }
}

function persistDraw(teams, groups) {
  try {
    localStorage.setItem(DRAW_STORAGE_KEY, JSON.stringify({ teams, groups, drawnAt: Date.now() }));
  } catch {
    // Si falla, el sorteo actual se ve igual pero no sobrevivirá a un refresh.
  }
}

function loadDraw() {
  try {
    const raw = localStorage.getItem(DRAW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function layout() {
  const theme = themeFor('#/draw');
  return `
    <div class="content-panel" style="--accent: ${theme.color}; --accent-soft: ${theme.soft};">
      <div class="draw-controls">
        <button type="button" class="btn btn-primary" data-action="repeat-draw">🔀 Repetir sorteo</button>
        <button type="button" class="btn btn-ghost" data-action="reload-from-api">Forzar recarga de equipos desde la API</button>
      </div>

      <p id="draw-status" class="polling-status" role="status"></p>

      <div id="draw-groups" class="draw-grid"></div>
    </div>
  `;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}
