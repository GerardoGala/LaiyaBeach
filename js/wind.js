export async function initWind() {
  // Step 1: Define constants
  const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
  const latitude = 13.676;
  const longitude = 121.437;
  const apiKey = "2ae1f247f2de797baacea07fe09b19b6";
  const units = "metric";

  // Step 2: Build query parameters
  const queryParams = `lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${units}`;

  // Step 3: Concatenate into full URL
  const url = `${baseUrl}?${queryParams}`;

  async function fetchWind() {
    try {
      const response = await fetch(url);
      const data = await response.json();

      const windSpeedMS = data.wind.speed;   // meters per second
      const windDeg = data.wind.deg;         // degrees from north

      // Convert to knots
      const windKnots = (windSpeedMS * 1.94384).toFixed(1);
      const compassDir = windDeg;

      // Update Wind display
      const windDiv = document.getElementById("wind");
      if (windDiv) {
        windDiv.textContent = `${compassDir} ${windKnots} knots`;
      }
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
