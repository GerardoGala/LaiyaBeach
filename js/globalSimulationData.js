// Global simulation state
// === Global simulation state ===
window.globalSimulationData = {
  // --- Wind state ---
  windDirection: 0,
  windSpeed: 0,

  // --- Buoy state ---
  buoyLat: 13.657641,
  buoyLon: 121.407058,

  // --- ILCA state ---
  ILCA: {
    heading: 180,
    speed: 0,

    runningRig: {
      sheetTension: 0.0,
      vangTension: 0.0,
      cunninghamTension: 0.0,
      outhaulTension: 0
    },

    lat: 13.681,
    lon: 121.437,
    maneuver: null,
    timer: 0
  }
};
