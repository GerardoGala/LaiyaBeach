//gameSetupAI.js
export function setupAiCoachTriggers() {
  const askBtn = document.getElementById("askAiButton");
  const modalWrapper = document.getElementById("aiCoachModalWrapper");
  const iframe = document.getElementById("aiCoachIframe");
  const closeBtn = document.getElementById("closeAiModalBtn");

  if (!askBtn || !modalWrapper || !iframe || !closeBtn) return;

  // Initialize flag safe profile
  window.globalSimulationData.askedAI = false;

  // 1. Proactively reveal the button (Invoke this when the simulation starts up!)
  askBtn.style.display = "block";

  // 2. Open Coach Iframe & Freeze State
  askBtn.addEventListener("click", () => {
    // HALT ENGINE TIME LOOP CALCULATIONS
    window.globalSimulationData.paused = true;

    // Direct the iframe target to source our standalone file asset
    // Appending a random timestamp ensures the file clears caching and calculates fresh every single click
    iframe.src = `askAI.html?t=${Date.now()}`;

    // Reveal UI overlay panel wrapper
    modalWrapper.style.display = "flex";
  });

  // 3. Close Iframe & Resume State
  closeBtn.addEventListener("click", () => {
    modalWrapper.style.display = "none";
    iframe.src = ""; // Unload the iframe contents cleanly

    // RESUME ENGINE TIME LOOP CALCULATIONS
    window.globalSimulationData.paused = false;
  });
}
