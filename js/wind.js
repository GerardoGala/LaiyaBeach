// =========================================================================
// ⚓ FLAT TACTICAL WIND ENGINE (wind.js) - STRATEGIC SCOPE EDITION
// =========================================================================

// --- 1. Safely Initialize Clean Global Data Object ---
window.globalSimulationData = window.globalSimulationData || {
  windSpeed: 0,
  windDirection: 0
};

// --- 2. Calculate & Freeze Wind Speed Immediately on Page Load ---
const now = new Date();
const decimalHour = now.getHours() + (now.getMinutes() / 60);

// Batangas diurnal cycle profile (Wind naturally peaks around 14:00 / 2 PM)
const BASE_WIND = 9.0;   
const DIURNAL_AMPLITUDE = 3.5; 
const timeRadians = (2 * Math.PI * (decimalHour - 14)) / 24;

let calculatedSpeed = BASE_WIND + (DIURNAL_AMPLITUDE * Math.cos(timeRadians));
if (calculatedSpeed < 7.8) {
  calculatedSpeed = 7.8; // Enforce minimum sailing threshold
}

// Stays perfectly constant for the entire lifetime of the race match
const FROZEN_RACE_SPEED = parseFloat(calculatedSpeed.toFixed(1));

// Set absolute initial values right at page load
window.globalSimulationData.windSpeed = FROZEN_RACE_SPEED;
window.globalSimulationData.windDirection = 0;

// --- 3. Run Continuous Mellow Loop with Strategic Grace Window ---
// Math.sin(0) = 0, which guarantees a perfectly smooth exit from the grace period.
let waveTimeline = 0; 

// Grace period configuration (10 ticks = 1 second)
// 450 ticks = 45 seconds of steady 0° wind for fair scouting and starting.
let graceTicksRemaining = 450; 

setInterval(() => {
  let shiftDegrees = 0;

  if (graceTicksRemaining > 0) {
    // 🚦 SCOUTING & STARTING PHASE: Hold wind straight down the course line
    graceTicksRemaining--;
    shiftDegrees = 0;
  } else {
    // ⛵ FLEET IS UNDERWAY: Advance the timeline for gentle oscillation
    waveTimeline += 0.0008; 
    shiftDegrees = Math.round(Math.sin(waveTimeline) * 12);
  }
  
  // 🔑 Continuously update global data properties directly
  window.globalSimulationData.windDirection = shiftDegrees;
  window.globalSimulationData.windSpeed = FROZEN_RACE_SPEED;

  // Determine tactical label based on the shift direction
  let shiftType = "Steady (Scouting Course)";
  if (graceTicksRemaining <= 0) {
    if (shiftDegrees > 2) shiftType = "Lift (Right Shift)";
    if (shiftDegrees < -2) shiftType = "Header (Left Shift)";
    if (shiftDegrees >= -2 && shiftDegrees <= 2) shiftType = "Steady";
  }

  // Update UI text element if it exists
  const windDiv = document.getElementById("windStatus");
  if (windDiv) {
    const statusText = graceTicksRemaining > 0 
      ? `⏳ [Steady Lock: ${Math.ceil(graceTicksRemaining / 10)}s] ` 
      : "";
    windDiv.textContent = `🌬️ Wind: ${FROZEN_RACE_SPEED.toFixed(1)} knots from ${shiftDegrees}° (${statusText}${shiftType})`;
  }
}, 100); // Evaluates 10 times a second

// --- 4. Export Clean Interface to External Modules ---
/**
 * Resolves instantly using the flattened properties.
 */
export async function fetchWind() {
  return {
    direction: window.globalSimulationData.windDirection,
    speed: window.globalSimulationData.windSpeed
  };
}

console.log(`[Wind Engine Ready] Locked at ${FROZEN_RACE_SPEED} kn. 45s strategic steady window active.`);
