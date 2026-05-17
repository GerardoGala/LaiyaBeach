import { updateTelemetry } from './telemetry.js';

export async function initWeatherLoop(config) {
  const apiKey = config.openWeatherApiKey;
  const lat = config.laiyaBeach.latitude;
  const lon = config.laiyaBeach.longitude;

  async function fetchWind() {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();

      const windSpeedMS = data.wind.speed;   // meters per second
      const windDeg = data.wind.deg;         // degrees from north

      // Convert to knots
      const windKnots = (windSpeedMS * 1.94384).toFixed(1);
      const compassDir = degToCompass(windDeg);

      // Push live wind into telemetry panel
      updateTelemetry(null, null, compassDir, windKnots);
    } catch (err) {
      console.error("Failed to fetch wind data:", err);
    }
  }

  // Fetch immediately, then every 30 seconds
  fetchWind();
  setInterval(fetchWind, 30000);
}

function degToCompass(num) {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ["N","NNE","NE","ENE","E","ESE","SE","SSE",
               "S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return arr[(val % 16)];
}
