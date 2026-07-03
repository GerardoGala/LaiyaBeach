// ilcaTargets.js

/**
 * Maps the 3 strategic wind tiers defined in proTip.html
 */
export function getWindTier(windSpeed) {
  if (windSpeed < 8.0) return "Light";
  if (windSpeed >= 8.0 && windSpeed < 15.0) return "Medium";
  return "Heavy"; // 15+ knots
}

// Keep this ONLY if your physics/3D models need numbers to work!
export const SIMULATION_VALUES = {
  daggerboard: { "Up": -2, "Center": 0, "Down": 2 },
  vang:        { "Ease": 2, "Center": 0, "Max": -2 }, 
  downhaul:    { "Base": 2, "Center": 0, "Max": -2 },
  outhaul:     { "Flat": 0.0, "Base": 0.5, "Full": 1.0 }
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
      daggerboard: "Down", // Clean text string
      vang: "Ease",        
      downhaul: "Base", 
      outhaul: "Base" // Clean text string
    },
    "Medium": {
      minBoom: 0, maxBoom: 3,
      sailor: "Hike Hard", 
      daggerboard: "Down", 
      vang: "Center",         
      downhaul: "Center",   
      outhaul: "Base" 
    },
    "Heavy": {
      minBoom: 5, maxBoom: 15,
      sailor: "Hike Hard", 
      daggerboard: "Down", 
      vang: "Max",          
      downhaul: "Max",    
      outhaul: "Flat" // Clean text string
    }
  },
  "Reaching": {
    "Light": {
      minBoom: 35, maxBoom: 65,
      sailor: "Forward",   
      daggerboard: "Center", // Clean text string
      vang: "Ease",          
      downhaul: "Base",    
      outhaul: "Full" // Clean text string
    },
    "Medium": {
      minBoom: 35, maxBoom: 65,
      sailor: "Hike Hard", 
      daggerboard: "Center", 
      vang: "Center",          
      downhaul: "Center",   
      outhaul: "Base" 
    },
    "Heavy": {
      minBoom: 40, maxBoom: 70,
      sailor: "Aft",       
      daggerboard: "Up", // Clean text string
      vang: "Max",          
      downhaul: "Base",    
      outhaul: "Flat" 
    }
  },
  "Running": {
    "Light": {
      minBoom: 75, maxBoom: 85,
      sailor: "Forward",   
      daggerboard: "Up", 
      vang: "Center",          
      downhaul: "Base",    
      outhaul: "Full" 
    },
    "Medium": {
      minBoom: 90, maxBoom: 100,
      sailor: "Neutral",   
      daggerboard: "Up", 
      vang: "Center",          
      downhaul: "Base",    
      outhaul: "Full" 
    },
    "Heavy": {
      minBoom: 90, maxBoom: 110,
      sailor: "Aft",       
      daggerboard: "Center", 
      vang: "Center",          
      downhaul: "Center",   
      outhaul: "Flat" 
    }
  }
};

