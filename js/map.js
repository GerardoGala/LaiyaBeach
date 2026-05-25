export function initMap() {
  const laiya = [13.670464, 121.401286];
  const buoyLat = window.globalSimulationData.buoyLat;
  const buoyLng = window.globalSimulationData.buoyLon;
  // Get the wind direction from the global state
  const windDir = window.globalSimulationData.windDirection;

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
      const div = L.DomUtil.create('div', 'wind-indicator-container');
      
      div.style.background = 'white';
      div.style.padding = '8px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      div.style.textAlign = 'center';
      div.style.fontFamily = 'sans-serif';
      div.style.fontSize = '12px';
      div.style.fontWeight = 'bold';

      div.innerHTML = `
        <div style="margin-bottom: 4px;">WIND</div>
        <svg xmlns="http://w3.org" width="50" height="50" viewBox="0 0 50 50">
          <!-- Compass ring -->
          <circle cx="25" cy="25" r="22" fill="none" stroke="#ccc" stroke-width="2"/>
          <text x="25" y="10" font-size="8" text-anchor="middle" fill="#666">N</text>
          
          <!-- Wind Arrow (Now points straight down at 0 degrees) -->
          <g transform="rotate(${windDir}, 25, 25)">
            <!-- Arrow shaft moving from top to bottom -->
            <line x1="25" y1="5" x2="25" y2="40" stroke="blue" stroke-width="3" stroke-linecap="round"/>
            <!-- Arrow head shifted to the bottom end pointing downward -->
            <polygon points="25,45 20,35 30,35" fill="blue" />
          </g>
        </svg>
        <div style="margin-top: 4px; color: blue;">${windDir}°</div>
      `;
      return div;
    }
  });

  map.addControl(new WindControl());
  // -------------------------------------

  // Fit map to show both markers, with padding
  const bounds = L.latLngBounds([laiya, [buoyLat, buoyLng]]);
  map.fitBounds(bounds, { padding: [50, 50] });

  return map;
}