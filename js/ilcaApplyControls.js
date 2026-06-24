// ilcaApplyControls.js
import { calculateHeelAndCapsize } from './ilcaCapsize.js';
import { getWindTier, SCENARIO_TARGETS } from './ilcaTargets.js';

/**
 * Calculates smooth linear reduction multipliers based on distance to targets.
 */
function getTrimMultiplier(currentValue, targetValue, penaltyWeight = 0.4) {
  const deviation = Math.abs(currentValue - targetValue);
  return Math.max(0.5, 1.05 - (deviation * penaltyWeight));
}

/**
 * Calculates a range multiplier so any boom angle inside the manual's specified 
 * windows (e.g., 35° to 65°) yields peak efficiency, penalized smoothly outside it.
 */
function getBoomRangeMultiplier(currentAngle, minAngle, maxAngle) {
  let deviation = 0;
  if (currentAngle < minAngle) {
    deviation = minAngle - currentAngle;
  } else if (currentAngle > maxAngle) {
    deviation = currentAngle - maxAngle;
  }
  return Math.max(0.5, 1.05 - ((deviation / 110) * 0.75));
}

export function applyControls(pointOfSail, windSpeed, controls) {
  // --- CAPSIZE CHECK ---
  if (controls.capsized) {
    controls.heelAngle = 90;
    return 0.0;
  }

  // --- SPECIAL CASE: IN IRONS ---
  if (pointOfSail === "In Irons") {
    controls.heelingForceMultiplier = 0.0;
    let currentClinometer = controls.clinometer || 0;
    controls.clinometer = currentClinometer + (0 - currentClinometer) * 0.6;
    return 0.0;
  }

  // Group reaching vectors under one conceptual manual header
  let lookupHeading = pointOfSail;
  if (pointOfSail.includes("Reach")) {
    lookupHeading = "Reaching";
  }

  // Define global base efficiencies based on direction heading
  let baseFactor = 0.5;
  if (pointOfSail === "Close Hauled") baseFactor = 0.7;
  if (pointOfSail === "Close Reach" || pointOfSail === "Broad Reach") baseFactor = 1.0;
  if (pointOfSail === "Beam Reach") baseFactor = 1.2;
  if (pointOfSail === "Running") baseFactor = 0.8;

  // Retrieve exact target metrics from config file
  const windTier = getWindTier(windSpeed);
  const targets = SCENARIO_TARGETS[lookupHeading][windTier];

  let modifier = 1.0;

  // --- INTERFACE TRANSLATION LAYER ---
  const v = (controls.vang + 2) / 4;          // 0.0 (Tight) to 1.0 (Loose)
  const d = (controls.downhaul + 2) / 4;      // 0.0 (Tight) to 1.0 (Loose)
  const o = (controls.outhaul + 2) / 4;        // 0.0 (Flat) to 1.0 (Full)
  const db = controls.daggerboard;            // -2 (Up) to 2 (Down)
  const boomAngle = controls.boomAngle;       // 0 to 110 degrees

  // --- 1. BOOM ANGLE PENALTY ---
  modifier *= getBoomRangeMultiplier(boomAngle, targets.minBoom, targets.maxBoom);

  // --- 2. SAIL RIG CONTROLS PENALTIES (Dynamic across all states) ---
  modifier *= getTrimMultiplier(v, targets.vang, 0.5);
  modifier *= getTrimMultiplier(d, targets.cunningham, 0.4);
  modifier *= getTrimMultiplier(o, targets.outhaul, 0.4);

  // --- 3. SAILOR POSITION MATCHING ---
  if (controls.sailorPosition === targets.sailor) {
    modifier *= 1.08; // Perfect matching stance boost
  } else if (controls.sailorPosition === "Neutral") {
    modifier *= 0.98;
  } else {
    modifier *= 0.88;
  }

  // --- 4. DAGGERBOARD PERFORMANCE & LEEWAY TRACKING ---
  // Calculates linear distance penalty from the documentation's optimal target board depth
  const boardDeviation = Math.abs(db - targets.daggerboard);
  modifier *= Math.max(0.5, 1.05 - (boardDeviation * 0.15));

  // Dynamically set boat drift sideways depending on point of sail and daggerboard
  if (lookupHeading === "Close Hauled") {
    controls.leeway = Math.max(2, 2 + (2 - db) * 8.25);
  } else if (lookupHeading === "Reaching") {
    controls.leeway = 3 + Math.abs(0 - db) * 4;
  } else {
    controls.leeway = Math.max(1, 1 + (db + 2) * 0.5); // Running has low leeway
  }

  // --- 5. HEEL SPILLING LOGIC ---
  if (boomAngle > targets.maxBoom) {
    const easeDeg = boomAngle - targets.maxBoom;
    controls.heelingForceMultiplier = Math.max(0.0, 1.0 - (easeDeg / 45.0));
  } else {
    controls.heelingForceMultiplier = 1.0;
  }

  // --- FINAL Physics PASS LINK ---
  const isCapsized = calculateHeelAndCapsize(pointOfSail, windSpeed, controls);
  if (isCapsized) {
    return 0.0;
  }

  const finalSpeedFactor = baseFactor * modifier;
  return Math.min(windSpeed * finalSpeedFactor, 12);
}
