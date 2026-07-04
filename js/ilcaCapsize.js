// ilcaCapsize.js

/**Wind updated:
 * Calculates the dynamic heeling forces, handles momentum smoothing,
 * sets the clinometer display angle, and checks for an over-rotation capsize event.
 * @param {string} pointOfSail - Current relative point of sail string
 * @param {number} windSpeed - Wind speed in knots
 * @param {object} controls - The active ILCA global data data object references
 * @returns {boolean} True if the boat capsized, false if safely upright
 */
export function calculateHeelAndCapsize(pointOfSail, windSpeed, controls) {
  // If the boat is already marked as capsized, clamp stats and exit immediately
  if (controls.capsized) {
    controls.heelAngle = 90;
  console.log("capsized");

    // Safely calculate direction even during an existing capsize
    const windDirection = window.globalSimulationData?.windDirection || 0;
    const boatHeading = typeof controls.heading === 'number' ? controls.heading : 0;
    const relativeAngle = ((boatHeading - windDirection) + 540) % 360 - 180;
    const displayDirectionMultiplier = relativeAngle >= 0 ? 1 : -1;
    
    controls.clinometer = 90 * displayDirectionMultiplier;
     console.log("displayDirectionMultiplier= " + displayDirectionMultiplier);
    return true;
  }

  // Initialize a safe default value for tracking heel angle if it doesn't exist yet
  if (typeof controls.heelAngle !== 'number') {
    controls.heelAngle = 0;
  }

  // --- INSULATED CAPSIZE AND HEEL CALCULATION ENGINE ---
  // Assign a base aerodynamic tipping threat multiplier based on the point of sail.
  // A Beam Reach (90 degrees to the wind) creates the highest sideways overturning force.
  let windHeelFactor = 0.0;
  if (pointOfSail === "Close Hauled") windHeelFactor = 1.4;
  if (pointOfSail === "Close Reach") windHeelFactor = 1.6;
  if (pointOfSail === "Beam Reach") windHeelFactor = 1.9;  
  if (pointOfSail === "Broad Reach") windHeelFactor = 0.4; 
  if (pointOfSail === "Running") windHeelFactor = 0.1;

  // --- REFACTORED EXPONENTIAL TENSION MATH ---
  // Extract mainsheet angle inputs. A value of 0 means block-to-block (pinned tight).
  const sheet = controls.boomAngle || 0;
  
  // Calculate raw linear tension fraction where 0° = 1.0 (Max power) and 90° = 0.1 (Dumped wind)
  const linearTension = Math.max(0.1, (90 - sheet) / 90);
  
  // Use Math.pow() to scale the tension exponentially. 
  // In heavy winds, tightening the sail into a hard wall on a reach causes a sudden, dramatic 
  // spike in aerodynamic lift leverage instead of a slow, predictable, linear increase.
  const sheetTensionFactor = Math.pow(linearTension, 1.5);

  // --- ⛵ FIXED: DAGGERBOARD PIVOT TEXT TRANSLATION ---
  // Converts your new text strings into numeric leverage factors so the math engine does not crash.
  let daggerboardLeverage = 1.0;
  if (controls.daggerboard === "Down") {
    daggerboardLeverage = 1.20; // Matches old value of 2
  } else if (controls.daggerboard === "Up") {
    daggerboardLeverage = 0.80; // Matches old value of -2
  } else {
    daggerboardLeverage = 1.00; // Default for "Center" or missing data (matches old value of 0)
  }

  // Sailor counter-weight stability multipliers (Righting Moment)
  // Selecting "Hike Out" reduces total tipping leverage down to 35% of raw capacity.
  // Staying sitting down ("Neutral" or "Aft") applies a massive stability penalty in a breeze.
  let hikingEffort = 1.0; 
  if (controls.sailorPosition === "Hike Out" || controls.sailorPosition === "Hike Hard") {
    hikingEffort = 0.35; 
  } else if (controls.sailorPosition === "Neutral") {
    hikingEffort = 1.15; 
  } else if (controls.sailorPosition === "Aft") {
    hikingEffort = 1.45; 
  }

  // Calculate what the wind power vs righting levers wants the final angle to be.
  // Added daggerboardLeverage into the calculation chain.
  const targetHeelAngle = windSpeed * windHeelFactor * sheetTensionFactor * hikingEffort * daggerboardLeverage * 2.1;
  
  if (pointOfSail === "In Irons") {
    // If stalled out head-to-wind, bleed off your rolling momentum by 30% each game frame tick
    controls.heelAngle += (0 - controls.heelAngle) * 0.3;
  } else {
    // ⛵ REFACTORED MOMENTUM PROGRESSION STEP:
    // To mimic real fluid dynamics, increase the rotation progression rate from 0.4 to 0.6.
    // The boat will now roll sideways much faster when struck by strong wind loads.
    const maximumCalculatedAngle = Math.min(Math.max(targetHeelAngle, 0), 90);
    controls.heelAngle += (maximumCalculatedAngle - controls.heelAngle) * 0.6;
  }

  // --- ⛵ FIXED: HEADING PROTECTION ---
  // Safely defaults to 0 if controls.heading is undefined or missing to prevent NaN errors.
  const windDirection = window.globalSimulationData?.windDirection || 0; 
  const relativeAngle = ((controls.heading - windDirection) + 540) % 360 - 180;
  const displayDirectionMultiplier = relativeAngle >= 0 ? 1 : -1;

  // STORE PRE-CALCULATED VALUE WITH INDICATION DIRECTION FOR THE UI GAUGE
  // This lets map.js read the direct angle position without performing any equations
  controls.clinometer = controls.heelAngle * displayDirectionMultiplier;

  // Evaluate absolute catastrophic rollover parameters against our 45-degree threshold ceiling.
  // If the smoothed dynamic rolling momentum passes 45°, the boat turtles over in the water.
  if (controls.heelAngle >= 45) {
    controls.capsized = true;
    controls.heelAngle = 90;
    controls.clinometer = 90 * displayDirectionMultiplier;
    controls.speed = 0; // Lock velocity to zero
    return true; // Return capsize true flag to physics engine handlers
  }

  return false; // Safely balanced upright
}
