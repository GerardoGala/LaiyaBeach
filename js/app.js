import { initMap } from './map.js';
import { fetchWind } from './wind.js';
import { updateILCA } from './ilca.js';

let map;
let launched = false;
let simulationIntervalId = null;

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

  // Unified loop every 5 seconds
  simulationIntervalId = setInterval(async () => {
    await fetchWind();

    // Update Laiya local time every tick
    const now = new Date();
    window.globalSimulationData.localTime = now.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" });

    // If launched, update speed/heading and draw ILCA
    if (launched) {
      window.globalSimulationData.speed = 20;
      window.globalSimulationData.heading = (window.globalSimulationData.heading + 5) % 360;
      updateILCA(map);
    }

    // ✅ Always refresh status panels
    refreshStatusPanels();
  }, 5000);
}

// Helper function to update all status panels
function refreshStatusPanels() {
  const windDiv = document.getElementById("windStatus");
  if (windDiv) {
    windDiv.innerHTML = `
      Direction: ${window.globalSimulationData.windDirection}°
      <br>Speed: ${window.globalSimulationData.windSpeed} knots
    `;
  }

  const ilcaDiv = document.getElementById("ilcaStatus");
  if (ilcaDiv) {
    ilcaDiv.innerHTML = `
      Heading: ${window.globalSimulationData.heading}°
      <br>Speed: ${window.globalSimulationData.speed} knots
    `;
  }

  const laiyaDiv = document.getElementById("laiyaTime");
  if (laiyaDiv) {
    laiyaDiv.innerHTML = `
      Laiya Time: ${window.globalSimulationData.localTime}
    `;
  }
}

export function launchSimulation() {
  launched = true;
}

export function stopSimulation() {
  launched = false;
  if (simulationIntervalId) {
    clearInterval(simulationIntervalId);
    simulationIntervalId = null;
  }
}

loadConfig();
