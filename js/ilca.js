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



//console.log("ILCA speed at ilca.js line 17:", window.globalSimulationData.ILCA.speed);
// #4A) Handle Tack maneuver
if (window.globalSimulationData.ILCA.maneuver === "tack-port") {
  console.log("Executing Port Tack...");

  // Port Tack = bow through wind, rotate -90°
  window.globalSimulationData.ILCA.heading =
    (window.globalSimulationData.ILCA.heading - 90 + 360) % 360;

  // Apply a small speed penalty (simulate loss of momentum)
  window.globalSimulationData.ILCA.speed *= 0.9;

  // Reset maneuver flag
  window.globalSimulationData.ILCA.maneuver = null;
}

if (window.globalSimulationData.ILCA.maneuver === "tack-starboard") {
  console.log("Executing Starboard Tack...");

  // Starboard Tack = bow through wind, rotate +90°
  window.globalSimulationData.ILCA.heading =
    (window.globalSimulationData.ILCA.heading + 90) % 360;

  // Apply a small speed penalty
  window.globalSimulationData.ILCA.speed *= 0.9;

  // Reset maneuver flag
  window.globalSimulationData.ILCA.maneuver = null;
}

// #4B) Handle Gybe maneuver
if (window.globalSimulationData.ILCA.maneuver === "gybe-port") {
  console.log("Executing Port Gybe...");

  // Port Gybe = stern through wind, rotate -90°
  window.globalSimulationData.ILCA.heading =
    (window.globalSimulationData.ILCA.heading - 90 + 360) % 360;

  // Apply a slightly larger speed penalty (gybes are less efficient)
  window.globalSimulationData.ILCA.speed *= 0.85;

  // Reset maneuver flag
  window.globalSimulationData.ILCA.maneuver = null;
}

if (window.globalSimulationData.ILCA.maneuver === "gybe-starboard") {
  console.log("Executing Starboard Gybe...");

  // Starboard Gybe = stern through wind, rotate +90°
  window.globalSimulationData.ILCA.heading =
    (window.globalSimulationData.ILCA.heading + 90) % 360;

  // Apply a slightly larger speed penalty
  window.globalSimulationData.ILCA.speed *= 0.85;

  // Reset maneuver flag
  window.globalSimulationData.ILCA.maneuver = null;
}




//#5 Calculate the new ILCA position
const speedKnots = window.globalSimulationData.ILCA.speed; // keep whatever is set in state
let lat = window.globalSimulationData.ILCA.lat;
let lon = window.globalSimulationData.ILCA.lon;
//console.log("speedKnots:",speedKnots);
if (speedKnots > 0) {
  const speedMS = speedKnots * 0.5144; // knots → m/s
  const dt = 1; // seconds per tick
  const distance = speedMS * dt;

  const headingRad = window.globalSimulationData.ILCA.heading * Math.PI / 180;

  // Approximate meters per degree
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(lat * Math.PI / 180);

  // Calculate deltas
  const deltaLat = (distance * Math.cos(headingRad)) / metersPerDegLat;
  const deltaLon = (distance * Math.sin(headingRad)) / metersPerDegLon;
  //  console.log("deltaLat:",deltaLat);
  //  console.log("deltaLon:", deltaLon);
  lat += deltaLat;
  lon += deltaLon;

  window.globalSimulationData.ILCA.lat = lat;
  window.globalSimulationData.ILCA.lon = lon;
}

// #6) Update ILCA on the map
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
   Laiya Time: ${window.globalSimulationData.ILCA.localTime}`
);

}
