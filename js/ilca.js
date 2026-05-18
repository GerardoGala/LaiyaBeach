export function updateILCA(map) {
  const ilcaDiv = document.getElementById("ilca");

  const now = new Date();
  const options = { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit" };
  const localTime = now.toLocaleTimeString("en-US", options);

  ilcaDiv.innerHTML = `
    Heading: ${window.simulationData.heading}°
    <br>Speed: ${window.simulationData.speed} knots
    <br>${localTime}
  `;

  // Spawn ILCA marker...
}
