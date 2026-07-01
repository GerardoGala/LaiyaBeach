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
 * Strictly maps the Daggerboard Matrix to UI values
 */
export const DAGGERBOARD_MAP = {
  UP: -2,
  CENTER: 0,
  DOWN: 2
};

/**
 * Strictly maps the Vang Matrix to UI values
 */
export const VANG_MAP = {
  TIGHT: -2,
  CENTER: 0,
  LOOSE: 2
};

/**
 * Strictly maps the Downhaul Matrix to UI values
 */
export const DOWNHAUL_MAP = {
  MAX_LUFF: -2,
  BASE: 0,
  OFF: 2
};

/**
 * Strictly maps the Outhaul Translation Matrix to UI values
 */
export const OUTHAUL_MAP = {
  FLAT: 0.0,
  BASE: 0.5,
  FULL: 1.0
};

/**
 * Strict database mirroring the proTip.html specification matrix.
 * Using our clean, standardized mapping variables throughout!
 */
export const SCENARIO_TARGETS = {
  "Close Hauled": {
    "Light": {
      minBoom: 3, maxBoom: 8,
      sailor: "Forward", 
      daggerboard: DAGGERBOARD_MAP.DOWN,
      vang: 1.0,         
      cunningham: 1.0,   
      outhaul: OUTHAUL_MAP.BASE 
    },
    "Medium": {
      minBoom: 0, maxBoom: 3,
      sailor: "Hike Hard", 
      daggerboard: DAGGERBOARD_MAP.DOWN,
      vang: 0.25,          
      cunningham: 0.25,    
      outhaul: OUTHAUL_MAP.BASE 
    },
    "Heavy": {
      minBoom: 5, maxBoom: 15,
      sailor: "Hike Hard", 
      daggerboard: DAGGERBOARD_MAP.DOWN,
      vang: 0.0,           
      cunningham: 0.0,     
      outhaul: OUTHAUL_MAP.FLAT 
    }
  },
  "Reaching": {
    "Light": {
      minBoom: 35, maxBoom: 65,
      sailor: "Forward",   
      daggerboard: DAGGERBOARD_MAP.CENTER,
      vang: 1.0,           
      cunningham: 1.0,     
      outhaul: OUTHAUL_MAP.FULL 
    },
    "Medium": {
      minBoom: 35, maxBoom: 65,
      sailor: "Hike Hard", // STANDARDIZED: Swapped "Hike Out" to "Hike Hard"
      daggerboard: DAGGERBOARD_MAP.CENTER,
      vang: 0.5,           
      cunningham: 0.25,    
      outhaul: OUTHAUL_MAP.BASE 
    },
    "Heavy": {
      minBoom: 40, maxBoom: 70,
      sailor: "Aft",       
      daggerboard: DAGGERBOARD_MAP.UP,
      vang: 0.1,           
      cunningham: 0.0,     
      outhaul: OUTHAUL_MAP.FLAT 
    }
  },
  "Running": {
    "Light": {
      minBoom: 75, maxBoom: 85,
      sailor: "Forward",   // FIXED: Changed from "FORWARD" to "Forward"
      daggerboard: DAGGERBOARD_MAP.UP,
      vang: 0.8,           
      cunningham: 1.0,     
      outhaul: OUTHAUL_MAP.FULL 
    },
    "Medium": {
      minBoom: 90, maxBoom: 100,
      sailor: "Neutral",   
      daggerboard: DAGGERBOARD_MAP.UP,
      vang: 0.6,           
      cunningham: 1.0,     
      outhaul: OUTHAUL_MAP.FULL 
    },
    "Heavy": {
      minBoom: 90, maxBoom: 110,
      sailor: "Aft",       
      daggerboard: DAGGERBOARD_MAP.CENTER,
      vang: 0.0,           
      cunningham: 0.75,    
      outhaul: OUTHAUL_MAP.FLAT 
    }
  }
};
