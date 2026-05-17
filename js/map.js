export function initMap(config) {
  const laiya = [config.laiyaBeach.latitude, config.laiyaBeach.longitude];
  const buoy = [config.markBuoy.latitude, config.markBuoy.longitude];

  const map = L.map('map').setView(laiya, config.mapOptions.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker(laiya).addTo(map).bindPopup("ILCA Launch Point");
  L.marker(buoy).addTo(map).bindPopup("Mark Buoy");

  return map;
}
