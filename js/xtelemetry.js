export function updateTelemetry(
  headingDeg = 0,
  speedKnots = 0,
  windDir = "N",
  windSpeed = 0
) {
  const telemetryDiv = document.getElementById('telemetry');

  const now = new Date();
  const options = { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit" };
  const localTime = now.toLocaleTimeString("en-US", options);

  telemetryDiv.innerHTML = `
    <h2>Telemetry</h2>
    <p>Heading: ${headingDeg}°</p>
    <p>Speed: ${speedKnots} knots</p>
    <p>Wind: ${windDir} ${windSpeed} knots</p>
    <p>Local Time (Laiya-Aplaya): ${localTime}</p>
  `;
}
