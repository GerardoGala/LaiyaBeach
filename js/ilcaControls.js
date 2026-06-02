// ilcaControls.js
import { computeBearing } from "./ilcaUtils.js";

export function handleControls(windDir, windSpeed) {
  const ilca = window.globalSimulationData.ILCA;
  switch (ilca.maneuver) {
    case "launch":
      launchILCA(windDir, windSpeed);
      break;
    case "turn-port":
      decideManeuver(ilca, windDir, -90);
      break;
    case "turn-starboard":
      decideManeuver(ilca, windDir, +90);
      break;
    case "head-up":
    {
      let currentHeading = window.globalSimulationData.ILCA.heading;
      let windDir = window.globalSimulationData.windDirection;

      // Head Up = move 1° closer to the wind direction
      let diff = (currentHeading - windDir + 360) % 360;
      if (diff > 180) diff -= 360; // normalize to -180..180

      // Reduce the difference by 1° (closer to wind)
      let newHeading = (windDir + diff - 1 + 360) % 360;

      window.globalSimulationData.ILCA.heading = newHeading;

      console.log(`Head Up: heading ${currentHeading} → ${newHeading}, windDir ${windDir}`);
    }
    break;
    case "bear-away":
    {
      let currentHeading = window.globalSimulationData.ILCA.heading;
      let windDir = window.globalSimulationData.windDirection;

      // Bear Away = move 1° farther from the wind direction
      let diff = (currentHeading - windDir + 360) % 360;
      if (diff > 180) diff -= 360; // normalize to -180..180

      // Increase the difference by 1° (away from wind)
      let newHeading = (windDir + diff + 1 + 360) % 360;

      window.globalSimulationData.ILCA.heading = newHeading;

      console.log(`Bear Away: heading ${currentHeading} → ${newHeading}, windDir ${windDir}`);
    }
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
      chosenHeading = starboardBeamReach;
    } else {
      chosenHeading = portBeamReach;
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

function decideManeuver(ilca, windDir, delta) {
  const newHeading = (ilca.heading + delta + 360) % 360;

  // Determine if bow or stern crosses the wind
  const beforeDiff = angleDiff(ilca.heading, windDir);
  const afterDiff = angleDiff(newHeading, windDir);

  let maneuverType;
  if (afterDiff > beforeDiff) {
    maneuverType = "gybe";
    ilca.speed *= 0.85; // bigger penalty
  } else {
    maneuverType = "tack";
    ilca.speed *= 0.9;  // smaller penalty
  }

  ilca.heading = newHeading;
  console.log(`Performed ${maneuverType}, new heading: ${ilca.heading}`);
}

function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
