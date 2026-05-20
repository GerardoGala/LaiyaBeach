// app.js
import { initMap } from './map.js';
import { fetchWind } from './wind.js';
import { updateILCA } from './ilca.js';

let map;
let launched = false;
let windIntervalId = null;
let ilcaIntervalId = null;

async function loadConfig() {
  map = initMap();

  // === Global simulation state ===
  window.globalSimulationData = {
    windDirection: 180,
    windSpeed: 0,

    ILCA: {
      heading: 180,   // default heading out to sea
      speed: 0,       // stationary until launch
      tillerAngle: 0,
      lat: 13.669100,
      lon: 121.401117,
      maneuver: null,
      localTime: new Date().toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" }),

      standingRig: {
        mastHeight: 6.0,
        sailType: "ILCA Standard",
        boomLength: 2.7
      },

      runningRig: {
        sheetTension: 0.0,
        vangTension: 0.0,
        cunninghamTension: 0.0,
        rudderAngle: 0
      }
    }
  };

  // ✅ Show initial status immediately
  refreshStatusPanels();

  // Wind update loop (every 5 seconds)
  windIntervalId = setInterval(async () => {
    await fetchWind();
  }, 5000);

  // ILCA + Time update loop (every 1 second)
  ilcaIntervalId = setInterval(() => {
    const now = new Date();
    window.globalSimulationData.ILCA.localTime =
      now.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" });

    if (launched) {
      updateILCA(map);
    }

    refreshStatusPanels();
  }, 1000);
}

// Helper function to update all status panels
function refreshStatusPanels() {
  const windDiv = document.getElementById("windStatus");
  if (windDiv) {
    windDiv.innerHTML = `
      ${window.globalSimulationData.windDirection}°
      at ${window.globalSimulationData.windSpeed} knots
    `;
  }

  const ilcaDiv = document.getElementById("ilcaStatus");
  if (ilcaDiv) {
    ilcaDiv.innerHTML = `
      ${window.globalSimulationData.ILCA.heading}°
      at ${window.globalSimulationData.ILCA.speed} knots
    `;
  }

  const laiyaDiv = document.getElementById("laiyaTime");
  if (laiyaDiv) {
    laiyaDiv.innerHTML = `
      ${window.globalSimulationData.ILCA.localTime}
    `;
  }
}

export function launchSimulation() {
  launched = true;
}

export function stopSimulation() {
  launched = false;
  if (windIntervalId) {
    clearInterval(windIntervalId);
    windIntervalId = null;
  }
  if (ilcaIntervalId) {
    clearInterval(ilcaIntervalId);
    ilcaIntervalId = null;
  }
}

loadConfig();
