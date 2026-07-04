// js/askAiEvaluateSnapshot.js
// 1. ADDED: Your explicit Firebase configuration credentials
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, addDoc, writeBatch} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyC_ayepAzJV_vfV5Qh8m52tGnn1Iw7CRnY",
authDomain: "laser-sailing-simulator.firebaseapp.com",
projectId: "laser-sailing-simulator",
storageBucket: "laser-sailing-simulator.firebasestorage.app",
messagingSenderId: "45397375888",
appId: "1:145397375888:web:1ca8d7688170787624d115"
};

// 2. ADDED: Live connection initialization sequence so 'db' exists
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. EXPORT OR BIND TO WINDOW: Since this is a module, expose it globally 
// so your other game files can trigger it when leg 5 completes.
window.showFinishDialog = function showFinishDialog() {
    const data = window.globalSimulationData;

    // Resolve and extract the raw integer seconds value for pure numeric output
    const finalTimeScore = data.ILCA?.timer || 0;
    
    // Display raw seconds directly in the on-screen popup modal layout
    document.getElementById("raceTime").textContent = finalTimeScore;

    // Safely cast and render active wind speed telemetry metrics
    const windSpeedNum = Number(data.windSpeed);
    document.getElementById("windSpeed").textContent = !isNaN(windSpeedNum) ? windSpeedNum.toFixed(1) : "--";

    // Force stop race engine clock loops instantly
    window.globalSimulationData.raceFinished = true;
    if (data.ILCA?._timerInterval) {
        clearInterval(data.ILCA._timerInterval);
    }

    // Reveal the finish modal popup container overlay
    document.getElementById("nearRC").style.display = "block";

    // Target the Close button inside your HTML structural layout
    const finishActionBtn = document.querySelector("#nearRC button");
    
    if (finishActionBtn) {
        // Completely strip any conflicting hardcoded inline onclick text triggers
        finishActionBtn.removeAttribute("onclick");

        // Clone the button object to wipe clean any duplicate event stack flags 
        const newBtn = finishActionBtn.cloneNode(true);
        finishActionBtn.parentNode.replaceChild(newBtn, finishActionBtn);

        // BIND THE CLICK EVENT VIA SECURE ADDEVENTLISTENER INSTANCE
        newBtn.addEventListener("click", async () => {
            // Quick fallback routing parameter configuration
            if (finalTimeScore <= 0) {
                window.location.href = "leaderboard.html";
                return;
            }

            // Visually indicate database communications status
            newBtn.disabled = true;
            newBtn.textContent = "Checking Leaderboard...";

            try {
                let makesTop10 = false;

                // STAGE ONE: Check if they used the Ask AI coaching tool first
                if (data.askedAI === true) {
                    makesTop10 = false; // Disqualified instantly from leaderboard submission
                } else {
                    // STAGE TWO: Query your cloud Firestore leaderboard targets (Ascending Sequence)
                    const leaderboardRef = collection(db, "leaderboard");
                    const q = query(leaderboardRef, orderBy("finalTime", "asc"), limit(10));
                    const querySnapshot = await getDocs(q);

                    // Condition A: If database has empty slots (0 to 9 scores total), qualify instantly!
                    if (querySnapshot.size < 10) {
                        makesTop10 = true;
                    } else {
                        // Condition B: Compare run duration scores against the 10th slot cutoff anchor (.finalTime)
                        const docs = querySnapshot.docs;
                        const tenthPlaceDoc = docs[docs.length - 1].data();
                        const tenthPlaceTime = Number(tenthPlaceDoc.finalTime);

                        if (Number(finalTimeScore) < tenthPlaceTime) {
                            makesTop10 = true;
                        }
                    }
                }

                // New Execution routing block: Pass the correct results to finish.html
                const windSpeedValue = Number(data.windSpeed) || 0;
                window.location.href = `finish.html?time=${finalTimeScore}&wind=${windSpeedValue}&top10=${makesTop10}`;

            } catch (error) {
                console.error("Database Verification Loop Interrupted:", error);
                window.location.href = "leaderboard.html";
            }
        });
    }
};

