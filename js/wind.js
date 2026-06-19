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

/**
 * Continuous loop adding gentle gusts and updating global state.
 */
function updateWindSimulation(timestamp) {
  const timeSeconds = (timestamp || performance.now()) / 1000;

  // gust / variance
  const gustVarianceMS = Math.sin(timeSeconds * 0.15) * 0.5;
  const currentSpeedMS = Math.max(3.6, baseWindSpeedMS + gustVarianceMS);

  // convert to knots (numeric)
  let windKnots = currentSpeedMS * 1.94384;

  // IMPORTANT: ensure no test multiplier here (do NOT multiply windKnots)
   windKnots = windKnots * 5; // <-- remove/commented

  const formattedWindKnots = Number(windKnots.toFixed(1));

  // direction oscillation
  const baseDirection = 0;
  const directionOscillation = Math.sin(timeSeconds * 0.08) * 5;
  const windDeg = Math.round((baseDirection + directionOscillation + 360) % 360);

  // Update global state as numbers
  window.globalSimulationData = window.globalSimulationData || {};
  window.globalSimulationData.windDirection = windDeg;
  window.globalSimulationData.windSpeed = formattedWindKnots;

  // UI update (if element exists)
  const windDiv = document.getElementById("windStatus");
  if (windDiv) {
    windDiv.textContent = `🌬️ Wind: ${formattedWindKnots} knots from ${windDeg}°`;
  }

  // Debug logging (optional; remove when stable)
  // console.debug('[wind] currentSpeedMS', currentSpeedMS, 'knots', formattedWindKnots, 'deg', windDeg);

  requestAnimationFrame(updateWindSimulation);
}
