// ilcaMap.js
export function drawILCAOnMap(map) {
  const ilca = window.globalSimulationData.ILCA;
  const heading = ilca.heading;

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
    [ilca.lat - 0.0002, ilca.lon - 0.0002],
    [ilca.lat + 0.0002, ilca.lon + 0.0002]
  ];

  const overlay = L.svgOverlay(boatSvgElement, bounds).addTo(map);
  overlay.bindPopup(
    `ILCA Sailboat<br>
     Heading: ${heading}°<br>
     Speed: ${ilca.speed} knots<br>
     Lat: ${ilca.lat.toFixed(5)}<br>
     Lon: ${ilca.lon.toFixed(5)}<br>
     Timer: ${ilca.timer}`
  );
}
