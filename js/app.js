import { initMap } from './map.js';
import { initBoatLoop } from './boat.js';
import { initWind } from './wind.js';
import { updateILCA } from './ilca.js';

let config;
let map;
let launched = false;
let spawnIntervalId = null;

async function loadConfig() {
  const response = await fetch('config.json');
  config = await response.json();

  // Initialize map
  map = initMap(config);

  // Wind can run immediately
  initWind(config);

  // Do NOT start ILCA loop yet
}

// Called when player clicks Launch
export function launchSimulation() {
  if (launched) return; // prevent double launch
  launched = true;

  // Start ILCA boat loop
  initBoatLoop(map, config);

  // Spawn new ILCA instances periodically
  spawnIntervalId = setInterval(() => {
    // Example: heading east at 20 knots
    updateILCA(180, 20);
  }, 5000); // every 5 seconds
}

// Optional: stop spawning if needed
export function stopSimulation() {
  launched = false;
  if (spawnIntervalId) {
    clearInterval(spawnIntervalId);
    spawnIntervalId = null;
  }
}

loadConfig();
