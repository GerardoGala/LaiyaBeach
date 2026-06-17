// ilcaApplyControls.js
import { calculateHeelAndCapsize } from './ilcaCapsize.js'; // ◄ Imported from separate capsize engine

/**
 * Calculates a smooth penalty curve based on distance from a "sweet spot".
 * Perfect match = 1.0. Getting farther away drops the multiplier smoothly.
 */
function getTrimMultiplier(currentValue, targetValue, tolerance = 0.2, penaltyWeight = 0.4) {
  const deviation = Math.abs(currentValue - targetValue);
  if (deviation <= tolerance) {
    return 1.05 - (deviation * 0.1); // Small bonus for being near perfect
  }
  return Math.max(0.5, 1.0 - (deviation - tolerance) * penaltyWeight);
}


/**
 * Applies sailing physics controls based on point of sail, wind speed, and trimmer inputs.
 * Returns the final calculated boat speed using 6 dynamic boom angle scenarios.
 */
export function applyControls(pointOfSail, windSpeed, controls) {
  // --- CAPSIZE CHECK ---
  if (controls.capsized) {
    controls.heelAngle = 90;
    return 0.0;
  }

  let baseFactor = 0.5; // Baseline physics efficiency
  let modifier = 1.0;   // Accumulator for trim modifiers
  controls.leeway = 0;  // Default sideways slip

  // --- INTERFACE TRANSLATION LAYER (Normalized to 0.0 to 1.0) ---
  const v = (controls.vang + 2) / 4;          // 0.0 (Tight) to 1.0 (Loose)
  const d = (controls.downhaul + 2) / 4;      // 0.0 (Tight) to 1.0 (Loose)
  const o = (controls.outhaul + 2) / 4;        // 0.0 (Tight) to 1.0 (Loose)
  const db = controls.daggerboard;            // -2 (Up) to 2 (Down)
  
  // Refactored from controls.sheet to a clear, measurable boom angle variable (0 to 110 degrees)
  const boomAngle = controls.boomAngle;       

  switch(pointOfSail) {
    case "In Irons":
      controls.heelAngle = 0; 
      return 0.0; // Hard stall

    case "Close Hauled":
      baseFactor = 0.7;

      // --- DYNAMIC WIND SCENARIOS FOR UPWIND BOOM SETTINGS ---
      if (windSpeed < 8.0) {
        // Scenario 1: Upwind Light Wind -> Target boom angle: 3° to 8° (Blocks 0-20cm apart)
        modifier *= getTrimMultiplier(boomAngle / 110, 5.5 / 110, 0.03, 0.7);
      } else if (windSpeed >= 8.0 && windSpeed < 15.0) {
        // Scenario 2: Upwind Medium Wind -> Target boom angle: 0° to 3° (Block-to-block tight)
        modifier *= getTrimMultiplier(boomAngle / 110, 1.5 / 110, 0.02, 0.8);
      } else {
        // Scenario 3: Upwind Heavy Wind -> Target boom angle: 5° to 15° (Vang-sheeting drop range)
        modifier *= getTrimMultiplier(boomAngle / 110, 10.0 / 110, 0.05, 0.7);
      }

      // Upwind wants flat sail: Vang tight (0.0), Downhaul tight (0.1), Outhaul flat (0.0)
      modifier *= getTrimMultiplier(v, 0.0, 0.1, 0.5); 
      modifier *= getTrimMultiplier(d, 0.1, 0.1, 0.4); 
      modifier *= getTrimMultiplier(o, 0.0, 0.1, 0.4); 

      if (controls.sailorPosition === "Hike Out" || controls.sailorPosition === "Hike Hard") modifier *= 1.08;
      else if (controls.sailorPosition === "Neutral") modifier *= 0.95;
      else if (controls.sailorPosition === "Aft") modifier *= 0.85;

      modifier *= (0.50 + (db + 2) * 0.1375); 
      controls.leeway = Math.max(2, 2 + (2 - db) * 8.25); 
      break;

    case "Close Reach":
    case "Beam Reach":
    case "Broad Reach":
      // Scenario 4: Reaching (All Winds) -> Varies dynamically across the target range 35° to 65°
      let targetReachAngle = 50.0; // Midpoint baseline for generic reach settings
      if (pointOfSail === "Close Reach") {
        baseFactor = 1.0;
        targetReachAngle = 35.0;
        modifier *= getTrimMultiplier(v, 0.3, 0.15, 0.4);
        modifier *= getTrimMultiplier(d, 0.3, 0.15, 0.3);
        modifier *= getTrimMultiplier(o, 0.5, 0.15, 0.3);
        if (db === 1) { modifier *= 1.05; controls.leeway = 3; } 
        else { modifier *= (1.05 - Math.abs(1 - db) * 0.08); controls.leeway = 3 + Math.abs(1 - db) * 6; }
      } 
      else if (pointOfSail === "Beam Reach") {
        baseFactor = 1.2;
        targetReachAngle = 50.0;
        modifier *= getTrimMultiplier(v, 0.5, 0.15, 0.4);
        modifier *= getTrimMultiplier(d, 0.8, 0.15, 0.3);
        modifier *= getTrimMultiplier(o, 0.7, 0.15, 0.3);
        modifier *= (1.05 - Math.abs(0 - db) * 0.06); 
        controls.leeway = 3 + Math.abs(0 - db) * 4;
      } 
      else if (pointOfSail === "Broad Reach") {
        baseFactor = 1.0;
        targetReachAngle = 65.0;
        modifier *= getTrimMultiplier(v, 0.8, 0.15, 0.3);
        modifier *= getTrimMultiplier(d, 1.0, 0.10, 0.3);
        modifier *= getTrimMultiplier(o, 0.9, 0.10, 0.3);
        modifier *= (1.06 - Math.abs(-1 - db) * 0.06);
        controls.leeway = 2 + Math.abs(-1 - db) * 2;
        if (controls.sailorPosition === "Neutral") modifier *= 1.03;
      }

      // Apply the reaching boom angle logic normalized to the total arc range
      modifier *= getTrimMultiplier(boomAngle / 110, targetReachAngle / 110, 0.06, 0.75);
      if (controls.sailorPosition === "Hike Out" || controls.sailorPosition === "Hike Hard") modifier *= 1.05;
      break;

    case "Running":
      baseFactor = 0.8;

      // --- DYNAMIC WIND SCENARIOS FOR DOWNWIND BOOM SETTINGS ---
      if (windSpeed < 15.0) {
        // Scenario 5: Downwind Light/Medium Wind -> Target boom angle: 75° to 85° (Stop before stalling)
        modifier *= getTrimMultiplier(boomAngle / 110, 80.0 / 110, 0.05, 0.8);
      } else {
        // Scenario 6: Downwind Heavy Wind -> Target boom angle: 90° to 110° (Sailing deep By-The-Lee)
        modifier *= getTrimMultiplier(boomAngle / 110, 100.0 / 110, 0.08, 0.8);
      }

      // Vang 0.5 to control leech twist, Downhaul 1.0 loose, Outhaul 1.0 full bag
      modifier *= getTrimMultiplier(v, 0.5, 0.15, 0.4); 
      modifier *= getTrimMultiplier(d, 1.0, 0.10, 0.2);
      modifier *= getTrimMultiplier(o, 1.0, 0.10, 0.2);

      // Daggerboard Fully UP (-2)
      modifier *= (1.10 - Math.abs(-2 - db) * 0.05); 
      controls.leeway = 1; 
      
      if (controls.sailorPosition === "Aft") modifier *= 1.05;
      break;
  }

  // --- CALLED CAPSIZE AND HEEL CALCULATION FILE LAYER ---
  const isCapsized = calculateHeelAndCapsize(pointOfSail, windSpeed, controls); 
  if (isCapsized) {
    return 0.0;
  }
 
  const finalSpeedFactor = baseFactor * modifier;
  return Math.min(windSpeed * finalSpeedFactor, 12);
}
