// physics.js

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
 * Returns the final calculated boat speed.
 */
export function applyControls(pointOfSail, windSpeed, controls) {
  let baseFactor = 0.5; // Baseline physics efficiency
  let modifier = 1.0;   // Accumulator for trim modifiers
  controls.leeway = 0;  // Default sideways slip

  // --- INTERFACE TRANSLATION LAYER (Normalized to 0.0 to 1.0) ---
  // GUI Input scale: -2, -1, 0, 1, 2
  const v = (controls.vang + 2) / 4;          // 0.0 (Tight) to 1.0 (Loose)
  const d = (controls.downhaul + 2) / 4;      // 0.0 (Tight) to 1.0 (Loose)
  const o = (controls.outhaul + 2) / 4;        // 0.0 (Tight) to 1.0 (Loose)
  const db = controls.daggerboard;            // -2 (Up) to 2 (Down)
  const sheet = controls.sheet;               // 0 to 90+

  switch(pointOfSail) {
    case "In Irons":
      return 0.0; // Hard stall, zero speed

    case "Close Hauled":
      baseFactor = 0.7;

      // --- Sheet (Needs block-to-block tight trim upwind: Target 5) ---
      if (sheet <= 15) {
        modifier *= 1.1 - (sheet * 0.01); 
      } else {
        modifier *= Math.max(0.5, 1.1 - ((sheet - 15) * 0.02)); 
      }

      // --- Controls (Upwind wants flat sail: Vang tight (0.0), Downhaul tight (0.1), Outhaul flat (0.0)) ---
      modifier *= getTrimMultiplier(v, 0.0, 0.1, 0.5); 
      modifier *= getTrimMultiplier(d, 0.1, 0.1, 0.4); 
      modifier *= getTrimMultiplier(o, 0.0, 0.1, 0.4); 

      // --- Sailor Position ---
      if (controls.sailorPosition === "Hike Hard") modifier *= 1.08;
      else if (controls.sailorPosition === "Neutral") modifier *= 0.95;
      else if (controls.sailorPosition === "Aft") modifier *= 0.85;

      // --- Daggerboard (Must be fully down: 2) ---
      modifier *= (0.50 + (db + 2) * 0.1375); 
      controls.leeway = Math.max(2, 2 + (2 - db) * 8.25); 
      break;

    case "Close Reach":
      baseFactor = 1.0;

      // --- Sheet (Eased slightly: Target 25) ---
      modifier *= getTrimMultiplier(sheet / 90, 25 / 90, 0.05, 0.6);

      // --- Controls (Slightly relaxed for power: Vang 0.3, Downhaul 0.3, Outhaul 0.5) ---
      modifier *= getTrimMultiplier(v, 0.3, 0.15, 0.4);
      modifier *= getTrimMultiplier(d, 0.3, 0.15, 0.3);
      modifier *= getTrimMultiplier(o, 0.5, 0.15, 0.3);

      // --- Daggerboard (Slightly raised to slot 1 to bleed drag) ---
      if (db === 1) { 
        modifier *= 1.05; 
        controls.leeway = 3; 
      } else { 
        modifier *= (1.05 - Math.abs(1 - db) * 0.08); 
        controls.leeway = 3 + Math.abs(1 - db) * 6; 
      }

      if (controls.sailorPosition === "Hike Hard") modifier *= 1.05;
      break;

    case "Beam Reach":
      baseFactor = 1.2; // Maximum speed potential

      // --- Sheet (Halfway out: Target 50) ---
      modifier *= getTrimMultiplier(sheet / 90, 50 / 90, 0.08, 0.8);

      // --- Controls (Eased for deep draft/power: Vang 0.5, Downhaul 0.8, Outhaul 0.7) ---
      modifier *= getTrimMultiplier(v, 0.5, 0.15, 0.4);
      modifier *= getTrimMultiplier(d, 0.8, 0.15, 0.3);
      modifier *= getTrimMultiplier(o, 0.7, 0.15, 0.3);

      // --- Daggerboard (Sweet spot is halfway up: 0) ---
      modifier *= (1.05 - Math.abs(0 - db) * 0.06); 
      controls.leeway = 3 + Math.abs(0 - db) * 4;

      if (controls.sailorPosition === "Hike Hard") modifier *= 1.05;
      break;

    case "Broad Reach":
      baseFactor = 1.0;

      // --- Sheet (Eased deep: Target 75) ---
      modifier *= getTrimMultiplier(sheet / 90, 75 / 90, 0.08, 0.7);

      // --- Controls (Very loose downwind profile: Vang 0.8, Downhaul 1.0, Outhaul 0.9) ---
      modifier *= getTrimMultiplier(v, 0.8, 0.15, 0.3);
      modifier *= getTrimMultiplier(d, 1.0, 0.10, 0.3);
      modifier *= getTrimMultiplier(o, 0.9, 0.10, 0.3);

      // --- Daggerboard (Raised high to slot -1 to drop skin friction drag) ---
      modifier *= (1.06 - Math.abs(-1 - db) * 0.06);
      controls.leeway = 2 + Math.abs(-1 - db) * 2;

      if (controls.sailorPosition === "Neutral") modifier *= 1.03;
      break;

    case "Running":
      baseFactor = 0.8;

      // --- Sheet (Fully squared out: Target 90) ---
      if (sheet >= 85) {
        modifier *= 1.1;
      } else {
        modifier *= Math.max(0.5, 1.1 - ((85 - sheet) * 0.015)); 
      }

      // --- Controls (Vang 0.5 to control leech twist, Downhaul 1.0 loose, Outhaul 1.0 full bag) ---
      modifier *= getTrimMultiplier(v, 0.5, 0.15, 0.4); 
      modifier *= getTrimMultiplier(d, 1.0, 0.10, 0.2);
      modifier *= getTrimMultiplier(o, 1.0, 0.10, 0.2);

      // --- Daggerboard (Fully UP (-2) for absolute minimal drag downwind) ---
      modifier *= (1.10 - Math.abs(-2 - db) * 0.05); 
      controls.leeway = 1; 
      
      if (controls.sailorPosition === "Aft") modifier *= 1.05;
      break;
  }

  // Final performance matrix processing
  const finalSpeedFactor = baseFactor * modifier;
  return Math.min(windSpeed * finalSpeedFactor, 12);
}
