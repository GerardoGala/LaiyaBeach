// MODULE IMPORTS
// ===================================================================

// Side-effect imports (setup event listeners, controls, etc.)
import './rigging.js';
import './launch.js';
import './running.js';
import './leaderboard.js';

// Pure modules
import { map } from './map.js';
import { wind } from './wind.js';
import { boat } from './boat.js';
import { game } from './game.js';

// Debug helper
window.debug = { map, wind, boat, game };

document.addEventListener('DOMContentLoaded', async () => {
  console.log("ILCA Simulator starting...");

  // Initialize map
  await map.init();

  // Initialize wind loop
  wind.init();

  // Initialize boat + game logic
  boat.init();
  game.init();
});
