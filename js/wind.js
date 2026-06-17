// 📦 Global variable to store the base wind speed in m/s
// Defaulted to 3.6 m/s (which equals exactly 7.0 knots)
let baseWindSpeedMS = 3.6; 

/**
 * Fetches the initial wind data from the API once.
 */
export async function fetchWind() {
  try {
    const baseUrl = "https://openweathermap.org";
    const latitude = 13.676;
    const longitude = 121.437;
    const apiKey = "2ae1f247f2de797baacea07fe09b19b6"; 
    const units = "metric";

    const url = `${baseUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    // Enforce 3.6 m/s (7 knots) minimum wind speed rule
    baseWindSpeedMS = data.wind.speed < 3.6 ? 3.6 : data.wind.speed;

    // Start the continuous simulation loop after a successful fetch
    requestAnimationFrame(updateWindSimulation);

  } catch (err) {
    console.error("Wind API error. Falling back to 7 knots:", err);
    
    // 🛡️ API Fallback: Set base to 3.6 m/s (7.0 knots)
    baseWindSpeedMS = 3.6;
    
    // Start simulation loop anyway so the app continues running smoothly
    requestAnimationFrame(updateWindSimulation);
  }
}

/**
 * Continuous loop that adds mellow, real-time gusts and oscillations.
 */
function updateWindSimulation(timestamp) {
  const timeSeconds = timestamp / 1000;

  // 🌪️ 1. Mellow Wind Gust (Ensures speed never drops below 3.6 m/s / 7 knots)
  const gustVarianceMS = Math.sin(timeSeconds * 0.15) * 0.5; 
  const currentSpeedMS = Math.max(3.6, baseWindSpeedMS + gustVarianceMS);
  const windKnots = (currentSpeedMS * 1.94384).toFixed(1);

  // 🧭 2. Mellow Direction Oscillation
  const baseDirection = 0;
  const directionOscillation = Math.sin(timeSeconds * 0.08) * 5;
  const windDeg = Math.round((baseDirection + directionOscillation + 360) % 360);

  // 🔑 3. Update global simulation state
  if (window.globalSimulationData) {
    window.globalSimulationData.windDirection = windDeg;
    window.globalSimulationData.windSpeed = windKnots;
  }
   
  // 🖥️ 4. Update the UI
  const windDiv = document.getElementById("windStatus");
  if (windDiv) {
    windDiv.textContent = `🌬️ Wind: ${windKnots} knots from ${windDeg}°`;
  }

  // 🔄 Keep the animation loop running
  requestAnimationFrame(updateWindSimulation);
}
