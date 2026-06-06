// Global simulation state
window.globalSimulationData = {
  // --- Wind state ---
  windDirection: 0,
  windSpeed: 0,   //
  
  // --- Buoy state ---
  buoyLat: 13.660641 + 0.0054,   // 0.0027 = 300m Northward is +
  buoyLon: 121.411058 - 0.0084,  // 0.0028 = 300m Westward is -
  buoyRounded: 0,
  rcLat: 13.670464,
  rcLon: 121.401286,
  // --- ILCA state ---
  ILCA: {
    maneuver: null,
    pointOfSail: "",
    heading: 180,
    speed: 0,
    sailorPosition: "Mid Center",
    sheet: 20,
    daggerboard: 0,
    vang: 0,
    downhaul: 0,
    outhaul: 0,
    //slightly south of13.670464
    lat: 13.670464,   
    lon: 121.401286,
    timer: 0,
    displayTimer: "0:00",
    elapsedTime: 0,
    distanceToBuoy: 0,
    bearingToBuoy: 0,
    distanceToRC: 0,
    bearingToRC: 0,
    vmg: 0
  }
};
