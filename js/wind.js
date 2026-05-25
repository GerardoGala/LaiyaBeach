export async function fetchWind() {
  try {
    const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
    const latitude = 13.676;
    const longitude = 121.437;
    const apiKey = "2ae1f247f2de797baacea07fe09b19b6"; // replace with your key
    const units = "metric";

    const url = `${baseUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    const windSpeedMS = data.wind.speed;
    const windDeg = data.wind.deg;
    const windKnots = (windSpeedMS * 1.94384).toFixed(1);

    // 🔑 update global state
    window.globalSimulationData.windDirection = windDeg;
    window.globalSimulationData.windSpeed = windKnots;
   
  
    const windDiv = document.getElementById("windStatus");
    if (windDiv) {
      windDiv.textContent = `🌬️ Wind: ${windKnots} knots from ${windDeg}°`;
    }
  } catch (err) {
    console.error("Wind API error:", err);
    const windDiv = document.getElementById("windStatus");
    if (windDiv) {
      windDiv.textContent = "⚠️ Unable to load wind data.";
    }
  }
}
