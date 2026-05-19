export function updateILCA(map) {
  const headingDeg = window.globalSimulationData.heading;
  const speedKnots = window.globalSimulationData.speed;
  const lat = window.globalSimulationData.lat;
  const lon = window.globalSimulationData.lon;

  // Move east if launched
  if (speedKnots > 0) {
    const speedMS = speedKnots * 0.5144;
    const dt = 5; // seconds per tick
    const distance = speedMS * dt;
    const metersPerDegLon = 111320 * Math.cos(lat * Math.PI / 180);
    const deltaLon = distance / metersPerDegLon;
    window.globalSimulationData.lon = lon + deltaLon;
    window.globalSimulationData.lat = lat;
  }

  // Draw ILCA overlay
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
    [window.globalSimulationData.lat - 0.0005, window.globalSimulationData.lon - 0.0005],
    [window.globalSimulationData.lat + 0.0005, window.globalSimulationData.lon + 0.0005]
  ];

  const overlay = L.svgOverlay(boatSvgElement, bounds).addTo(map);
  overlay.bindPopup(
    `ILCA Sailboat<br>
     Heading: ${headingDeg}°<br>
     Speed: ${speedKnots} knots<br>
     Lat: ${window.globalSimulationData.lat.toFixed(5)}<br>
     Lon: ${window.globalSimulationData.lon.toFixed(5)}<br>
     Laiya Time: ${window.globalSimulationData.localTime}`
  );
}
