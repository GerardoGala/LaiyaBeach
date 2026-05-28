// app.js
import { initMap, updateWindControl, updateILCAControl } from './map.js';
import { fetchWind } from './wind.js';
import { updateILCA } from './ilcaMain.js';

let map;
let launched = false;
let windIntervalId = null;
let ilcaIntervalId = null;

async function loadConfig() {
  map = initMap();

  // === Global simulation state ===
  window.globalSimulationData = {
    windDirection: 180,
    windSpeed: 0, // always numeric

    ILCA: {
      heading: 180,
      speed: 0,
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

  // ✅ Fetch wind immediately so it's visible right away
  await updateWindFromAPI();

  // ✅ Show initial status immediately
  refreshStatusPanels();
  updateWindControl(map);
  updateILCAControl();

  // Wind update loop (every 5 seconds)
  windIntervalId = setInterval(async () => {
    await updateWindFromAPI();
    refreshStatusPanels();
    updateWindControl(map);
    updateILCAControl();
  }, 5000);

  // ILCA + Time update loop (every 1 second)
  ilcaIntervalId = setInterval(() => {
    const now = new Date();
    window.globalSimulationData.ILCA.localTime =
      now.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" });

    if (launched) {
      updateILCA(map);

      const windSpeed = window.globalSimulationData.windSpeed; // numeric
      const efficiency = 0.6;
      const initialSpeed = Math.min(windSpeed * efficiency, 12);

      window.globalSimulationData.ILCA.speed = initialSpeed;
    }

    refreshStatusPanels();
    updateILCAControl();
  }, 1000);
}

// --- Helper to fetch wind and update global state ---
async function updateWindFromAPI() {
  try {
    const windData = await fetchWind(); 
    // Ensure numeric assignment
    if (windData) {
      window.globalSimulationData.windDirection = Number(windData.direction) || 0;
      window.globalSimulationData.windSpeed = Number(windData.speed) || 0;
      console.log("Wind updated:", window.globalSimulationData.windDirection, window.globalSimulationData.windSpeed);
    }
  } catch (err) {
    console.error("Wind fetch failed:", err);
  }
}

// Helper function to update all status panels
function refreshStatusPanels() {
  const windDiv = document.getElementById("windStatus");
  if (windDiv) {
    windDiv.innerHTML = `Wind Status: 
      ${window.globalSimulationData.windDirection}°
      at ${window.globalSimulationData.windSpeed} knots
    `;
  }

  const ilcaDiv = document.getElementById("ilcaStatus");
  if (ilcaDiv) {
    ilcaDiv.innerHTML = `ILCA: 
      ${window.globalSimulationData.ILCA.heading}°
      at ${window.globalSimulationData.ILCA.speed} knots
    `;
  }
}

// Launch simulation
export function launchSimulation() {
  launched = true;
  window.globalSimulationData.ILCA.speed = 5;
  window.globalSimulationData.ILCA.timer = 0;
  window.globalSimulationData.ILCA.displayTimer = "0:00";

  const timerDiv = document.getElementById("timer");

  window.globalSimulationData.ILCA._timerInterval = setInterval(() => {
    if (launched) {
      window.globalSimulationData.ILCA.timer++;
      const minutes = Math.floor(window.globalSimulationData.ILCA.timer / 60);
      const seconds = window.globalSimulationData.ILCA.timer % 60;
      window.globalSimulationData.ILCA.displayTimer =
        `${minutes}:${seconds.toString().padStart(2, "0")}`;

      if (timerDiv) {
        timerDiv.textContent = "Timer: " + window.globalSimulationData.ILCA.displayTimer;
      }
    }
  }, 1000);
}

// Stop simulation
export function stopSimulation() {
  launched = false;
  clearInterval(window.globalSimulationData.ILCA._timerInterval);
  if (windIntervalId) {
    clearInterval(windIntervalId);
    windIntervalId = null;
  }
  if (ilcaIntervalId) {
    clearInterval(ilcaIntervalId);
    ilcaIntervalId = null;
  }
}

window.launchSimulation = launchSimulation;
window.stopSimulation = stopSimulation;

loadConfig();
