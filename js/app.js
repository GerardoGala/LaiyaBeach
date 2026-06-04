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

  // --- Point of Sail ---
  const pointOfSail = getPointOfSail(windDir, heading);
  window.globalSimulationData.ILCA.pointOfSail = pointOfSail;  // <-- store it
  
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
  // Absolute difference between heading and wind direction
  let rel = Math.abs(heading - windDir) % 360;
  if (rel > 180) rel = 360 - rel; // fold into 0–180

  if (rel <=30) return "Running";          // dead downwind
  if (rel <= 60) return "Broad Reach";      // ~30–60°
  if (rel <= 90) return "Beam Reach";       // ~60–90°
  if (rel <= 120) return "Close Reach";     // ~90–120°
  if (rel <= 150) return "Close Hauled";    // ~120–150°
  return "In Irons";                       // ~150–180°                   // ~0–30° → dead downwind
}

function applyControls(pointOfSail, windSpeed, controls) {
  let speedFactor = 0.5; // baseline efficiency
  controls.leeway = 0;   // default sideways slip

  switch(pointOfSail) {
    case "In Irons":
      speedFactor = 0.0; // stalled
      break;

    case "Close Hauled":
      speedFactor = 0.7;

      // --- sheet ---
      if (controls.sheet < 25) speedFactor *= 0.9;
      else if (controls.sheet > 40) speedFactor *= 0.7;

      // --- vang ---
      if (controls.vang > 0.7) speedFactor *= 1.1;

      // --- downhaul ---
      if (controls.downhaul > 0.7) speedFactor *= 1.05;

      // --- outhaul ---
      if (controls.outhaul > 0.7) speedFactor *= 1.05;

      // --- sailor position ---
      if (controls.sailorPosition === "Hike Hard") speedFactor *= 1.05;

      // --- daggerboard ---
      switch (controls.daggerboard) {
        case -2: speedFactor *= 0.95; controls.leeway = 2; break;
        case -1: speedFactor *= 0.97; controls.leeway = 5; break;
        case 0:  speedFactor *= 1.0;  controls.leeway = 10; break;
        case 1:  speedFactor *= 1.02; controls.leeway = 15; break;
        case 2:  speedFactor *= 1.05; controls.leeway = 25; break;
      }
      break;

    case "Close Reach":
      speedFactor = 1.0;

      // --- sheet ---
      if (controls.sheet >= 30 && controls.sheet <= 50) speedFactor *= 1.1;
      else if (controls.sheet < 25) speedFactor *= 0.8;
      else if (controls.sheet > 60) speedFactor *= 0.6;

      // --- vang ---
      if (controls.vang > 0.5) speedFactor *= 1.05;

      // --- downhaul ---
      if (controls.downhaul > 0.5) speedFactor *= 1.03;

      // --- outhaul ---
      if (controls.outhaul < 0.3) speedFactor *= 1.05;

      // --- sailor position ---
      if (controls.sailorPosition === "Hike Hard") speedFactor *= 1.03;
      break;

    case "Beam Reach":
      speedFactor = 1.2;

      // --- sheet ---
      if (controls.sheet >= 20 && controls.sheet <= 40) speedFactor *= 1.1;
      else if (controls.sheet > 70) speedFactor *= 0.5;
      else if (controls.sheet < 20) speedFactor *= 0.7;

      // --- daggerboard ---
      switch (controls.daggerboard) {
        case -2: speedFactor *= 0.95; controls.leeway = 2; break;
        case -1: speedFactor *= 0.97; controls.leeway = 5; break;
        case 0:  speedFactor *= 1.0;  controls.leeway = 10; break;
        case 1:  speedFactor *= 1.03; controls.leeway = 15; break;
        case 2:  speedFactor *= 1.05; controls.leeway = 20; break;
      }

      // --- vang ---
      if (controls.vang > 0.5) speedFactor *= 1.03;

      // --- downhaul ---
      if (controls.downhaul > 0.5) speedFactor *= 1.02;

      // --- outhaul ---
      if (controls.outhaul < 0.4) speedFactor *= 1.05;

      // --- sailor position ---
      if (controls.sailorPosition === "Hike Hard") speedFactor *= 1.05;
      break;

    case "Broad Reach":
      speedFactor = 1.0;

      // --- sheet ---
      if (controls.sheet >= 40 && controls.sheet <= 70) speedFactor *= 1.05;
      else if (controls.sheet > 80) speedFactor *= 0.6;
      else if (controls.sheet < 30) speedFactor *= 0.8;

      // --- vang ---
      if (controls.vang < 0.4) speedFactor *= 1.05;

      // --- downhaul ---
      if (controls.downhaul < 0.4) speedFactor *= 1.03;

      // --- outhaul ---
      if (controls.outhaul < 0.3) speedFactor *= 1.05;

      // --- sailor position ---
      if (controls.sailorPosition === "Neutral") speedFactor *= 1.02;
      break;

    case "Running":
      speedFactor = 0.8;

      // --- sheet ---
      if (controls.sheet > 70) speedFactor *= 1.1;
      else if (controls.sheet < 60) speedFactor *= 0.6;

      // --- daggerboard ---
      switch (controls.daggerboard) {
        case -2: speedFactor *= 0.95; controls.leeway = 2; break;
        case -1: speedFactor *= 0.97; controls.leeway = 5; break;
        case 0:  speedFactor *= 1.0;  controls.leeway = 10; break;
        case 1:  speedFactor *= 1.03; controls.leeway = 15; break;
        case 2:  speedFactor *= 1.05; controls.leeway = 20; break;
      }

      // --- vang ---
      if (controls.vang < 0.2) speedFactor *= 1.05;

      // --- downhaul ---
      if (controls.downhaul < 0.3) speedFactor *= 1.03;

      // --- outhaul ---
      if (controls.outhaul < 0.3) speedFactor *= 1.05;

      // --- sailor position ---
      if (controls.sailorPosition === "Aft") speedFactor *= 1.02;
      break;
  }

  // Cap speed by wind strength
  return Math.min(windSpeed * speedFactor, 12);
}






