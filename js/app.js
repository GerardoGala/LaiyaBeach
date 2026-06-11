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


// --- Clean, flat helper to sync the wind state ---
async function updateWindFromAPI() {
  try {
    const windData = await fetchWind(); // Returns { direction, speed }
    if (windData) {
      window.globalSimulationData.windDirection = Number(windData.direction);
      window.globalSimulationData.windSpeed = Number(windData.speed);
      
      console.log("Wind updated:", window.globalSimulationData.windDirection, window.globalSimulationData.windSpeed);
    }
  } catch (err) {
    console.error("Wind fetch failed:", err);
  }
}



// Launch simulation
export function launchSimulation() {
  launched = true;
  fetchWind();

  // ✅ ILCA stuck in irons
  window.globalSimulationData.ILCA.heading = (0) % 360;
  window.globalSimulationData.ILCA.speed = 0;



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

  if (rel <= 44)  return "In Irons";       // Directly into the wind (0° - 45°)
  if (rel <= 60)  return "Close Hauled";   // Tightest angle to sail (45° - 60°)
  if (rel <= 80)  return "Close Reach";    // Heading slightly upwind (60° - 80°)
  if (rel <= 100) return "Beam Reach";     // Wind directly across the beam (80° - 100°)
  if (rel <= 150) return "Broad Reach";    // Wind coming from behind/side (100° - 150°)
  return "Running";                        // Sailing dead downwind (150° - 180°)
}

function applyControls(pointOfSail, windSpeed, controls) {
  let baseFactor = 0.5; // Baseline physics efficiency
  let modifier = 1.0;   // Accumulator for trim modifiers
  controls.leeway = 0;  // Default sideways slip

  // --- INTERFACE TRANSLATION LAYER (Normalized to 0.0 to 1.0) ---
  // GUI Input scale: -2, -1, 0, 1, 2
  const v = (controls.vang + 2) / 4;          // 0.0 (Tight) to 1.0 (Loose)
  const d = (controls.downhaul + 2) / 4;      // 0.0 (Tight) to 1.0 (Loose)
  const o = (controls.outhaul + 2) / 4;        // 0.0 (Tight) to 1.0 (Loose)
  const db = controls.daggerboard;            // -2 (Up) to 2 (Down)
  const sheet = controls.sheet;               // 0 to 90+

  /**
   * Helper: Calculates a smooth penalty curve based on distance from a "sweet spot".
   * Perfect match = 1.0. Getting farther away drops the multiplier smoothly.
   */
  function getTrimMultiplier(currentValue, targetValue, tolerance = 0.2, penaltyWeight = 0.4) {
    const deviation = Math.abs(currentValue - targetValue);
    if (deviation <= tolerance) {
      return 1.05 - (deviation * 0.1); // Small bonus for being near perfect
    }
    return Math.max(0.5, 1.0 - (deviation - tolerance) * penaltyWeight);
  }

  switch(pointOfSail) {
    case "In Irons":
      return 0.0; // Hard stall, zero speed

    case "Close Hauled":
      baseFactor = 0.7;

      // --- Sheet (Needs block-to-block tight trim upwind: Target 5) ---
      if (sheet <= 15) {
        modifier *= 1.1 - (sheet * 0.01); // Deeper optimization: closer to 0 is faster
      } else {
        modifier *= Math.max(0.5, 1.1 - ((sheet - 15) * 0.02)); // Harsh progressive penalty for easing
      }

      // --- Controls (Upwind wants flat sail: Vang tight (0.0), Downhaul tight (0.1), Outhaul flat (0.0)) ---
      modifier *= getTrimMultiplier(v, 0.0, 0.1, 0.5); // Vang
      modifier *= getTrimMultiplier(d, 0.1, 0.1, 0.4); // Downhaul (Cunningham)
      modifier *= getTrimMultiplier(o, 0.0, 0.1, 0.4); // Outhaul

      // --- Sailor Position ---
      if (controls.sailorPosition === "Hike Hard") modifier *= 1.08;
      else if (controls.sailorPosition === "Neutral") modifier *= 0.95;
      else if (controls.sailorPosition === "Aft") modifier *= 0.85;

      // --- Daggerboard (Must be fully down: 2) ---
      // Progression gives every discrete step (-2, -1, 0, 1, 2) unique behavior
      modifier *= (0.50 + (db + 2) * 0.1375); // Scales from 0.50 at db=-2 up to 1.05 at db=2
      controls.leeway = Math.max(2, 2 + (2 - db) * 8.25); // Scales nicely from 2° down to 35° leeway
      break;

    case "Close Reach":
      baseFactor = 1.0;

      // --- Sheet (Eased slightly: Target 25) ---
      modifier *= getTrimMultiplier(sheet / 90, 25 / 90, 0.05, 0.6);

      // --- Controls (Slightly relaxed for power: Vang 0.3, Downhaul 0.3, Outhaul 0.5) ---
      modifier *= getTrimMultiplier(v, 0.3, 0.15, 0.4);
      modifier *= getTrimMultiplier(d, 0.3, 0.15, 0.3);
      modifier *= getTrimMultiplier(o, 0.5, 0.15, 0.3);

      // --- Daggerboard (Slightly raised to slot 1 to bleed drag) ---
      if (db === 1) { modifier *= 1.05; controls.leeway = 3; }
      else { modifier *= (1.05 - Math.abs(1 - db) * 0.08); controls.leeway = 3 + Math.abs(1 - db) * 6; }

      if (controls.sailorPosition === "Hike Hard") modifier *= 1.05;
      break;

    case "Beam Reach":
      baseFactor = 1.2; // Maximum speed potential

      // --- Sheet (Halfway out: Target 50) ---
      modifier *= getTrimMultiplier(sheet / 90, 50 / 90, 0.08, 0.8);

      // --- Controls (Eased for deep draft/power: Vang 0.5, Downhaul 0.8, Outhaul 0.7) ---
      modifier *= getTrimMultiplier(v, 0.5, 0.15, 0.4);
      modifier *= getTrimMultiplier(d, 0.8, 0.15, 0.3);
      modifier *= getTrimMultiplier(o, 0.7, 0.15, 0.3);

      // --- Daggerboard (Sweet spot is halfway up: 0) ---
      modifier *= (1.05 - Math.abs(0 - db) * 0.06); 
      controls.leeway = 3 + Math.abs(0 - db) * 4;

      if (controls.sailorPosition === "Hike Hard") modifier *= 1.05;
      break;

    case "Broad Reach":
      baseFactor = 1.0;

      // --- Sheet (Eased deep: Target 75) ---
      modifier *= getTrimMultiplier(sheet / 90, 75 / 90, 0.08, 0.7);

      // --- Controls (Very loose downwind profile: Vang 0.8, Downhaul 1.0, Outhaul 0.9) ---
      modifier *= getTrimMultiplier(v, 0.8, 0.15, 0.3);
      modifier *= getTrimMultiplier(d, 1.0, 0.10, 0.3);
      modifier *= getTrimMultiplier(o, 0.9, 0.10, 0.3);

      // --- Daggerboard (Raised high to slot -1 to drop skin friction drag) ---
      modifier *= (1.06 - Math.abs(-1 - db) * 0.06);
      controls.leeway = 2 + Math.abs(-1 - db) * 2;

      if (controls.sailorPosition === "Neutral") modifier *= 1.03;
      break;

    case "Running":
      baseFactor = 0.8;

      // --- Sheet (Fully squared out: Target 90) ---
      if (sheet >= 85) {
        modifier *= 1.1;
      } else {
        modifier *= Math.max(0.5, 1.1 - ((85 - sheet) * 0.015)); // Drastic performance loss if sheeted tight
      }

      // --- Controls (Vang 0.5 to control leech twist, Downhaul 1.0 loose, Outhaul 1.0 full bag) ---
      modifier *= getTrimMultiplier(v, 0.5, 0.15, 0.4); // Too loose means boom sky-rockets; too tight chokes boat
      modifier *= getTrimMultiplier(d, 1.0, 0.10, 0.2);
      modifier *= getTrimMultiplier(o, 1.0, 0.10, 0.2);

      // --- Daggerboard (Fully UP (-2) for absolute minimal drag downwind) ---
      modifier *= (1.10 - Math.abs(-2 - db) * 0.05); // Step-by-step performance penalty for keeping board down
      controls.leeway = 1; // Sideways slip is negligible when traveling dead downwind
      
      if (controls.sailorPosition === "Aft") modifier *= 1.05;
      break;
  }

  // Final performance matrix processing
  const finalSpeedFactor = baseFactor * modifier;
  return Math.min(windSpeed * finalSpeedFactor, 12);
}

