// ilcaControls.js
import { computeBearing } from "./ilcaUtils.js";

export function handleControls(windDir, windSpeed) {
  const ilca = window.globalSimulationData.ILCA;
  console.log(window.globalSimulationData.ILCA.speed);
  console.log(window.globalSimulationData.ILCA.vang);
  switch (ilca.maneuver) {
    case "launch":
      launchILCA(windDir, windSpeed);
      break;
    case "pump":
      ilca.speed *= 1.05;
      break;
    case "tack-port":
      ilca.heading = (windDir + 45) % 360;
      ilca.speed *= 0.9;
      break;
    case "tack-starboard":
      ilca.heading = (windDir - 45 + 360) % 360;
      ilca.speed *= 0.9;
      break;
    case "gybe-port":
      ilca.heading = (windDir + 135) % 360;
      ilca.speed *= 0.85;
      break;
    case "gybe-starboard":
      ilca.heading = (windDir - 135 + 360) % 360;
      ilca.speed *= 0.85;
      break;
    case "heading-minus":
      ilca.heading = (ilca.heading - 1 + 360) % 360;
      break;
    case "heading-plus":
      ilca.heading = (ilca.heading + 1) % 360;
      break;
  }

  ilca.maneuver = null;
}

function launchILCA(windDir, windSpeed) {
  const ilca = window.globalSimulationData.ILCA;
  const portBeamReach = (windDir - 90 + 360) % 360;
  const starboardBeamReach = (windDir + 90) % 360;

  let chosenHeading = starboardBeamReach;

  if (window.globalSimulationData.buoyLat && window.globalSimulationData.buoyLon) {
    const bearingToBuoy = computeBearing(
      ilca.lat,
      ilca.lon,
      window.globalSimulationData.buoyLat,
      window.globalSimulationData.buoyLon
    );

    // Compute angular difference between buoy and wind
    const diffBuoyWind = angleDiff(bearingToBuoy, windDir);

    // If buoy is clockwise from windDir, choose starboard; if counter‑clockwise, choose port
    const clockwiseDiff = (bearingToBuoy - windDir + 360) % 360;
    if (clockwiseDiff <= 180) {
      chosenHeading = portBeamReach;
    } else {
      chosenHeading = starboardBeamReach;
    }

    console.log(
      `Beam reach options: Port=${portBeamReach}°, Starboard=${starboardBeamReach}°. 
       Buoy bearing=${bearingToBuoy}°. 
       Launching on ${chosenHeading}°`
    );
  }

  ilca.heading = chosenHeading;

  // Initial speed based on wind speed (beam reach efficiency ~50%)
  const efficiency = 0.5;
  const baseSpeed = windSpeed * efficiency;
  ilca.speed = Math.min(Math.max(baseSpeed, 0), 12);

  console.log(
    `Launching ILCA on heading ${chosenHeading}° with windDir ${windDir}° at ${windSpeed} knots → initial speed ${ilca.speed.toFixed(1)} knots`
  );
}

function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

