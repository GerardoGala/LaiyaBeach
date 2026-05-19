export function updateILCA(map) {
  const ilcaDiv = document.getElementById("ilca");
  ilcaDiv.innerHTML = `
    Heading: ${window.globalSimulationData.heading}°
    <br>Speed: ${window.globalSimulationData.speed} knots
  `;

  const laiyaTimeDiv = document.getElementById("laiyaTime");
  const now = new Date();
  const options = { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit" };
  const localTime = now.toLocaleTimeString("en-US", options);
  laiyaTimeDiv.innerHTML = `${localTime}
  `;

  // Spawn ILCA marker...
}
