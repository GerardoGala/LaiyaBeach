// app.js
import { initMap, updateWindControl, updateILCAControl, updateVMGControl } from './map.js';
import { fetchWind } from './wind.js';
import { updateILCA } from './ilcaMain.js';

let map;
let launched = false;
let masterIntervalId = null;

async function loadConfig() {
  map = initMap();

  // ✅ Fetch wind immediately so overlays show something
  await updateWindFromAPI();

  // ✅ Show initial status immediately
  updateWindControl(map);
  updateILCAControl();
  updateVMGControl();


  // --- Unified master loop (every 1 second) ---
  let tick = 0;
  masterIntervalId = setInterval(async () => {
    tick++;

    // Update wind every 5 seconds
    if (tick % 5 === 0) {
      await updateWindFromAPI();
    }

    // Update ILCA local time
    const now = new Date();
    window.globalSimulationData.ILCA.localTime =
      now.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" });

    // Update ILCA physics if launched
if (launched) {
  updateILCA(map);

  const windSpeed = Number(window.globalSimulationData.windSpeed) || 0;
  const windDir = window.globalSimulationData.windDirection;
  const heading = window.globalSimulationData.ILCA.heading;

  const pointOfSail = getPointOfSail(windDir, heading);

  const controls = window.globalSimulationData.ILCA;
  const newSpeed = applyControls(pointOfSail, windSpeed, controls);

  window.globalSimulationData.ILCA.speed = newSpeed;
}


    // Refresh overlays
    updateWindControl(map);
    updateILCAControl();
    updateVMGControl();
  }, 1000);
}

// --- Helper to fetch wind and update global state ---
async function updateWindFromAPI() {
  try {
    const windData = await fetchWind(); // should return { direction, speed }
    if (windData) {
      window.globalSimulationData.windDirection = Number(windData.direction) || 0;
      window.globalSimulationData.windSpeed = Number(windData.speed) || 0;
      console.log("Wind updated:", window.globalSimulationData.windDirection, window.globalSimulationData.windSpeed);
    }
  } catch (err) {
    console.error("Wind fetch failed:", err);
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
  if (masterIntervalId) {
    clearInterval(masterIntervalId);
    masterIntervalId = null;
  }
}

window.launchSimulation = launchSimulation;
window.stopSimulation = stopSimulation;

loadConfig();


function getPointOfSail(windDir, heading) {
  const rel = (heading - windDir + 360) % 360;
  if (rel <= 45 || rel >= 315) return "closeHauled";
  if (rel <= 90 || rel >= 270) return "beamReach";
  if (rel <= 135 || rel >= 225) return "broadReach";
  return "running";
}

function applyControls(pointOfSail, windSpeed, controls) {
  let speedFactor = 0.5; // baseline efficiency

  switch(pointOfSail) {
    case "closeHauled":
      speedFactor = 0.7;
      if (controls.sheet < 15) speedFactor *= 0.9; // sheet too tight
      if (controls.vang > 0.7) speedFactor *= 1.1; // flatter sail helps
      break;

    case "beamReach":
      speedFactor = 1.2; // fastest point of sail
      if (controls.sheet >= 20 && controls.sheet <= 40) speedFactor *= 1.1;
      if (controls.sailorPosition === "Hike Hard") speedFactor *= 1.05;
      break;

    case "broadReach":
      speedFactor = 1.0;
      if (controls.daggerboard < 0.5) speedFactor *= 1.05; // less drag
      if (controls.outhaul < 0.3) speedFactor *= 1.1; // fuller sail
      break;

    case "running":
      speedFactor = 0.8;
      if (controls.sheet > 70) speedFactor *= 1.1; // parachute effect
      if (controls.vang < 0.2) speedFactor *= 1.05; // max twist
      break;
  }

  // Cap speed by wind strength
  return Math.min(windSpeed * speedFactor, 12);
}
