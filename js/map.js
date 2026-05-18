export function initMap(config) {
  const laiya = [13.676, 121.437];
  const buoy = [13.690, 121.450];

  const map = L.map('map').setView(laiya, 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker(laiya).addTo(map).bindPopup("ILCA Launch Point");
  L.marker(buoy).addTo(map).bindPopup("Mark Buoy");

  return map;
}
