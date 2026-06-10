window.globalSimulationData = {

  // --- Wind state ---
  windDirection: 0,
  windSpeed: 0,   //

   // Base coordinates scaled dynamically by the fudgeFactor multiplier
  leewardMarkLat: 13.670464,
  leewardMarkLon: 121.401286,

  // Set to 1.0 for full course, 0.5 for smaller, 0.25 for rapid testing
  windwardMarkLat: 13.670464 + (0.00361545 * .75),  // Full: 400m | Small: 200m | Tiny: 100m
  windwardMarkLon: 121.401286,
  
  gybeMarkLat: 13.670464 + (0.00180772 * .75),     // Full: 200m | Small: 100m | Tiny: 50m
  gybeMarkLon: 121.401286 - (0.00186238 * .75),    // Updated from 0.00320198 to achieve a true 60-60-60 triangle


  // FIX: Updated comments to match the actual upwind-first race progression
  currentLeg: 0,                                 // 0=To Windward, 1=To Gybe, 2=To Leeward (Finish)

  // FIX: Added windward tracker since it is the first mark rounded in the race
  windwardMarkRounded: 0,
  gybeMarkRounded: 0,
  leewardMarkRounded: 0,
  raceFinished: false,


  // --- Buoy state ---
  buoyLat: 13.660641 + 0.0054,   // 0.0027 = 300m Northward is +
  buoyLon: 121.411058 - 0.0084,  // 0.0028 = 300m Westward is -
  buoyRounded: 0,
  raceFinished: false,
  rcLat: 13.670464,
  rcLon: 121.401286,


  // --- ILCA state ---
  ILCA: {
    maneuver: null,
    pointOfSail: "",
    heading: 0,
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
