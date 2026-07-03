// js/askAiEvaluateSnapshot.js
import { getWindTier, SCENARIO_TARGETS } from './ilcaTargets.js';

/**
 * Performs a deep diagnostic assessment on a single simulation snapshot.
 * Generates structured HTML tip cards directly inside the target DOM container.
 * @param {object} sim - The active window.parent.globalSimulationData context profile
 * @param {HTMLElement} container - The target DOM wrapper container element
 */
export function evaluateSnapshot(sim, container) {
  if (!container) return;
  container.innerHTML = ""; // Clear old caching messages safely

  // Core system guard clauses
  if (!sim || !sim.ILCA) {
    container.innerHTML = "<div class='tip-item critical-error'>Error: Active simulation context not detected.</div>";
    return;
  }

  // Flag the profile runner as disqualified from the official leaderboards
  sim.askedAI = true;

  const ilca = sim.ILCA;

  // Catastrophic status handler checks
  if (ilca.capsized) {
    container.innerHTML = "<div class='tip-item critical-error'>❌ <strong>You are capsized!</strong> Right the boat before trimming your lines.</div>";
    return;
  }

  // Identify general point of sail lookup groupings
  let lookupHeading = ilca.pointOfSail || "Close Hauled";
  if (lookupHeading.includes("Reach")) lookupHeading = "Reaching";

  // Pull strategy configuration targets from database metrics file
  const windTier = getWindTier(Number(sim.windSpeed) || 0);
  const targets = SCENARIO_TARGETS[lookupHeading][windTier];

  let tipsHTML = "<div class='tips-list'>";
  let correctionsFound = 0;

  // --- 1. BOOM ANGLE DIAGNOSTIC ---
  // Safely parse the selected UI range string (e.g., "35-65") into separate numbers
  const currentBoomStr = String(ilca.boomAngle || "0-0");
  const parts = currentBoomStr.split('-');
  const currentMinBoom = Number(parts[0]) || 0;
  const currentMaxBoom = parts[1] ? Number(parts[1]) : currentMinBoom;

  // Evaluate if the selected window falls completely outside the target window
  if (currentMaxBoom < targets.minBoom) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Mainsheet:</span> Your boom setting (${currentBoomStr}°) is too tight. 
        Ease your sail out toward the target window of <span class='tip-target-value'>${targets.minBoom}°–${targets.maxBoom}°</span>.
      </div>`;
    correctionsFound++;
  } else if (currentMinBoom > targets.maxBoom) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Mainsheet:</span> Your sail setting (${currentBoomStr}°) is spilling too much wind. 
        Pull your mainsheet in toward the target window of <span class='tip-target-value'>${targets.minBoom}°–${targets.maxBoom}°</span>.
      </div>`;
    correctionsFound++;
  }

  // --- 2. Standardized DAGGERBOARD DIAGNOSTIC ---
  if (ilca.daggerboard !== targets.daggerboard) {
    const humanLabels = { '2': 'Fully DOWN', '0': 'CENTERED', '-2': 'Fully UP' };
    const currentText = humanLabels[String(ilca.daggerboard)] || ilca.daggerboard;
    const targetText = humanLabels[String(targets.daggerboard)] || "Adjusted";
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Daggerboard:</span> Your board is currently ${currentText}. 
        Move your configuration to <span class='tip-target-value'>${targetText}</span> for this point of sail. This maximizes tracking stability and eliminates sideways leeway slippage.
      </div>`;
    correctionsFound++;
  }

  // --- 3. SAILOR POSITION DIAGNOSTIC ---
  const currentStance = (ilca.sailorPosition || "").trim();
  const targetStance = (targets.sailor || "").trim();

  if (currentStance !== targetStance) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Hiking Stance:</span> Your body positioning is incorrect ("${ilca.sailorPosition}"). 
        Move your sailor to <span class='tip-target-value'>"${targets.sailor}"</span> to establish the perfect weight distribution for these wind speeds.
      </div>`;
    correctionsFound++;
  }

  // --- 4. VANG FORCE DIAGNOSTIC ---
  if (targets.vang <= 0.25 && ilca.vang !== -2) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Vang Line:</span> This breeze demands a flattened sail blueprint. 
        Pull your Vang control to <span class='tip-target-value'>TIGHT</span>.
      </div>`;
    correctionsFound++;
  } else if (targets.vang >= 0.75 && ilca.vang !== 2) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Vang Line:</span> The wind is too soft for heavy boom tension. 
        Ease your Vang control to <span class='tip-value'>LOOSE</span>.
      </div>`;
    correctionsFound++;
  }

  // --- 5. DOWNHAUL DIAGNOSTIC ---
  if (targets.cunningham <= 0.25 && ilca.downhaul !== -2) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Downhaul:</span> Your luff tension is too soft for this breeze. 
        Pull your Downhaul control to <span class='tip-target-value'>MAX LUFF</span>.
      </div>`;
    correctionsFound++;
  } else if (targets.cunningham >= 0.75 && ilca.downhaul !== 2) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Downhaul:</span> High luff tension is strangling your sail outline in these conditions. 
        Ease your Downhaul control to <span class='tip-target-value'>OFF</span>.
      </div>`;
    correctionsFound++;
  }

  // --- 6. OUTHAUL DIAGNOSTIC ---
  if (targets.outhaul <= 0.25 && ilca.outhaul !== -2) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Outhaul:</span> Your lower sail outline is too full. 
        Pull your Outhaul control to <span class='tip-target-value'>FLAT</span>.
      </div>`;
    correctionsFound++;
  } else if (targets.outhaul >= 0.75 && ilca.outhaul !== 2) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Outhaul:</span> Your foot profile is too flat to collect light air volume. 
        Ease your Outhaul control to <span class='tip-target-value'>FULL</span>.
      </div>`;
    correctionsFound++;
  }

  // --- 7. TACTICAL STRATEGY COACHING PASS ---
  if ((sim.currentLeg === 0 || sim.currentLeg === 3) && ilca.pointOfSail !== "In Irons") {
    const windDir = Number(sim.windDirection) || 0;
    const bearingToMark = Number(sim.bearingToMark) || 0;
    const currentHeading = Number(ilca.heading) || 0;
    
    const markAngleToWind = Math.abs(((bearingToMark - windDir + 540) % 360) - 180);
    const boatAngleToWind = Math.abs(((currentHeading - windDir + 540) % 360) - 180);

    tipsHTML += `<div class='tip-item' style='border-left-color: #007bff; background: #f0f7ff;'>`;
    tipsHTML += `<span class='tip-control-name'>Tactical Strategy:</span> `;

    if (markAngleToWind < 42) {
      tipsHTML += `You have <strong>UNDERSHOT</strong> the layline! The buoy is inside your upwind No-Go Zone (${markAngleToWind.toFixed(0)}° off the wind). Build up momentum and tack later to clear it.`;
      correctionsFound++;
    } 
    else if (markAngleToWind > 55) {
      tipsHTML += `You have <strong>OVERSHOT</strong> the layline! The buoy is wide open at ${markAngleToWind.toFixed(0)}° off the wind. You are traveling extra distance. Bear away to point right down the track line.`;
      correctionsFound++;
    } 
    else {
      tipsHTML += `Nice routing! You are holding a good position <strong>ON THE LAYLINE TRACK</strong> (${markAngleToWind.toFixed(0)}° off the wind). `;
      
      if (boatAngleToWind > 50) {
        tipsHTML += `<br><span style='color: #28a745; font-weight: bold;'>💨 Wind Lift Active!</span> You are at a wide ${boatAngleToWind.toFixed(0)}° angle to the breeze. <span style='color: #007bff; font-weight: bold;'>HEAD UP</span> to point closer to the buoy instead of tacking!`;
        correctionsFound++;
      } 
      else if (boatAngleToWind < 42) {
        tipsHTML += `<br><span style='color: #dc3545; font-weight: bold;'>📉 Wind Header Warning!</span> You are getting knocked down by a shift. <span style='color: #dc3545; font-weight: bold;'>EXECUTE A TACK NOW</span> onto the opposite boards to escape it!`;
        correctionsFound++;
      } 
      else {
        tipsHTML += `<br>Your sailing angle to the wind (${boatAngleToWind.toFixed(0)}°) is perfect. Keep tracking clean air straight to the mark.`;
      }
    }
    tipsHTML += `</div>`; // Fixed typo here
  }

  // Final rendering injection
  tipsHTML += "</div>";
  container.innerHTML = correctionsFound === 0 
    ? "<div class='tip-item flawless-victory'>🏆 <strong>Perfect Trim!</strong> Your setup matches Olympic target speeds exactly. Drive hard!</div>" 
    : tipsHTML;
}
