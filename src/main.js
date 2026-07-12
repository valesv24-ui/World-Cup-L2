// src/main.js
import './style.css';

import { ApiClient } from './api/httpClient.js';
import { AuthService } from './api/authService.js';
import { WorldCupApi } from './api/worldCupApi.js';
import { showSessionExpiredModal } from './components/modal.js';
import { updateRateLimitBanner } from './components/rateLimitBanner.js';
import { registerRoute, setAppContext, startRouter, navigateTo } from './router.js';

import { renderLoginView } from './views/loginView.js';
import { renderMenuView } from './views/menuView.js';
import { renderDreamTeamView } from './views/dreamTeamView.js';
import { renderHeadToHeadView } from './views/headToHeadView.js';
import { renderSurpriseTrackerView } from './views/surpriseTrackerView.js';
import { renderQuinielaView } from './views/quinielaView.js';
import { renderDrawView } from './views/drawView.js';

const client = new ApiClient({
  onSessionExpired: () => {
    authService.logout();
    showSessionExpiredModal(() => navigateTo('#/login'));
  },
  onRateLimitTick: updateRateLimitBanner,
});

const authService = new AuthService(client);
const worldCupApi = new WorldCupApi(client);

const context = { client, authService, worldCupApi, navigateTo };

const appContainer = document.getElementById('app');
setAppContext(context, appContainer);

registerRoute('#/login', renderLoginView);
registerRoute('#/menu', renderMenuView);
registerRoute('#/dream-team', renderDreamTeamView);
registerRoute('#/head-to-head', renderHeadToHeadView);
registerRoute('#/surprise-tracker', renderSurpriseTrackerView);
registerRoute('#/quiniela', renderQuinielaView);
registerRoute('#/draw', renderDrawView);

startRouter();
