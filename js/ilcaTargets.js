// ilcaTargets.js

/**
 * Maps the 3 strategic wind tiers defined in proTip.html
 */
export function getWindTier(windSpeed) {
  if (windSpeed < 8.0) return "Light";
  if (windSpeed >= 8.0 && windSpeed < 15.0) return "Medium";
  return "Heavy"; // 15+ knots
}

/**
 * Strictly maps the Outhaul Translation Matrix to UI values
 * 0.0 = FLAT, 0.25 = BLENDED, 0.5 = BASE, 0.75 = DEEP, 1.0 = FULL
 */
export const OUTHAUL_MAP = {
  FLAT: 0.0,
  BLENDED: 0.25,
  BASE: 0.5,
  DEEP: 0.75,
  FULL: 1.0
};

/**
 * Strict database mirroring the proTip.html specification matrix.
 * Normalizes all values to a 0.0 - 1.0 scale (except boom angle and daggerboard).
 */
export const SCENARIO_TARGETS = {
  "Close Hauled": {
    "Light": {
      minBoom: 3, maxBoom: 8,
      sailor: "Forward", // Mid-Forward / lean leeward
      daggerboard: 2,    // Fully Down
      vang: 1.0,         // Slack (Loose)
      cunningham: 1.0,   // Loose
      outhaul: OUTHAUL_MAP.BASE // Hand-width gap
    },
    "Medium": {
      minBoom: 0, maxBoom: 3,
      sailor: "Hike Hard", // Mid-Cockpit / hiking straight and hard
      daggerboard: 2,      // Fully Down
      vang: 0.25,          // Firm (Tending tight)
      cunningham: 0.25,    // Snug
      outhaul: OUTHAUL_MAP.BLENDED // Two fingers gap
    },
    "Heavy": {
      minBoom: 5, maxBoom: 15,
      sailor: "Hike Hard", // Max Hike Out
      daggerboard: 1.2,    // Up 2-3 inches (approx 1.2 on a -2 to 2 scale)
      vang: 0.0,           // Max Tight
      cunningham: 0.0,     // Max Down
      outhaul: OUTHAUL_MAP.FLAT // Rigidly Flat
    }
  },
  "Reaching": {
    "Light": {
      minBoom: 35, maxBoom: 65,
      sailor: "Forward",   // Clear out transom drag
      daggerboard: 0,      // Halfway Up
      vang: 1.0,           // Slack
      cunningham: 1.0,     // Completely off
      outhaul: OUTHAUL_MAP.DEEP // Well eased / powerful pocket
    },
    "Medium": {
      minBoom: 35, maxBoom: 65,
      sailor: "Hike Out",  // Hiked out / shift aft on waves
      daggerboard: 0,      // Halfway Up
      vang: 0.5,           // Set top batten parallel (Blended/Base middle)
      cunningham: 0.25,    // Snugged slightly
      outhaul: OUTHAUL_MAP.BASE // Moderate depth
    },
    "Heavy": {
      minBoom: 40, maxBoom: 70,
      sailor: "Aft",       // Far Aft
      daggerboard: -1,     // Up Significantly
      vang: 0.1,           // Heavy tension
      cunningham: 0.0,     // Hard down
      outhaul: OUTHAUL_MAP.FLAT // Pulled flat
    }
  },
  "Running": {
    "Light": {
      minBoom: 75, maxBoom: 85,
      sailor: "Forward",   // Forward / heel to windward
      daggerboard: -1,     // Up High
      vang: 0.8,           // Eased (prevents boom dipping)
      cunningham: 1.0,     // Eased completely off
      outhaul: OUTHAUL_MAP.FULL // Eased deep / broad cross-section
    },
    "Medium": {
      minBoom: 90, maxBoom: 100,
      sailor: "Neutral",   // Mid-Cockpit / active stance
      daggerboard: -1.5,   // Three-Quarters Up
      vang: 0.6,           // Set leech open to twist
      cunningham: 1.0,     // Eased completely off
      outhaul: OUTHAUL_MAP.DEEP // Eased slightly / smooth profile
    },
    "Heavy": {
      minBoom: 90, maxBoom: 110,
      sailor: "Aft",       // Transom Wall
      daggerboard: 0,      // Halfway Down as stabilizer!
      vang: 0.0,           // Tight (prevents death-rolls)
      cunningham: 0.75,    // Pulled 1/4 down
      outhaul: OUTHAUL_MAP.FLAT // Pulled tight to stabilize panels
    }
  }
};
