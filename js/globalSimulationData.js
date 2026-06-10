window.globalSimulationData = {

  // --- Wind state ---
  windDirection: 0,
  windSpeed: 0,   //

   // Base coordinates scaled dynamically by the fudgeFactor multiplier
  leewardMarkLat: 13.670464,
  leewardMarkLon: 121.401286,

  // Set to 1.0 for full course, 0.5 for smaller, 0.25 for rapid testing
  windwardMarkLat: 13.670464 + (0.00361545 * 0.5),  // Full: 400m | Small: 200m | Tiny: 100m
  windwardMarkLon: 121.401286,
  
  gybeMarkLat: 13.670464 + (0.00180772 * 0.5),     // Full: 200m | Small: 100m | Tiny: 50m
  gybeMarkLon: 121.401286 - (0.00186238 * 0.5),    // Updated to achieve a perfect 45-90-45 course

  // --- UPDATED FOR 5-LEG OLYMPIC COURSE SYSTEM ---
  // 0 = Leg 1: To Windward (Beat)
  // 1 = Leg 2: To Gybe (Beam Reach)
  // 2 = Leg 3: To Leeward (Broad Reach)
  // 3 = Leg 4: To Windward (Second Beat Climb)
  // 4 = Leg 5: To Leeward (Final Dead Downwind Run Finish)
  currentLeg: 0,                                 

  // Rounded trackers increment each time a mark threshold is successfully crossed
  windwardMarkRounded: 0,  // Reaches 1 on Leg 1, reaches 2 on Leg 4!
  gybeMarkRounded: 0,      // Reaches 1 on Leg 2
  leewardMarkRounded: 0,   // Reaches 1 on Leg 3, reaches 2 at the final race finish!
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
