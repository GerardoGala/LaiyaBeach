// Global simulation state
window.globalSimulationData = {
  windDirection: 0,
  windSpeed: 0,       // no wind yet
  tillerAngle: 0,     // controlled by buttons
  heading: 180,       // default heading out to sea
  speed: 0            // stationary until launch
};

// Button handler: adjust tiller angle
window.adjustHeading = function(delta) {
  let angle = window.globalSimulationData.tillerAngle;
  angle += delta;

  // wrap 0–359
  if (angle < 0) angle += 360;
  if (angle >= 360) angle -= 360;

  window.globalSimulationData.tillerAngle = angle;

  // Optional: update tiller control UI
  const tiller = document.getElementById("tillerControl");
  if (tiller) {
    tiller.textContent = `Tiller Angle: ${angle}°`;
  }
};
