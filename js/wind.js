// wind.js
export async function fetchWind() {
  const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
  const latitude = 13.676;
  const longitude = 121.437;
  const apiKey = "2ae1f247f2de797baacea07fe09b19b6";
  const units = "metric";

  const queryParams = `lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${units}`;
  const url = `${baseUrl}?${queryParams}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const windSpeedMS = data.wind?.speed ?? 0;
    const windDeg = data.wind?.deg ?? 0;
    const windKnots = +(windSpeedMS * 1.94384).toFixed(1);

    // ✅ Update global state
    window.globalSimulationData.windDirection = windDeg;
    window.globalSimulationData.windSpeed = windKnots;

    // ✅ Update Wind Status panel
    const windDiv = document.getElementById("windStatus");
    if (windDiv) {
      windDiv.innerHTML = `
        ${windDeg}°
        <br>${windKnots} knots
      `;
    }

    // ✅ Return values so destructuring works
    return { windDeg, windKnots };
  } catch (err) {
    console.error("Failed to fetch wind data:", err);

    window.globalSimulationData.windDirection = 0;
    window.globalSimulationData.windSpeed = 0;

    const windDiv = document.getElementById("windStatus");
    if (windDiv) {
      windDiv.innerHTML = `
        Direction: 0°
        <br>Speed: 0 knots
      `;
    }

    return { windDeg: 0, windKnots: 0 }; // ✅ return fallback object
  }
}
