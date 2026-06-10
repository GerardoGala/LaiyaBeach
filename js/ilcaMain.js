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
  const currentLeg = window.globalSimulationData.currentLeg;

  let targetLat, targetLon, targetName, roundingRadius;

  // --- 5-LEG TARGET ROUTING SYSTEM ---
  if (currentLeg === 0) {
    targetLat = window.globalSimulationData.windwardMarkLat;
    targetLon = window.globalSimulationData.windwardMarkLon;
    targetName = "Windward Mark";
    roundingRadius = 25; 
  } else if (currentLeg === 1) {
    targetLat = window.globalSimulationData.gybeMarkLat;
    targetLon = window.globalSimulationData.gybeMarkLon;
    targetName = "Gybe Mark";
    roundingRadius = 25;
  } else if (currentLeg === 2) {
    targetLat = window.globalSimulationData.leewardMarkLat;
    targetLon = window.globalSimulationData.leewardMarkLon;
    targetName = "Leeward Mark"; 
    roundingRadius = 20; 
  } else if (currentLeg === 3) {
    // Leg 4: Heading back to the top Windward Mark
    targetLat = window.globalSimulationData.windwardMarkLat;
    targetLon = window.globalSimulationData.windwardMarkLon;
    targetName = "Windward Mark";
    roundingRadius = 25;
  } else if (currentLeg === 4) {
    // Leg 5: The final downwind finish sprint to the bottom Leeward Mark
    targetLat = window.globalSimulationData.leewardMarkLat;
    targetLon = window.globalSimulationData.leewardMarkLon;
    targetName = "Leeward Mark (Finish Line)";
    roundingRadius = 20;
  } else {
    return;
  }

  // Measure boat spatial distance relative to active waypoint coordinate
  const distanceToTarget = calculateDistance(ilcaLat, ilcaLon, targetLat, targetLon);

  // --- TRIGGER INSTANTLY ON ARRIVAL ---
  if (distanceToTarget <= roundingRadius) {
    console.log(`Successfully reached and rounded: ${targetName}!`);

    // Hide any active proximity overlay boxes immediately
    const alertBox = document.getElementById("nearBuoy");
    if (alertBox) alertBox.style.display = "none";

    // --- STATE MACHINE FOR 5-LEG MARK ROUNDINGS ---
    if (currentLeg === 0) {
      window.globalSimulationData.windwardMarkRounded = 1;
      window.globalSimulationData.currentLeg = 1; // Move to Leg 2 (Gybe)

    } else if (currentLeg === 1) {
      window.globalSimulationData.gybeMarkRounded = 1;
      window.globalSimulationData.currentLeg = 2; // Move to Leg 3 (Leeward)

    } else if (currentLeg === 2) {
      window.globalSimulationData.leewardMarkRounded = 1;
      window.globalSimulationData.currentLeg = 3; // Move to Leg 4 (Second Upwind Climb)
      console.log("Leeward Mark passed. Starting Leg 4 Upwind Beat!");

    } else if (currentLeg === 3) {
      // INTERCEPT FIXED: Track second upwind rounding, then pivot downwind for Leg 5
      window.globalSimulationData.windwardMarkRounded = 2;
      window.globalSimulationData.currentLeg = 4; // Move to Leg 5 (Final Dead Downwind Run)
      console.log("Windward Mark rounded a second time! Bear away into the final dead downwind Run!");

    } else if (currentLeg === 4) {
      // True 5-leg race finish line triggered here at the bottom mark
      window.globalSimulationData.raceFinished = true;
      window.globalSimulationData.leewardMarkRounded = 2; // Track second leeward rounding

      // Force windSpeed into a true JavaScript number type
      if (window.globalSimulationData.windSpeed !== undefined) {
        window.globalSimulationData.windSpeed = Number(window.globalSimulationData.windSpeed);
      }

      if (typeof showFinishDialog === "function") showFinishDialog();
      console.log("Race Completed! Final dead downwind finish registered.");
    }

  } else {
    // Show an "approaching" warning when slightly outside the rounding zone (e.g., within 50 meters)
    const alertBox = document.getElementById("nearBuoy");
    if (alertBox) {
      if (distanceToTarget > roundingRadius && distanceToTarget < 50) {
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
