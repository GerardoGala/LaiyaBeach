export function updateILCA(headingDeg = 0, speedKnots = 0) {
  const ilcaDiv = document.getElementById("ilca");

  const now = new Date();
  const options = { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit" };
  const localTime = now.toLocaleTimeString("en-US", options);

  ilcaDiv.innerHTML = `
    Heading: ${headingDeg}°
    <br>Speed: ${speedKnots} knots
    <br>${localTime}
  `;
}
