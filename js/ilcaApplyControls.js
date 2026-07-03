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
  // The variables below are now simple text strings matching controls directly!
  const v = controls.vang;            // "Ease", "Center", or "Max"
  const d = controls.downhaul;        // "Base", "Center", or "Max"
  const o = controls.outhaul;         // "Full", "Base", or "Flat"
  const db = controls.daggerboard;    // "Up", "Center", or "Down"
  const boomAngle = controls.boomAngle; // 0 to 110 degrees

  // --- 1. BOOM ANGLE PENALTY ---
  modifier *= getBoomRangeMultiplier(boomAngle, targets.minBoom, targets.maxBoom);

  // --- 2. SAIL RIG CONTROLS PENALTIES ---
  // Directly compare text strings. Exact match = perfect (1.0). Wrong text = small penalty.
  modifier *= (v === targets.vang) ? 1.0 : 0.85;
  modifier *= (d === targets.downhaul) ? 1.0 : 0.85;
  modifier *= (o === targets.outhaul) ? 1.0 : 0.85;

  // --- 3. SAILOR POSITION MATCHING ---
  if (controls.sailorPosition === targets.sailor) {
    modifier *= 1.08; // Perfect matching stance boost
  } else if (controls.sailorPosition === "Neutral") {
    modifier *= 0.98;
  } else {
    modifier *= 0.88;
  }

  // --- 4. DAGGERBOARD PERFORMANCE & LEEWAY TRACKING ---
  // Check text configuration for simple speed penalties
  if (db === targets.daggerboard) {
    modifier *= 1.05; // Perfect board depth bonus
  } else {
    modifier *= 0.90; // Wrong board position penalty
  }

  // Set sideways drift based on point of sail text labels
  if (lookupHeading === "Close Hauled") {
    // Up causes maximum drift, Down causes minimum drift
    if (db === "Down") controls.leeway = 2.0;
    else if (db === "Center") controls.leeway = 15.0;
    else controls.leeway = 35.0; // Daggerboard is "Up"
  } else if (lookupHeading === "Reaching") {
    // Center is best
    if (db === "Center") controls.leeway = 3.0;
    else controls.leeway = 11.0; // Up or Down increases drift
  } else {
    // Running: Up is best
    if (db === "Up") controls.leeway = 1.0;
    else if (db === "Center") controls.leeway = 3.0;
    else controls.leeway = 5.0; // Down causes excess drag/drift
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

