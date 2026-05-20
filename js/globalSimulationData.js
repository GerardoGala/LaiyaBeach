// Global simulation state
// === Global simulation state ===
// === Global simulation state ===
window.globalSimulationData = {
  // --- Wind state ---
  windDirection: 0,
  windSpeed: 0,

  // --- ILCA state ---
  ILCA: {
    tillerAngle: 0,
    heading: 180,   // <-- this is what the buttons will update
    speed: 0,

    standingRig: {
      mastHeight: 6.0,
      sailType: "ILCA Standard",
      boomLength: 2.7
    },

    runningRig: {
      sheetTension: 0.0,
      vangTension: 0.0,
      cunninghamTension: 0.0,
      rudderAngle: 0
    },

    lat: 13.681,
    lon: 121.437,
    maneuver: null,
    localTime: null
  }
};

