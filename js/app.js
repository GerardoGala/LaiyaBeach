import { initMap } from './map.js';
import { fetchWind } from './wind.js';
import { updateILCA } from './ilca.js';

let map;
let launched = false;
let windIntervalId = null;
let ilcaIntervalId = null;

async function loadConfig() {
  map = initMap();

  // Initialize global state
  window.globalSimulationData = {
    windDirection: 180,
    windSpeed: 0,
    heading: 180,
    speed: 0,
    tillerAngle: 0,
    lat: 13.669100,
    lon: 121.401117,
    localTime: new Date().toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" })
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
    window.globalSimulationData.localTime = now.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" });

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
      ${window.globalSimulationData.heading}°
      at ${window.globalSimulationData.speed} knots
    `;
  }

  const laiyaDiv = document.getElementById("laiyaTime");
  if (laiyaDiv) {
    laiyaDiv.innerHTML = `
      ${window.globalSimulationData.localTime}
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
