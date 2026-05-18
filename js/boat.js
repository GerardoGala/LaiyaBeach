let heading = 180; 
let position;      

export function initBoatLoop(map) {
  // start at launch point
  position = [13.669100, 121.401117];

  setInterval(() => {
    heading = (heading + 5) % 360; // rotate mockup
    moveBoatEast();          // update position eastward
    plotBoat(map, heading, position);
  }, 2000); // still every 2 seconds
}

function moveBoatEast() {
  // Increase speed to make boats farther apart
  const speedKnots = 200; // try 20 knots instead of 8
  const speedMS = speedKnots * 0.5144; // convert to m/s
  const dt = 2; // seconds per tick
  const distance = speedMS * dt; // meters traveled each tick

  // convert meters east to degrees longitude at current latitude
  const metersPerDegLon = 111320 * Math.cos(position[0] * Math.PI / 180);
  const deltaLon = distance / metersPerDegLon;

  position[1] += deltaLon; // update longitude eastward
}

function plotBoat(map, headingDeg, pos) {
  // keep adding new overlays, don’t remove old ones
  const boatSvgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g transform="rotate(${headingDeg}, 50, 50)">
        <polygon points="50,10 85,85 15,85" fill="white" stroke="black" stroke-width="2"/>
        <polygon points="30,85 70,85 60,95 40,95 35,90" fill="blue" stroke="black" stroke-width="2"/>
      </g>
    </svg>
  `;
  const parser = new DOMParser();
  const boatSvgElement = parser.parseFromString(boatSvgMarkup, "image/svg+xml").documentElement;

  const bounds = [
    [pos[0] - 0.0005, pos[1] - 0.0005],
    [pos[0] + 0.0005, pos[1] + 0.0005]
  ];

  const overlay = L.svgOverlay(boatSvgElement, bounds).addTo(map);
  overlay.bindPopup(`ILCA Sailboat<br>Heading: ${headingDeg}°<br>Lat: ${pos[0].toFixed(5)}<br>Lon: ${pos[1].toFixed(5)}`);
}
