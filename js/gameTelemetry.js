// simulationTelemetry.js

/**
 * Appends a clean, filtered performance snapshot of the current second
 * into the simulation history for the AI coaching evaluation.
 */
export function recordTelemetrySnapshot() {
  // Initialize the history array if it doesn't exist yet
  if (!window.globalSimulationData.history) {
    window.globalSimulationData.history = [];
  }

  const sim = window.globalSimulationData;
  const ilca = sim.ILCA;

  // Append only high-value, pruned time-series metrics for the AI window
  window.globalSimulationData.history.push({
    second: ilca.timer,
    leg: sim.currentLeg,
    windSpeed: Number(sim.windSpeed) || 0,
    heading: Math.round(ilca.heading || 0),
    speedKnots: parseFloat((ilca.speed || 0).toFixed(1)),
    pointOfSail: ilca.pointOfSail || "Unknown",
    heelAngle: Math.round(ilca.heelAngle || ilca.clinometer || 0),
    vmg: parseFloat((ilca.vmg || 0).toFixed(1)),
    
    // Controls & Trim
    sailorPos: ilca.sailorPosition || "Mid Center",
    boomAngle: ilca.boomAngle || 0,
    vang: ilca.vang || 0,
    downhaul: ilca.downhaul || 0,
    outhaul: ilca.outhaul || 0,

    // Tactical Context
    distToMark: Math.round(ilca.distanceToBuoy || 0),
    bearingToMark: Math.round(ilca.bearingToBuoy || 0)
  });
  // ✅ Save ONLY the history array! (It has all your time/wind data, but no heavy map objects)
  if (window.globalSimulationData && window.globalSimulationData.history) {
    localStorage.setItem("finalTelemetryData", JSON.stringify(window.globalSimulationData.history));
  }
}
