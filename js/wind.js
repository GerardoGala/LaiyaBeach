// js/wind.js
export let baseWindSpeedMS = 3.6; // default fallback (3.6 m/s ≈ 7.0 knots)

/**
 * Fetch initial wind from OpenWeatherMap and start the simulation loop.
 */
export async function fetchWind() {
  try {
    const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
    const latitude = 13.676;
    const longitude = 121.437;
    const apiKey = "2ae1f247f2de797baacea07fe09b19b6"; // ensure this key is valid for API usage
    const units = "metric";

    const url = `${baseUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${units}`;
    console.log("[wind] Fetching:", url);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok: " + response.status);
    const data = await response.json();
    console.log("[wind] API data:", data);

    if (data && data.wind && typeof data.wind.speed === "number") {
      // Keep the minimum 3.6 m/s rule
      baseWindSpeedMS = data.wind.speed < 3.6 ? 3.6 : data.wind.speed;
      console.log("[wind] baseWindSpeedMS set to", baseWindSpeedMS, "m/s");
    } else {
      console.warn("[wind] Missing wind.speed in API response; falling back to 3.6 m/s");
      baseWindSpeedMS = 3.6;
    }

    // Start animation loop
    requestAnimationFrame(updateWindSimulation);

  } catch (err) {
    console.error("[wind] Fetch error; using fallback 3.6 m/s:", err);
    baseWindSpeedMS = 3.6;
    requestAnimationFrame(updateWindSimulation);
  }
}

// Add these two variables at the very top of your js/wind.js file 
// to keep track of the changing random wind over time.
let randomWindShift = 0;
let lastUpdateTime = performance.now() / 1000;

function updateWindSimulation(timestamp) {
  const timeSeconds = (timestamp || performance.now()) / 1000;
  const deltaTime = timeSeconds - lastUpdateTime;
  lastUpdateTime = timeSeconds;

  // --- 1. SMOOTH GUST VARIANCE ---
  const gustVarianceMS = Math.sin(timeSeconds * 0.15) * 0.5;
  const currentSpeedMS = Math.max(3.6, baseWindSpeedMS + gustVarianceMS);
  let windKnots = currentSpeedMS * 1.94384;
  const formattedWindKnots = Number(windKnots.toFixed(1));

  // --- 2. UNPREDICTABLE RANDOM DIRECTION SHIFTS ---
  // On every frame, there is a tiny chance the wind direction shifts randomly.
  // This simulates real-world lake or ocean wind shifts.
  if (Math.random() < 0.02) { 
    // Shift the wind direction by a random amount between -3 and +3 degrees
    const shiftDelta = (Math.random() - 0.5) * 6;
    randomWindShift += shiftDelta;
    
    // Keep the total random shift within a realistic boundary (e.g., max 20 degrees left or right)
    randomWindShift = Math.max(-20, Math.min(20, randomWindShift));
  }

  // Combine the original base direction, the smooth wave oscillation, and the new random shift
  const baseDirection = 0;
  const directionOscillation = Math.sin(timeSeconds * 0.08) * 5;
  const windDeg = Math.round((baseDirection + directionOscillation + randomWindShift + 360) % 360);

  // --- 3. UPDATE GLOBAL STATE & UI ---
  window.globalSimulationData = window.globalSimulationData || {};
  window.globalSimulationData.windDirection = windDeg;
  window.globalSimulationData.windSpeed = formattedWindKnots;

  const windDiv = document.getElementById("windStatus");
  if (windDiv) {
    windDiv.textContent = `🌬️ Wind: ${formattedWindKnots} knots from ${windDeg}°`;
  }

  requestAnimationFrame(updateWindSimulation);
}

