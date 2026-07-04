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

  // --- CATASTROPHIC & CRITICAL STATUS CHECKS ---
  
  // Handle Capsize
  if (ilca.capsized) {
    container.innerHTML = "<div class='tip-item critical-error'>❌ <strong>You are capsized!</strong> Right the boat before trimming your lines.</div>";
    return;
  }

  // Handle In Irons (Pointing straight into the wind)
  if (ilca.pointOfSail === "In Irons" || Number(sim.speed) === 0 && ilca.pointOfSail === "Close Hauled" && Math.abs(((Number(ilca.heading) - Number(sim.windDirection) + 540) % 360) - 180) < 10) {
    container.innerHTML = `
      <div class='tips-list'>
        <div class='tip-item critical-error' style='border-left-color: #dc3545; background: #fff5f5;'>
          ⛵ <strong>You are In Irons!</strong> You are pointing directly into the wind with zero speed. 
          <br><br>
          <strong>How to fix it:</strong> Either bear away or tack.
        </div>
      </div>`;
    return;
  }


  // Identify general point of sail lookup groupings
  let lookupHeading = ilca.pointOfSail || "Close Hauled";
  const posText = lookupHeading.toLowerCase(); // Visual anchor for sentence flow
  if (lookupHeading.includes("Reach")) lookupHeading = "Reaching";

  // Pull strategy configuration targets from database metrics file
  const windTier = getWindTier(Number(sim.windSpeed) || 0);
  const targets = SCENARIO_TARGETS[lookupHeading][windTier];

  let tipsHTML = "<div class='tips-list'>";
  let correctionsFound = 0;

  // --- 1. MAIN SHEET (BOOM ANGLE) DIAGNOSTIC ---
  const currentBoomStr = String(ilca.boomAngle || "0-0");
  const parts = currentBoomStr.split('-');
  const currentMinBoom = Number(parts[0]) || 0;
  const currentMaxBoom = parts[1] ? Number(parts[1]) : currentMinBoom;

  if (currentMaxBoom < targets.minBoom) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Mainsheet:</span> The Mainsheet setting is ${currentBoomStr}° while sailing ${posText}. 
        I suggest changing to <span class='tip-target-value'>${targets.minBoom}°–${targets.maxBoom}°</span> by easing your sail out.
      </div>`;
    correctionsFound++;
  } else if (currentMinBoom > targets.maxBoom) {
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Mainsheet:</span> The Mainsheet setting is ${currentBoomStr}° while sailing ${posText}. 
        I suggest changing to <span class='tip-target-value'>${targets.minBoom}°–${targets.maxBoom}°</span> by pulling your mainsheet in.
      </div>`;
    correctionsFound++;
  }

  // --- 2. DAGGERBOARD DIAGNOSTIC ---
  if (ilca.daggerboard !== targets.daggerboard) {
    const currentText = String(ilca.daggerboard).toUpperCase();
    const targetText = String(targets.daggerboard).toUpperCase();
    
    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Daggerboard:</span> The Daggerboard is ${currentText} while sailing ${posText}. 
        I suggest changing to <span class='tip-target-value'>${targetText}</span>.
      </div>`;
    correctionsFound++;
  }

  // --- 3. SAILOR POSITION DIAGNOSTIC ---
  const currentStance = (ilca.sailorPosition || "").trim();
  const targetStance = (targets.sailor || "").trim();

  if (currentStance !== targetStance) {
    const currentText = currentStance.toUpperCase() || "UNKNOWN";
    const targetText = targetStance.toUpperCase();

    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Hiking Stance:</span> The Hiking Stance is ${currentText} while sailing ${posText}. 
        I suggest changing to <span class='tip-target-value'>${targetText}</span>.
      </div>`;
    correctionsFound++;
  }

  // --- 4. VANG FORCE DIAGNOSTIC ---
  if (ilca.vang !== targets.vang) {
    const currentText = String(ilca.vang).toUpperCase();
    const targetText = String(targets.vang).toUpperCase();

    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Vang Line:</span> The Vang Line is ${currentText} while sailing ${posText}. 
        I suggest changing to <span class='tip-target-value'>${targetText}</span>.
      </div>`;
    correctionsFound++;
  }

  // --- 5. DOWNHAUL DIAGNOSTIC ---
  if (ilca.downhaul !== targets.downhaul) {
    const currentText = String(ilca.downhaul).toUpperCase();
    const targetText = String(targets.downhaul).toUpperCase();

    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Downhaul:</span> The Downhaul is ${currentText} while sailing ${posText}. 
        I suggest changing to <span class='tip-target-value'>${targetText}</span>.
      </div>`;
    correctionsFound++;
  }

  // --- 6. OUTHAUL DIAGNOSTIC ---
  if (ilca.outhaul !== targets.outhaul) {
    const currentText = String(ilca.outhaul).toUpperCase();
    const targetText = String(targets.outhaul).toUpperCase();

    tipsHTML += `
      <div class='tip-item'>
        <span class='tip-control-name'>Outhaul:</span> The Outhaul is ${currentText} while sailing ${posText}. 
        I suggest changing to <span class='tip-target-value'>${targetText}</span>.
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
        tipsHTML += `<br><span style='color: #28a745; font-weight: bold;'>💨 Wind Lift Active!</span> You are at a wide ${boatAngleToWind.toFixed(0)}° angle to the breeze. <span style='color: #007bff; font-weight: bold;'>HEAD UP</span> to ride the lift straight toward the buoy!`;
        correctionsFound++;
      } 
      else if (boatAngleToWind < 42) {
        tipsHTML += `<br><span style='color: #dc3545; font-weight: bold;'>📉 Wind Header Warning!</span> You are getting knocked down by a shift. <span style='color: #dc3545; font-weight: bold;'>TACK IMMEDIATELY</span> to find a lift on the opposite side!`;
        correctionsFound++;
      }
    }
    tipsHTML += `</div>`;
  }

  tipsHTML += "</div>";

  // If no adjustments are needed, print out a success card banner
  if (correctionsFound === 0) {
    container.innerHTML = `
      <div class='tip-item success-banner' style='border-left-color: #28a745; background: #eafaf1;'>
        🏆 <strong>Perfect Sail Trim!</strong> All controls are tracking 100% on target for this point of sail and wind condition. Keep your speed vector locked!
      </div>`;
    return;
  }

  container.innerHTML = tipsHTML;
}
