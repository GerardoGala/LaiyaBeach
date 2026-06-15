// =========================================================================
// ⚓ FLAT TACTICAL WIND ENGINE (wind.js) - CHAOTIC OSCILLATION + GUST ENGINE
// =========================================================================

window.globalSimulationData = window.globalSimulationData || {
  windSpeed: 0,
  windDirection: 0
};

// Calculate & Freeze Wind Speed Immediately on Page Load
const now = new Date();
const decimalHour = now.getHours() + (now.getMinutes() / 60);
const BASE_WIND = 20.0;   
const DIURNAL_AMPLITUDE = 3.5; 
const timeRadians = (2 * Math.PI * (decimalHour - 14)) / 24;

let calculatedSpeed = BASE_WIND + (DIURNAL_AMPLITUDE * Math.cos(timeRadians));
if (calculatedSpeed < 7.8) calculatedSpeed = 7.8; 

const FROZEN_RACE_SPEED = parseFloat(calculatedSpeed.toFixed(1));

window.globalSimulationData.windSpeed = FROZEN_RACE_SPEED;
window.globalSimulationData.windDirection = 0;

// --- CHAOTIC OSCILLATION STATE ---
let macroTimeline = Math.random() * 100;
let microTimeline = Math.random() * 100;
let graceTicksRemaining = 450; // 45 seconds steady scouting window

// --- 💨 GUST ENGINE STATE VARIATION TRACKING ---
let gustDurationTicks = 0; // Duration container tracker for an active gust cycle
let activeGustSpeed = 0;   // The temporary velocity spike value container

setInterval(() => {
  let shiftDegrees = 0;

  if (graceTicksRemaining > 0) {
    graceTicksRemaining--;
    shiftDegrees = 0;
  } else {
    // 🌊 Advance multiple overlapping timelines at different speeds
    macroTimeline += 0.0006; // Slow macro pressure band
    microTimeline += 0.0035; // Faster local wind texture

    // Combine sine waves to destroy the predictable pattern
    const baseWave = Math.sin(macroTimeline) * 8;
    const rippleWave = Math.cos(microTimeline) * 4;
    
    // Add a tiny micro random drift step to make it truly non-linear
    const randomDrift = (Math.random() - 0.5) * 0.5;
    macroTimeline += randomDrift * 0.001;

    // Aggregate and round cleanly
    shiftDegrees = Math.round(baseWave + rippleWave);

    // Hard clamp to keep tactical limits within an authentic ILCA racing frame
    if (shiftDegrees > 14) shiftDegrees = 14;
    if (shiftDegrees < -14) shiftDegrees = -14;
  }
  
  // --- ⛵ DYNAMIC 10% RANDOM HEAVY GUST INJECTION LOOP ---
  let currentActiveWindSpeed = FROZEN_RACE_SPEED;

  if (gustDurationTicks > 0) {
    // A gust is currently active! Countdown its execution cycle life framework
    gustDurationTicks--;
    currentActiveWindSpeed = activeGustSpeed;
  } else {
    // No active gust running. Roll a 10% chance probability on every 5-second interval boundary
    // Since this runs every 100ms, a 1-in-500 chance perfectly replicates a 10% threat matrix over a 5s window
    if (Math.random() < (0.10 / 50)) {
      // 💨 Gust triggered! Calculate an intense wind warning spike (> 22 Knots)
      activeGustSpeed = parseFloat((22.5 + Math.random() * 3.5).toFixed(1));
      // Keep the gust alive for a realistic duration (between 3 to 7 seconds long)
      gustDurationTicks = Math.round(30 + Math.random() * 40); 
      currentActiveWindSpeed = activeGustSpeed;
      console.warn(`💨 GUST INJECTED! Wind velocity spiked to ${activeGustSpeed} knots for ${gustDurationTicks / 10} seconds!`);
    }
  }

  // 🔑 Continuously update global data properties directly
  window.globalSimulationData.windDirection = shiftDegrees;
  window.globalSimulationData.windSpeed = currentActiveWindSpeed;

  let shiftType = "Steady (Scouting Course)";
  if (graceTicksRemaining <= 0) {
    if (shiftDegrees > 2) shiftType = "Lift (Right Shift)";
    if (shiftDegrees < -2) shiftType = "Header (Left Shift)";
    if (shiftDegrees >= -2 && shiftDegrees <= 2) shiftType = "Steady";
  }

  // If a gust is raging, append a text flag warning directly onto your telemetry container window
  if (gustDurationTicks > 0) {
    shiftType += " 🔥 [⚠️ HEAVY GUST ACTIVE]";
  }

  const windDiv = document.getElementById("windStatus");
  if (windDiv) {
    const statusText = graceTicksRemaining > 0 ? `⏳ [Steady Lock: ${Math.ceil(graceTicksRemaining / 10)}s] ` : "";
    windDiv.textContent = `🌬️ Wind: ${currentActiveWindSpeed.toFixed(1)} knots from ${shiftDegrees}° (${statusText}${shiftType})`;
  }
}, 100);

export async function fetchWind() {
  return {
    direction: window.globalSimulationData.windDirection,
    speed: window.globalSimulationData.windSpeed
  };
}
