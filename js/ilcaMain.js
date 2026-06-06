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

  detectBuoyRounding();
  detectRCrounding();


  // Draw overlay
  drawILCAOnMap(map);
}

// Declare once at the top of your script
let nearBuoy = false;
let nearRC = false;
function detectBuoyRounding() {
  const buoyLat = window.globalSimulationData.buoyLat;
  const buoyLon = window.globalSimulationData.buoyLon;
  const ilcaLat = window.globalSimulationData.ILCA.lat;
  const ilcaLon = window.globalSimulationData.ILCA.lon;

  // Use helper for distance
  const distToBuoy = calculateDistance(ilcaLat, ilcaLon, buoyLat, buoyLon);

  const buoyRadius = 450; // meters

  if (distToBuoy < buoyRadius && !nearBuoy) {
    // Entering buoy zone
    nearBuoy = true;
    document.getElementById("nearBuoy").style.display = "block";
  } else if (distToBuoy > buoyRadius && nearBuoy) {
    // Exiting buoy zone
    nearBuoy = false;
    window.globalSimulationData.buoyRounded = 1; // use RC for VMG calculation
    document.getElementById("nearBuoy").style.display = "none";
  }
}

function detectRCrounding() {
  // Only run if buoy has been rounded
  if (window.globalSimulationData.buoyRounded !== 1) return;
  const rcLat = window.globalSimulationData.rcLat;
  const rcLon = window.globalSimulationData.rcLon;
  const ilcaLat = window.globalSimulationData.ILCA.lat;
  const ilcaLon = window.globalSimulationData.ILCA.lon;

  // Use helper for distance
  const distToRC = calculateDistance(ilcaLat, ilcaLon, rcLat, rcLon);

  const rcRadius = 20; // meters

  if (distToRC < rcRadius && !nearRC) {
    // Entering RC zone
    nearRC = true;
    showFinishDialog();
  } else if (distToRC > rcRadius && nearRC) {
    // Exiting RC zone
    nearRC = false;
    window.globalSimulationData.rcRounded = 1; // mark RC rounded
    closeFinishDialog();

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





