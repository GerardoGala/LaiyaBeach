// ilcaMain.js
import { handleControls } from "./ilcaControls.js";
import { drawILCAOnMap } from "./ilcaMap.js";

// Calculate ILCA speed based on wind speed and beam reach assumption
function calculateILCASpeed(windKnots) {
  // Beam reach efficiency ~50% of true wind speed
  const efficiency = 0.5;

  // Mid-range controls (vang, cunningham, outhaul) → neutral trim
  const baseSpeed = windKnots * efficiency;

  // Clamp to realistic ILCA range (0–12 knots)
  return Math.min(Math.max(baseSpeed, 0), 12);
}

export function updateILCA(map) {
  const windDir = window.globalSimulationData.windDirection;
  const windSpeed = window.globalSimulationData.windSpeed; // in knots

  // 🏁 SAFETY CHECK: If race is finished, force speed to 0 and skip position updates
  if (window.globalSimulationData.raceFinished) {
    if (window.globalSimulationData.ILCA) {
      window.globalSimulationData.ILCA.speed = 0;
    }
    // Draw the static overlay and exit the physics loop cleanly
    drawILCAOnMap(map);
    return; 
  }
  

  // Run maneuver & control logic (this sets ILCA.speed correctly)
  handleControls(windDir, windSpeed);

  // Use the speed already set by controls, not a blind beam reach assumption
  const speedKnots = window.globalSimulationData.ILCA.speed || 0;

  // Update position only if speed > 0
  if (speedKnots > 0) {
    let lat = window.globalSimulationData.ILCA.lat;
    let lon = window.globalSimulationData.ILCA.lon;

    const speedMS = speedKnots * 0.5144; // knots → m/s
    const dt = 1; // timestep in seconds
    const distance = speedMS * dt;

    const headingRad = window.globalSimulationData.ILCA.heading * Math.PI / 180;
    const metersPerDegLat = 111320;
    const metersPerDegLon = 111320 * Math.cos(lat * Math.PI / 180);

    const deltaLat = (distance * Math.cos(headingRad)) / metersPerDegLat;
    const deltaLon = (distance * Math.sin(headingRad)) / metersPerDegLon;

    lat += deltaLat;
    lon += deltaLon;

    window.globalSimulationData.ILCA.lat = lat;
    window.globalSimulationData.ILCA.lon = lon;
  }

  // Monitor race progression sequentially
  if (!window.globalSimulationData.raceFinished) {
    trackRaceLegs();
  }

  // Draw overlay
  drawILCAOnMap(map);
}

// Proximity alerts state flags
let nearMark = false;


function trackRaceLegs() {
  const ilcaLat = window.globalSimulationData.ILCA.lat;
  const ilcaLon = window.globalSimulationData.ILCA.lon;

  let targetLat, targetLon, targetName, roundingRadius;

  // --- 1. TARGET ROUTING SYSTEM ---
  // Evaluated directly on global scope state to prevent stale frame references
  switch (window.globalSimulationData.currentLeg) {
    case 0:
      targetLat = window.globalSimulationData.windwardMarkLat;
      targetLon = window.globalSimulationData.windwardMarkLon;
      targetName = "Windward Mark";
      roundingRadius = 5; // Reduced from 25 to match 0.25 absolute scaled layout
      break;
    case 1:
      targetLat = window.globalSimulationData.gybeMarkLat;
      targetLon = window.globalSimulationData.gybeMarkLon;
      targetName = "Gybe Mark";
      roundingRadius = 5; // Reduced to fit the tight 71.1m leg clearance
      break;
    case 2:
      targetLat = window.globalSimulationData.leewardMarkLat;
      targetLon = window.globalSimulationData.leewardMarkLon;
      targetName = "Leeward Mark"; 
      roundingRadius = 5;
      break;
    case 3:
      targetLat = window.globalSimulationData.windwardMarkLat;
      targetLon = window.globalSimulationData.windwardMarkLon;
      targetName = "Windward Mark";
      roundingRadius = 5;
      break;
    case 4:
      targetLat = window.globalSimulationData.leewardMarkLat;
      targetLon = window.globalSimulationData.leewardMarkLon;
      targetName = "Leeward Mark (Finish Line)";
      roundingRadius = 5;
      break;
    default:
      return; // Stop processing if currentLeg out of bounds
  }

  // Measure boat spatial distance relative to active waypoint coordinate
  const distanceToTarget = calculateDistance(ilcaLat, ilcaLon, targetLat, targetLon);

  // --- 2. TRIGGER ON ARRIVAL ARRIVAL ---
  if (distanceToTarget <= roundingRadius) {
    console.log(`Successfully reached and rounded: ${targetName}!`);

    // Clear UI warnings instantly upon collision detection
    const alertBox = document.getElementById("nearBuoy");
    if (alertBox) alertBox.style.display = "none";

    // --- 3. STATE MACHINE FOR MARK ROUNDINGS ---
    // Break closures prevent execution fallthrough or sequential skipping
    switch (window.globalSimulationData.currentLeg) {
      case 0:
        window.globalSimulationData.windwardMarkRounded = 1;
        window.globalSimulationData.currentLeg = 1; // Move to Leg 2 (Gybe)
        break;

      case 1:
        window.globalSimulationData.gybeMarkRounded = 1;
        window.globalSimulationData.currentLeg = 2; // Move to Leg 3 (Leeward)
        break;

      case 2:
        window.globalSimulationData.leewardMarkRounded = 1;
        window.globalSimulationData.currentLeg = 3; // Move to Leg 4
        console.log("Leeward Mark passed. Starting Leg 4 Upwind Beat!");
        break;

      case 3:
        window.globalSimulationData.windwardMarkRounded = 2;
        window.globalSimulationData.currentLeg = 4; // Move to Leg 5
        console.log("Windward Mark rounded a second time! Bear away into the final downwind Run!");
        break;

      case 4:
        window.globalSimulationData.raceFinished = true;
        window.globalSimulationData.leewardMarkRounded = 2; 

        if (window.globalSimulationData.windSpeed !== undefined) {
          window.globalSimulationData.windSpeed = Number(window.globalSimulationData.windSpeed);
        }

        if (typeof showFinishDialog === "function") showFinishDialog();
        console.log("Race Completed! Final dead downwind finish registered.");
        break;
    }

  } else {
    // Show an "approaching" warning when slightly outside the rounding zone (e.g., within 25 meters)
    const alertBox = document.getElementById("nearBuoy");
    if (alertBox) {
      if (distanceToTarget > roundingRadius && distanceToTarget < 25) {
        alertBox.innerText = `Approaching ${targetName} (${distanceToTarget.toFixed(0)}m)`;
        alertBox.style.display = "block";
      } else {
        alertBox.style.display = "none";
      }
    }
  }
}






// Helper: calculate distance between two lat/lon points in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(lat1 * Math.PI / 180);
  const dLat = (lat1 - lat2) * metersPerDegLat;
  const dLon = (lon1 - lon2) * metersPerDegLon;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}
