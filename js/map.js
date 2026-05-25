// map.js
let windControlDiv; // keep reference so we can update later

export function initMap() {
  const laiya = [13.670464, 121.401286];
  const buoyLat = window.globalSimulationData.buoyLat;
  const buoyLng = window.globalSimulationData.buoyLon;

  // Tomato buoy SVG (yellow with orange outline)
  const buoySVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="yellow" stroke="orange" stroke-width="4"/>
      <circle cx="24" cy="24" r="8" fill="orange" opacity="0.6"/>
    </svg>
  `;

  const buoyIcon = L.icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(buoySVG),
    iconSize: [20, 20],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });

  const map = L.map('map');

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Launch point marker
  L.marker(laiya).addTo(map).bindPopup("ILCA Launch Point");

  // Buoy marker
  L.marker([buoyLat, buoyLng], { icon: buoyIcon })
    .addTo(map)
    .bindPopup("Race Buoy");

  // --- Wind Direction Indicator ---
  const WindControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      windControlDiv = L.DomUtil.create('div', 'wind-indicator-container');
      windControlDiv.style.background = 'white';
      windControlDiv.style.padding = '8px';
      windControlDiv.style.borderRadius = '5px';
      windControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      windControlDiv.style.textAlign = 'center';
      windControlDiv.style.fontFamily = 'sans-serif';
      windControlDiv.style.fontSize = '12px';
      windControlDiv.style.fontWeight = 'bold';

      // draw initial arrow
      updateWindControl(map);
      return windControlDiv;
    }
  });

  map.addControl(new WindControl());
  // -------------------------------------

  // Fit map to show both markers, with padding
  const bounds = L.latLngBounds([laiya, [buoyLat, buoyLng]]);
  map.fitBounds(bounds, { padding: [50, 50] });

  return map;
}

// --- Refresh function to update wind arrow dynamically ---
export function updateWindControl(map) {
  if (!windControlDiv) return;

  const windDir = window.globalSimulationData.windDirection || 0;

  windControlDiv.innerHTML = `
    <div style="margin-bottom: 4px;">WIND</div>
    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="22" fill="none" stroke="#ccc" stroke-width="2"/>
      <text x="25" y="10" font-size="8" text-anchor="middle" fill="#666">N</text>
      <g transform="rotate(${windDir}, 25, 25)">
        <line x1="25" y1="5" x2="25" y2="40" stroke="blue" stroke-width="3" stroke-linecap="round"/>
        <polygon points="25,45 20,35 30,35" fill="blue" />
      </g>
    </svg>
    <div style="margin-top: 4px; color: blue;">${windDir}°</div>
  `;
}
