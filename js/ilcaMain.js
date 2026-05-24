// ilcaMain.js
import { handleControls } from "./ilcaControls.js";
import { drawILCAOnMap } from "./ilcaMap.js";

export function updateILCA(map) {
  const windDir = window.globalSimulationData.windDirection;
  const windSpeed = window.globalSimulationData.windSpeed;

  // Run maneuver & control logic
  handleControls(windDir, windSpeed);

  // Update position
  const speedKnots = window.globalSimulationData.ILCA.speed;
  let lat = window.globalSimulationData.ILCA.lat;
  let lon = window.globalSimulationData.ILCA.lon;

  if (speedKnots > 0) {
    const speedMS = speedKnots * 0.5144;
    const dt = 1;
    const distance = speedMS * dt;

    const headingRad = window.globalSimulationData.ILCA.heading * Math.PI / 180;
    const metersPerDegLat = 111320;
    const metersPerDegLon = 111320 * Math.cos(lat * Math.PI / 180);

    const deltaLat = (distance * Math.cos(headingRad)) / metersPerDegLat;
    const deltaLon = (distance * Math.sin(headingRad)) / metersPerDegLon;

    lat += deltaLat;
    lon += deltaLon;

    window.globalSimulationData.ILCA.lat = lat;
    window.globalSimulationData.ILCA.lon = lon;
  }

  // Draw overlay
  drawILCAOnMap(map);
}
