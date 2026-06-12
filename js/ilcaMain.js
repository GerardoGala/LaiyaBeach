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

// =========================================================================
// ⚓ RACE LEG TRACKING MODULE (With Immediate green Target)
// =========================================================================

// Helper function to calculate bearing between two coordinates (degrees 0-360)
function calculateHeadingToTarget(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

// Added 'map' parameter to the main execution signature
export function trackRaceLegs(map) {
  const ilcaLat = window.globalSimulationData.ILCA.lat;
  const ilcaLon = window.globalSimulationData.ILCA.lon;

  let targetLat, targetLon, targetName, roundingRadius;

  // --- 1. TARGET ROUTING SYSTEM ---
  switch (window.globalSimulationData.currentLeg) {
    case 0:
      targetLat = window.globalSimulationData.windwardMarkLat;
      targetLon = window.globalSimulationData.windwardMarkLon;
      targetName = "Windward Mark";
      roundingRadius = 5;
      break;
    case 1:
      targetLat = window.globalSimulationData.gybeMarkLat;
      targetLon = window.globalSimulationData.gybeMarkLon;
      targetName = "Gybe Mark";
      roundingRadius = 5; 
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
      return; 
  }

  // Measure boat spatial distance relative to active waypoint coordinate
  const distanceToTarget = calculateDistance(ilcaLat, ilcaLon, targetLat, targetLon);

  // --- 2. TRIGGER ON ARRIVAL ---
  if (distanceToTarget <= roundingRadius) {
    if (typeof showNotification === "function") {
      showNotification("ILCA rounded the buoy!");
    }

    // --- AUTOMATIC TACK / JIBE SYSTEM ---
    if (window.globalSimulationData.ILCA && window.globalSimulationData.ILCA.tack !== undefined) {
      switch (window.globalSimulationData.currentLeg) {
        case 0: window.globalSimulationData.ILCA.tack = "Starboard"; break;
        case 1: window.globalSimulationData.ILCA.tack = "Port"; break;
        case 2: window.globalSimulationData.ILCA.tack = "Starboard"; break;
        case 3: window.globalSimulationData.ILCA.tack = "Port"; break;
      }
      if (typeof showNotification === "function") {
        showNotification(`Auto-rounded: Boat stabilized on ${window.globalSimulationData.ILCA.tack} Tack.`);
      }
    }

    // --- 3. STATE MACHINE FOR MARK ROUNDINGS & AUTO-STEERING ---
    let nextMarkLat, nextMarkLon;

    switch (window.globalSimulationData.currentLeg) {
      case 0:
        window.globalSimulationData.windwardMarkRounded = 1;
        window.globalSimulationData.currentLeg = 1; 
        
        nextMarkLat = window.globalSimulationData.gybeMarkLat;
        nextMarkLon = window.globalSimulationData.gybeMarkLon;

        if (window.globalSimulationData.activeMarker) {
          window.globalSimulationData.activeMarker.setLatLng([nextMarkLat, nextMarkLon]);
        }
        break;

      case 1:
        window.globalSimulationData.gybeMarkRounded = 1;
        window.globalSimulationData.currentLeg = 2; 
        
        nextMarkLat = window.globalSimulationData.leewardMarkLat;
        nextMarkLon = window.globalSimulationData.leewardMarkLon;

        if (window.globalSimulationData.activeMarker) {
          window.globalSimulationData.activeMarker.setLatLng([nextMarkLat, nextMarkLon]);
        }
        break;

      case 2:
        window.globalSimulationData.leewardMarkRounded = 1;
        window.globalSimulationData.currentLeg = 3; 
        
        nextMarkLat = window.globalSimulationData.windwardMarkLat;
        nextMarkLon = window.globalSimulationData.windwardMarkLon;

        if (typeof showNotification === "function") {
          showNotification("Leeward Mark passed. Starting Leg 4 Upwind Beat!");
        }
        if (window.globalSimulationData.activeMarker) {
          window.globalSimulationData.activeMarker.setLatLng([nextMarkLat, nextMarkLon]);
        }
        break;

      case 3:
        window.globalSimulationData.windwardMarkRounded = 2;
        window.globalSimulationData.currentLeg = 4; 
        
        nextMarkLat = window.globalSimulationData.leewardMarkLat;
        nextMarkLon = window.globalSimulationData.leewardMarkLon;

        if (typeof showNotification === "function") {
          showNotification("Windward Mark rounded a second time! Bear away into final downwind Run!");
        }
        if (window.globalSimulationData.activeMarker) {
          window.globalSimulationData.activeMarker.setLatLng([nextMarkLat, nextMarkLon]);
        }
        break;

      case 4:
        window.globalSimulationData.raceFinished = true;
        window.globalSimulationData.leewardMarkRounded = 2; 

        if (window.globalSimulationData.activeMarker) {
          window.globalSimulationData.activeMarker.remove();
        }
        if (window.globalSimulationData.windSpeed !== undefined) {
          window.globalSimulationData.windSpeed = Number(window.globalSimulationData.windSpeed);
        }
        if (typeof showFinishDialog === "function") showFinishDialog();
        if (typeof showNotification === "function") {
          showNotification("Race Completed! Final dead downwind finish registered.");
        }
        break;
    }

    // --- AUTO-STEER HEADING GENERATOR ---
    if (nextMarkLat !== undefined && nextMarkLon !== undefined && window.globalSimulationData.ILCA) {
      const newHeading = calculateHeadingToTarget(ilcaLat, ilcaLon, nextMarkLat, nextMarkLon);
      
      if (window.globalSimulationData.ILCA.heading !== undefined) {
        window.globalSimulationData.ILCA.heading = newHeading;
      } else if (window.globalSimulationData.ILCA.bearing !== undefined) {
        window.globalSimulationData.ILCA.bearing = newHeading;
      } else if (window.globalSimulationData.ILCA.course !== undefined) {
        window.globalSimulationData.ILCA.course = newHeading;
      }
      
      if (typeof showNotification === "function") {
        showNotification(`Auto-Pilot: Course adjusted to ${newHeading.toFixed(0)}°.`);
      }

      // ⛵ INSTANT RE-DRAW ENGINE
      // Triggers immediate render update so the map icon matches your heading
      if (typeof updateILCA === "function") {
        updateILCA(map);
      }
    }

  } else {
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
