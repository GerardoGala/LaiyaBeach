// Global simulation state
// === Global simulation state ===
window.globalSimulationData = {
  // --- Wind state ---
  windDirection: 0,   // degrees (0 = North)
  windSpeed: 0,       // knots

  // --- Boat controls ---
  tillerAngle: 0,     // controlled by buttons
  heading: 180,       // default heading out to sea
  speed: 0,           // stationary until launch

  // --- Standing Rig (fixed rigging) ---
  standingRig: {
    mastHeight: 6.0,      // meters
    sailType: "ILCA Standard", // placeholder
    boomLength: 2.7       // meters
    // implement more standing rig parameters here
  },

  // --- Running Rig (adjustable controls) ---
  runningRig: {
    sheetTension: 0.0,    // 0–1 normalized
    vangTension: 0.0,     // 0–1 normalized
    cunninghamTension: 0.0, // 0–1 normalized
    rudderAngle: 0        // degrees left/right
    // implement more running rig parameters here
  },

  // --- Boat state ---
  boat: {
    lat: 13.681,          // starting latitude (Laiya Beach example)
    lon: 121.437,         // starting longitude
    maneuver: null,       // "tack", "gybe", etc.
    localTime: null       // updated every tick
    // implement more boat-specific state here
  }
};
