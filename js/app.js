// app.js
import { initMap, updateWindControl, updateILCAControl, updateVMGControl } from './map.js';
import { fetchWind } from './wind.js';
import { updateILCA } from './ilcaMain.js';
import { applyControls } from './physics.js'; // ◄ Imported from separate physics layer

let map;
let launched = false;
let masterIntervalId = null;

async function loadConfig() {
  map = initMap();

  // Fetch wind immediately so overlays show something
  await updateWindFromAPI();

  // Show initial status immediately
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
      // --- Capsize Halting Check ---
      // If physics layer flags a capsize, freeze simulation clocks instantly
      if (window.globalSimulationData.ILCA.capsized) {
        console.warn("Simulation stopped due to capsize.");
        
        // Hide warning bar and clear active loops
        const warningDiv = document.getElementById("heelWarningContainer");
        if (warningDiv) {
          warningDiv.style.display = "none";
          warningDiv.classList.remove("danger-shake");
        }

        clearInterval(window.globalSimulationData.ILCA._timerInterval);
        alert("Boom! You capsized! Make sure to hike out or ease your sheet when the wind picks up.");
        stopSimulation();
        return;
      }

      updateILCA(map);

      const windSpeed = Number(window.globalSimulationData.windSpeed) || 0;
      const windDir = window.globalSimulationData.windDirection;
      const heading = window.globalSimulationData.ILCA.heading;

      // --- Point of Sail ---
      const pointOfSail = getPointOfSail(windDir, heading);
      window.globalSimulationData.ILCA.pointOfSail = pointOfSail;  // <-- store it
      
      const controls = window.globalSimulationData.ILCA;
      const newSpeed = applyControls(pointOfSail, windSpeed, controls); // ◄ Calculated via imported function

      window.globalSimulationData.ILCA.speed = newSpeed;
    }


    // Refresh overlays
    updateWindControl(map);
    updateILCAControl();
    updateVMGControl();

    // --- Dynamic Cockpit Warning UI Management ---
    const ilcaData = window.globalSimulationData?.ILCA;
    const warningDiv = document.getElementById("heelWarningContainer");
    const heelDegSpan = document.getElementById("uiHeelDegrees");

    if (warningDiv && ilcaData) {
      // Show dashboard element if boat heels past 30 degrees (and isn't flipped yet)
      if (ilcaData.heelAngle >= 30 && !ilcaData.capsized && launched) {
        warningDiv.style.display = "block";
        if (heelDegSpan) {
          heelDegSpan.textContent = Math.round(ilcaData.heelAngle);
        }
        
        // Trigger intense shaking animation class if critically close to tipping over (38°+)
        if (ilcaData.heelAngle >= 38) {
          warningDiv.classList.add("danger-shake");
          warningDiv.style.background = "#fca5a5"; // Deepen panel to warning red
        } else {
          warningDiv.classList.remove("danger-shake");
          warningDiv.style.background = "#fee2e2"; // Keep default alert tint
        }
      } else {
        // Suppress warning layout safely if flat or out of simulation window parameters
        warningDiv.style.display = "none";
        warningDiv.classList.remove("danger-shake");
      }
    }
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

  // Reset core simulation variables back to fresh upright conditions
  window.globalSimulationData.ILCA.capsized = false;
  window.globalSimulationData.ILCA.heelAngle = 0;

  // ILCA stuck in irons
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
