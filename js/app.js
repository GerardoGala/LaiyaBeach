// app.js
let config = {};
let map;

// Load configuration first
async function loadConfig() {
  try {
    const response = await fetch('config.json');
    config = await response.json();
    initMap();
    initWeatherLoop();
    initBoatLoop();
  } catch (err) {
    console.error("Failed to load config.json:", err);
  }
}

function initMap() {
  // Coordinates from config
  const laiya = {
    lat: config.laiyaBeach.latitude,
    lng: config.laiyaBeach.longitude
  };

  // Create the map


  // Add a marker for ILCA launch point


  // Add buoy marker
  const buoy = {
    lat: config.markBouy.latitude,
    lng: config.markBouy.longitude
  };

}

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
