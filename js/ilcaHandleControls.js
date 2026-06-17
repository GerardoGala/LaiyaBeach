// ilcaHandleControls.js
import { computeBearing } from "./ilcaUtils.js";

export function handleControls(windDir, windSpeed) {
  const ilca = window.globalSimulationData.ILCA;
  let currentHeading = ilca.heading;
  
  // Calculate which tack we are on relative to the shifting wind
  // Wrapping with a standard normalization to handle the 360-degree rollover cleanly
  const relativeAngle = ((currentHeading - windDir + 540) % 360) - 180; 
  const isStarboardTack = relativeAngle >= 0;

  // A crisp 3-degree adjustment step prevents over-steering near the buoys
  const STEERING_STEP = 3; 

  switch (ilca.maneuver) {
    case "launch":
      launchILCA(windDir, windSpeed);
      break;

    case "turn-port":
      ilca.heading = (currentHeading - 45 + 360) % 360;
      break;

    case "turn-starboard":
      ilca.heading = (currentHeading + 45 + 360) % 360;
      break;

    case "head-up":
      // ⛵ Head Up always steers the bow CLOSER to the wind axis
      if (isStarboardTack) {
        ilca.heading = (currentHeading - STEERING_STEP + 360) % 360; // Turn left
      } else {
        ilca.heading = (currentHeading + STEERING_STEP + 360) % 360; // Turn right
      }
      break;

    case "bear-away":
      // ⛵ Bear Away always steers the bow FURTHER AWAY from the wind axis
      if (isStarboardTack) {
        ilca.heading = (currentHeading + STEERING_STEP + 360) % 360; // Turn right
      } else {
        ilca.heading = (currentHeading - STEERING_STEP + 360) % 360; // Turn left
      }
      break;
  }

  // Clear the maneuver state so it doesn't loop infinitely 
  // (Assuming your engine handles resets elsewhere, otherwise leave as is)
  ilca.maneuver = null; 
}


function launchILCA(windDir, windSpeed) {
  if (window.globalSimulationData.raceFinished) return; // don't spawn new boats
  const ilca = window.globalSimulationData.ILCA;
  const portBeamReach = (windDir - 90 + 360) % 360;
  const starboardBeamReach = (windDir + 90) % 360;

  let chosenHeading;

  // Buoy is always southeast of launch point
  const bearingToBuoy = computeBearing(
    ilca.lat,
    ilca.lon,
    window.globalSimulationData.buoyLat,
    window.globalSimulationData.buoyLon
  );

  // Step 1: If wind is from land (north quadrant), force downwind launch
  if (windDir >= 315 || windDir <= 45) {
    chosenHeading = (windDir + 180) % 360;
    console.log(
      `Wind from land (north). Launching downwind on ${chosenHeading}° away from beach.`
    );
  } else {
    // Step 2: Otherwise, choose the beam reach closer to the buoy (SE)
    const diffPort = angleDiff(bearingToBuoy, portBeamReach);
    const diffStarboard = angleDiff(bearingToBuoy, starboardBeamReach);

    chosenHeading = diffPort < diffStarboard ? portBeamReach : starboardBeamReach;

    console.log(
      `Beam reach options: Port=${portBeamReach}°, Starboard=${starboardBeamReach}°. 
       Buoy bearing=${bearingToBuoy}°. 
       Launching on ${chosenHeading}° toward buoy SE.`
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
