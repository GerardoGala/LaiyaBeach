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

    const windSpeedMS = data.wind.speed;
    const windDeg = data.wind.deg;
    const windKnots = (windSpeedMS * 1.94384).toFixed(1);

    // Update Wind Status panel
    const windDiv = document.getElementById("windStatus");
    if (windDiv) {
      windDiv.innerHTML = `
        Direction: ${windDeg}°
        <br>Speed: ${windKnots} knots
      `;
    }

    return { windDeg, windKnots };
  } catch (err) {
    console.error("Failed to fetch wind data:", err);
    return { windDeg: 0, windKnots: 0 };
  }
}
