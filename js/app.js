// app.js

// Declare L as coming from Leaflet
/* eslint-disable no-undef */

let config = {};
let map;

// Load configuration first
async function loadConfig() {
  try {
    const response = await fetch('config.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    config = await response.json();
    console.log("config object at initMap:", config);
console.log("config.markBuoy at initMap:", config.markBuoy);

    console.log("Loaded config:", config);  // 👀 should show full object
    console.log("markBuoy:", config.markBuoy); // 👀 should show lat/lng

    // ✅ Only call after config is ready
    initMap();
    initWeatherLoop();
    initBoatLoop();
  } catch (err) {
    console.error("Failed to load config.json:", err);
  }
}


function initMap() {
    if (!config.laiyaBeach || !config.markBuoy) {
    console.error("Missing laiyaBeach or markBuoy in config.json:", config);
    return;
  }
  const laiya = [config.laiyaBeach.latitude, config.laiyaBeach.longitude];
  const buoy = [config.markBuoy.latitude, config.markBuoy.longitude];

  // Create Leaflet map
  map = L.map('map').setView(laiya, config.mapOptions.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // ILCA launch point marker
  L.marker(laiya).addTo(map).bindPopup("ILCA Launch Point");

  // Buoy marker
  L.marker(buoy).addTo(map).bindPopup("Mark Buoy");
}





 


  // Add buoy marker
  const buoy = {

  };



// --- Weather API ---
async function getWindData() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${config.laiyaBeach.latitude}&lon=${config.laiyaBeach.longitude}&appid=${config.weatherApiKey}&units=metric`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    const windSpeed = data.wind.speed;   // m/s
    const windDirection = data.wind.deg; // degrees

    // ✅ Get local time in Laiya Beach (Asia/Manila timezone)
    const now = new Date();
    const localTime = now.toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    document.getElementById("windInfo").innerText =
      `Wind: ${windSpeed.toFixed(2)} m/s @ ${windDirection}° | Time: ${localTime}`;

    // TODO: update wind vector overlay on map
  } catch (err) {
    console.error("Failed to fetch wind data:", err);
  }
}

function initWeatherLoop() {
  getWindData(); // initial call
  setInterval(getWindData, config.updateIntervals.windApi);
}

// --- Boat Loop (placeholder for ILCA updates) ---
function updateBoatPosition() {
  // TODO: implement boat movement logic
  console.log("Boat position updated...");
}

function initBoatLoop() {
  setInterval(updateBoatPosition, config.updateIntervals.ilcaBoat);
}

// Start everything
window.onload = loadConfig;
