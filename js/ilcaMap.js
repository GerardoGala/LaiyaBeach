// ilcaMap.js
export function drawILCAOnMap(map) {
  const ilca = window.globalSimulationData.ILCA;
  const heading = ilca.heading;

const boatSvgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 168" width="0.375in" height="1.05in">
  <g transform="rotate(${heading}, 30, 84) scale(0.5)">
    <g transform="rotate(180, 30, 84)">
      <path d="M 46,0 
               C 49,40 54,90 44,130 
               Q 38,155 30,168 
               Q 22,155 16,130 
               C 6,90 11,40 14,0 
               Z" 
            fill="#f8f9fa" 
            stroke="#212529" 
            stroke-width="0.75" />
    </g>
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
