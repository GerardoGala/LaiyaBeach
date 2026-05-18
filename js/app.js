import { initMap } from './map.js';
import { initBoatLoop } from './boat.js';
import { fetchWind } from './wind.js';
import { updateILCA } from './ilca.js';

let map;
let launched = false;
let simulationIntervalId = null;

async function loadConfig() {
  // Initialize map
  map = initMap();

  // Initialize global state
  window.simulationData.tillerAngle = 0;
  window.simulationData.windDeg = 180;   // default heading
  window.simulationData.windKnots = 0;
  window.simulationData.speedKnots = 0;

  // Start unified loop immediately
  simulationIntervalId = setInterval(async () => {
    // Refresh wind
    const { windDeg, windKnots } = await fetchWind();
    window.simulationData.windDeg = windDeg;
    window.simulationData.windKnots = windKnots;

    // If not launched, keep speed at 0
    if (!launched) {
      window.simulationData.speedKnots = 0;
    }

    // Update ILCA status (always)
    updateILCA(map);

    // Spawn ILCA marker only after launch
    if (launched) {
      // speedKnots can be set to a fixed value or calculated
      window.simulationData.speedKnots = 20;
      updateILCA(map);
    }
  }, 5000);
}

// Called when player clicks Launch
export function launchSimulation() {
  if (launched) return;
  launched = true;

  // Start ILCA boat loop
  initBoatLoop(map);
}

// Optional: stop simulation
export function stopSimulation() {
  launched = false;
  if (simulationIntervalId) {
    clearInterval(simulationIntervalId);
    simulationIntervalId = null;
  }
}

loadConfig();
