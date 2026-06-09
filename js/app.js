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
  fetchWind();
  //06/09/20026 default to 0 for now
  //const windDirection = window.globalSimulationData.windDirection;

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

  // --- INTERFACE TRANSLATION LAYER ---
  // -2 (FLAT / TIGHT) -> 0.0 (Tight controls: Vang hard, Downhaul flat)
  //  0 (BASE)         -> 0.5
  //  2 (FULL / LOOSE) -> 1.0 (Loose controls: Blown out, deep draft)
  const v = (controls.vang + 2) / 4;
  const d = (controls.downhaul + 2) / 4;
  const o = (controls.outhaul + 2) / 4;

  switch(pointOfSail) {
    case "In Irons":
      baseFactor = 0.0; // Stalled directly into the wind
      break;

    case "Close Hauled":
      baseFactor = 0.7; // Hard upwind target speed

      // --- Sheet (ILCA upwind wants blocks nearly touching: tight 0-15) ---
      if (controls.sheet <= 15) modifier *= 1.1;
      else if (controls.sheet > 25) modifier *= 0.7; // Too loose, luffing

      // --- Vang (Wants to be hard/tight upwind to flatten sail: v < 0.3) ---
      if (v <= 0.3) modifier *= 1.05;
      else if (v > 0.6) modifier *= 0.9; // Too loose, boat over-heels

      // --- Downhaul/Cunningham (Tight upwind to pull draft forward) ---
      if (d <= 0.3) modifier *= 1.05;

      // --- Outhaul (FLAT upwind to reduce drag/flatten bottom) ---
      if (o <= 0.3) modifier *= 1.05;

      // --- Sailor Position (Crucial upwind to keep boat flat) ---
      if (controls.sailorPosition === "Hike Hard") modifier *= 1.08;
      else if (controls.sailorPosition === "Aft") modifier *= 0.85; // Bow lifts, loses tracking

      // --- Daggerboard (Fully DOWN (2) to prevent sideways sliding) ---
      switch (controls.daggerboard) {
        case -2: modifier *= 0.50; controls.leeway = 35; break; // Board up upwind = disaster
        case -1: modifier *= 0.70; controls.leeway = 20; break;
        case 0:  modifier *= 0.85; controls.leeway = 12; break;
        case 1:  modifier *= 0.95; controls.leeway = 5;  break;
        case 2:  modifier *= 1.05; controls.leeway = 2;  break; // Optimal tracking
      }
      break;

    case "Close Reach":
      baseFactor = 1.0;

      // --- Sheet (Eased slightly from upwind: 15-35) ---
      if (controls.sheet > 15 && controls.sheet <= 35) modifier *= 1.1;
      else if (controls.sheet <= 15) modifier *= 0.8; // Over-sheeted
      else if (controls.sheet > 45) modifier *= 0.7;  // Under-sheeted

      // --- Vang (Slightly eased from upwind) ---
      if (v > 0.2 && v <= 0.5) modifier *= 1.05;

      // --- Downhaul (Eased slightly for power) ---
      if (d > 0.2 && d <= 0.5) modifier *= 1.03;

      // --- Outhaul (Wants some depth/power) ---
      if (o > 0.4 && o <= 0.7) modifier *= 1.05;

      // --- Sailor Position ---
      if (controls.sailorPosition === "Hike Hard") modifier *= 1.05;
      break;

    case "Beam Reach":
      baseFactor = 1.2; // Fastest point of sail in an ILCA

      // --- Sheet (Eased halfway out: 40-60) ---
      if (controls.sheet >= 40 && controls.sheet <= 60) modifier *= 1.1;
      else if (controls.sheet < 35) modifier *= 0.6;   // Over-sheeted, stalling
      else if (controls.sheet > 70) modifier *= 0.6;   // Under-sheeted, flapping

      // --- Daggerboard (Halfway up balances speed vs plane stability) ---
      switch (controls.daggerboard) {
        case -2: modifier *= 0.85; controls.leeway = 15; break; 
        case -1: modifier *= 1.00; controls.leeway = 8;  break;
        case 0:  modifier *= 1.05; controls.leeway = 4;  break; // Sweet spot
        case 1:  modifier *= 1.00; controls.leeway = 2;  break;
        case 2:  modifier *= 0.92; controls.leeway = 1;  break; // Too much drag
      }

      // --- Vang (Eased to twist the top of the sail) ---
      if (v > 0.4 && v <= 0.7) modifier *= 1.03;

      // --- Downhaul (Loose for max sail power/fullness) ---
      if (d > 0.6) modifier *= 1.05;

      // --- Outhaul (Deep/Full for power) ---
      if (o > 0.6) modifier *= 1.05;

      // --- Sailor Position ---
      if (controls.sailorPosition === "Hike Hard") modifier *= 1.05;
      break;

    case "Broad Reach":
      baseFactor = 1.0;

      // --- Sheet (Eased well out: 65-85) ---
      if (controls.sheet >= 65 && controls.sheet <= 85) modifier *= 1.1;
      else if (controls.sheet < 55) modifier *= 0.7;
      else if (controls.sheet > 90) modifier *= 0.7;

      // --- Vang (Loose/Eased downwind to allow sail profile to open) ---
      if (v > 0.6) modifier *= 1.05;

      // --- Downhaul (Completely loose) ---
      if (d > 0.7) modifier *= 1.05;

      // --- Outhaul (Deep/Full for power) ---
      if (o > 0.7) modifier *= 1.05;

      // --- Sailor Position ---
      if (controls.sailorPosition === "Neutral") modifier *= 1.03;
      break;

    case "Running":
      baseFactor = 0.8; // Sailing dead downwind is slower than reaching

      // --- Sheet (Eased fully out to 90 degrees: > 85) ---
      if (controls.sheet >= 85) modifier *= 1.1;
      else if (controls.sheet < 75) modifier *= 0.6; // Sheeted too tight downwind kills speed

      // --- Daggerboard (Fully UP (-2) minimizes underwater drag profile) ---
      switch (controls.daggerboard) {
        case -2: modifier *= 1.10; controls.leeway = 1; break; // Best downwind setting
        case -1: modifier *= 1.05; controls.leeway = 1; break;
        case 0:  modifier *= 1.00; controls.leeway = 1; break;
        case 1:  modifier *= 0.95; controls.leeway = 1; break;
        case 2:  modifier *= 0.88; controls.leeway = 1; break; // Heavy drag penalty
      }

      // --- Vang (Slightly tight downwind to stop the boom from lifting up too high) ---
      if (v >= 0.4 && v <= 0.7) modifier *= 1.05;

      // --- Downhaul (Completely loose) ---
      if (d > 0.7) modifier *= 1.03;

      // --- Outhaul (Loose/Baggy for maximum area projection) ---
      if (o > 0.7) modifier *= 1.05;

      // --- Sailor Position (Aft to keep the bow from digging into waves) ---
      if (controls.sailorPosition === "Aft") modifier *= 1.05;
      break;
  }

  // Calculate clean output speed factor capped by wind ceiling
  const finalSpeedFactor = baseFactor * modifier;
  return Math.min(windSpeed * finalSpeedFactor, 12);
}
