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

  // --- CONTROL TEXT LOOKUP DICTIONARIES ---
  // These match your UI lookup rules perfectly
  const daggerboardLabels = { '2': 'Down', '0': 'Center', '-2': 'Up' };
  const vangLabels        = { '2': 'LOOSE', '0': 'CENTER', '-2': 'TIGHT' };
  const downhaulLabels    = { '2': 'OFF', '0': 'BASE', '-2': 'MAX LUFF' };
  const outhaulLabels     = { '2': 'FULL', '0': 'BASE', '-2': 'FLAT' };

  // Safely extract numbers and convert them to their corresponding text labels
  const dbKey = String(ilca.daggerboard);
  const textDaggerboard = daggerboardLabels[dbKey] || 'Unknown';

  const vangKey = String(ilca.vang);
  const textVang = vangLabels[vangKey] || vangKey || 'CENTER';

  const downhaulKey = String(ilca.downhaul);
  const textDownhaul = downhaulLabels[downhaulKey] || downhaulKey || 'BASE';

  const outhaulKey = String(ilca.outhaul);
  const textOuthaul = outhaulLabels[outhaulKey] || outhaulKey || 'BASE';

  // Append only high-value, pruned time-series metrics for the AI window
  window.globalSimulationData.history.push({
    second: ilca.timer,
    // Shift the leg count by 1 so the history records Leg 1 instead of Leg 0
    leg: (typeof sim.currentLeg === "number") ? sim.currentLeg + 1 : 1,
    windSpeedKnots: Number(sim.windSpeed) || 0,
    windDirection: Number(sim.windDirection) || 0,
    heading: Math.round(ilca.heading || 0),
    speedKnots: parseFloat((ilca.speed || 0).toFixed(1)),
    pointOfSail: ilca.pointOfSail || "Unknown",
    heelAngle: Math.round(ilca.heelAngle || ilca.clinometer || 0),
    vmg: parseFloat((ilca.vmg || 0).toFixed(1)),
    
    // Controls & Trim (Now updated to record actual descriptive text labels!)
    sailorPos: ilca.sailorPosition || "Mid Center",
    boomAngle: ilca.boomAngle || 0,
    daggerboard: textDaggerboard,
    vang: textVang,
    downhaul: textDownhaul,
    outhaul: textOuthaul,

    // Tactical Context
    distToMark: Math.round(ilca.distanceToBuoy || 0),
    bearingToMark: Math.round(ilca.bearingToBuoy || 0)
  });
  
  // ✅ Save ONLY the history array! (It has all your time/wind data, but no heavy map objects)
  if (window.globalSimulationData && window.globalSimulationData.history) {
    localStorage.setItem("finalTelemetryData", JSON.stringify(window.globalSimulationData.history));
  }
}
