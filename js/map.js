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

  // Fit map to show both markers, with padding
  const bounds = L.latLngBounds([laiya, [buoyLat, buoyLng]]);
  map.fitBounds(bounds, { padding: [50, 50] });

  return map;
}
