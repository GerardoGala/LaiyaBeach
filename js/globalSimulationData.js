// Global simulation state
// === Global simulation state ===
window.globalSimulationData = {
  // --- Wind state ---
  windDirection: 0,
  windSpeed: 0,   //knots

  // --- Buoy state ---
  buoyLat: 13.660641,
  buoyLon: 121.411058,

  // --- ILCA state ---
  ILCA: {
    maneuver: null,
    heading: 180,
    speed: 0,
    sailorPosition: "aft",
  
    sheet: 0,
    daggerboard: 2,
    vang: 0,
    downhaul: 0,
    outhaul: 0,
    //slightly south of13.670464
      lat: 13.670264,   
      lon: 121.401286,
    timer: 0
  }
};
