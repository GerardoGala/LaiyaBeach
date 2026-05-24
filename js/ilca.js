export function updateILCA(map) {
  // #1) Read the wind
  const windDir = window.globalSimulationData.windDirection;
  const windSpeed = window.globalSimulationData.windSpeed;

  // #2) Read the sail controls (vang, downhaul, outhaul)
  const vang = window.globalSimulationData.ILCA.runningRig.vangTension || 0;
  const downhaul = window.globalSimulationData.ILCA.runningRig.cunninghamTension || 0;
  const outhaul = window.globalSimulationData.ILCA.runningRig.sheetTension || 0;

  // #3) Read the sheet and tiller control
  const sheetAngle = window.globalSimulationData.ILCA.sheetAngle || 90;
  const tillerDelta = window.globalSimulationData.ILCA.tillerAngle; // -1, 0, +1


// #4) Launch logic — set heading to beam reach toward buoy
if (window.globalSimulationData.ILCA.maneuver === "launch") {
  console.log("Launching ILCA...");

  const portBeamReach = (windDir - 90 + 360) % 360;
  const starboardBeamReach = (windDir + 90) % 360;

  let chosenHeading = starboardBeamReach; // fallback

  if (window.globalSimulationData.buoyLat && window.globalSimulationData.buoyLon) {
    const buoyLat = window.globalSimulationData.buoyLat;
    const buoyLon = window.globalSimulationData.buoyLon;
    const bearingToBuoy = computeBearing(
      window.globalSimulationData.ILCA.lat,
      window.globalSimulationData.ILCA.lon,
      buoyLat,
      buoyLon
    );

    // Angular difference helper
    function angleDiff(a, b) {
      const d = Math.abs(a - b) % 360;
      return d > 180 ? 360 - d : d;
    }

    const diffPort = angleDiff(bearingToBuoy, portBeamReach);
    const diffStarboard = angleDiff(bearingToBuoy, starboardBeamReach);

    if (diffPort < diffStarboard) {
      chosenHeading = portBeamReach;
      console.log(`Buoy bearing=${bearingToBuoy}°. Launching on Port Beam Reach (${portBeamReach}°)`);
    } else {
      chosenHeading = starboardBeamReach;
      console.log(`Buoy bearing=${bearingToBuoy}°. Launching on Starboard Beam Reach (${starboardBeamReach}°)`);
    }
  } else {
    console.log(`No buoy defined. Launching on Starboard Beam Reach (${starboardBeamReach}°)`);
  }

  window.globalSimulationData.ILCA.heading = chosenHeading;
  window.globalSimulationData.ILCA.speed = 5; // initial push-off
  window.globalSimulationData.ILCA.maneuver = null;
}






  // #4) Tack, Gybe & fine-tune maneuvers
  if (window.globalSimulationData.ILCA.maneuver === "tack-port") {
    console.log("Executing Port Tack...");

    const buoyLat = window.globalSimulationData.buoyLat;
    const buoyLon = window.globalSimulationData.buoyLon;
    const bearingToBuoy = computeBearing(window.globalSimulationData.ILCA.lat, window.globalSimulationData.ILCA.lon, buoyLat, buoyLon);

    // Close-hauled port tack = windDir + 45°
    const portCloseHauled = (windDir + 45) % 360;
    window.globalSimulationData.ILCA.heading = portCloseHauled;

    console.log(`Port Tack Close-Hauled toward buoy (bearing ${bearingToBuoy}°)`);

    window.globalSimulationData.ILCA.speed *= 0.9;
    window.globalSimulationData.ILCA.maneuver = null;
  }

  if (window.globalSimulationData.ILCA.maneuver === "tack-starboard") {
    console.log("Executing Starboard Tack...");

    const buoyLat = window.globalSimulationData.buoyLat;
    const buoyLon = window.globalSimulationData.buoyLon;
    const bearingToBuoy = computeBearing(window.globalSimulationData.ILCA.lat, window.globalSimulationData.ILCA.lon, buoyLat, buoyLon);

    // Close-hauled starboard tack = windDir - 45°
    const starboardCloseHauled = (windDir - 45 + 360) % 360;
    window.globalSimulationData.ILCA.heading = starboardCloseHauled;

    console.log(`Starboard Tack Close-Hauled toward buoy (bearing ${bearingToBuoy}°)`);

    window.globalSimulationData.ILCA.speed *= 0.9;
    window.globalSimulationData.ILCA.maneuver = null;
  }

  if (window.globalSimulationData.ILCA.maneuver === "gybe-port") {
    console.log("Executing Port Gybe...");

    // Broad reach port gybe = windDir + 135°
    const portBroadReach = (windDir + 135) % 360;
    window.globalSimulationData.ILCA.heading = portBroadReach;

    console.log(`Port Gybe set to ${portBroadReach}°`);

    window.globalSimulationData.ILCA.speed *= 0.85; // slightly bigger penalty
    window.globalSimulationData.ILCA.maneuver = null;
  }

  if (window.globalSimulationData.ILCA.maneuver === "gybe-starboard") {
    console.log("Executing Starboard Gybe...");

    // Broad reach starboard gybe = windDir - 135°
    const starboardBroadReach = (windDir - 135 + 360) % 360;
    window.globalSimulationData.ILCA.heading = starboardBroadReach;

    console.log(`Starboard Gybe set to ${starboardBroadReach}°`);

    window.globalSimulationData.ILCA.speed *= 0.85;
    window.globalSimulationData.ILCA.maneuver = null;
  }

  if (window.globalSimulationData.ILCA.maneuver === "heading-minus") {
    window.globalSimulationData.ILCA.heading =
      (window.globalSimulationData.ILCA.heading - 1 + 360) % 360;
    console.log("Heading adjusted -1°");
    window.globalSimulationData.ILCA.maneuver = null;
  }

  if (window.globalSimulationData.ILCA.maneuver === "heading-plus") {
    window.globalSimulationData.ILCA.heading =
      (window.globalSimulationData.ILCA.heading + 1) % 360;
    console.log("Heading adjusted +1°");
    window.globalSimulationData.ILCA.maneuver = null;
  }

  // Position update
  const speedKnots = window.globalSimulationData.ILCA.speed;
  let lat = window.globalSimulationData.ILCA.lat;
  let lon = window.globalSimulationData.ILCA.lon;

  if (speedKnots > 0) {
    const speedMS = speedKnots * 0.5144;
    const dt = 1;
    const distance = speedMS * dt;

    const headingRad = window.globalSimulationData.ILCA.heading * Math.PI / 180;
    const metersPerDegLat = 111320;
    const metersPerDegLon = 111320 * Math.cos(lat * Math.PI / 180);

    const deltaLat = (distance * Math.cos(headingRad)) / metersPerDegLat;
    const deltaLon = (distance * Math.sin(headingRad)) / metersPerDegLon;

    lat += deltaLat;
    lon += deltaLon;

    window.globalSimulationData.ILCA.lat = lat;
    window.globalSimulationData.ILCA.lon = lon;
  }

  // Map overlay drawing (unchanged)
  const heading = window.globalSimulationData.ILCA.heading;
  const boatSvgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g transform="rotate(${heading}, 50, 50)">
        <polygon points="50,10 85,85 15,85" fill="white" stroke="black" stroke-width="2"/>
        <polygon points="30,85 70,85 60,95 40,95 35,90" fill="blue" stroke="black" stroke-width="2"/>
      </g>
    </svg>
  `;
  const parser = new DOMParser();
  const boatSvgElement = parser.parseFromString(boatSvgMarkup, "image/svg+xml").documentElement;

  const bounds = [
    [window.globalSimulationData.ILCA.lat - 0.0002, window.globalSimulationData.ILCA.lon - 0.0002],
    [window.globalSimulationData.ILCA.lat + 0.0002, window.globalSimulationData.ILCA.lon + 0.0002]
  ];

  const overlay = L.svgOverlay(boatSvgElement, bounds).addTo(map);
  overlay.bindPopup(
    `ILCA Sailboat<br>
     Heading: ${heading}°<br>
     Speed: ${speedKnots} knots<br>
     Lat: ${window.globalSimulationData.ILCA.lat.toFixed(5)}<br>
     Lon: ${window.globalSimulationData.ILCA.lon.toFixed(5)}<br>
     Timer: ${window.globalSimulationData.ILCA.timer}`
  );
}

// Utility: compute bearing between two lat/lon
function computeBearing(lat1, lon1, lat2, lon2) {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
