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
                // Query your cloud Firestore leaderboard targets (Ascending Sequence)
                const leaderboardRef = collection(db, "leaderboard");
                const q = query(leaderboardRef, orderBy("finalTime", "asc"), limit(10));
                const querySnapshot = await getDocs(q);
                
                let makesTop10 = false;

                // Condition A: If database is wiped or clear (0 to 9 slots filled), qualify instantly!
                if (querySnapshot.size < 10) {
                    makesTop10 = true;
                } else {
                    // Condition B: Compare run duration scores against the 10th slot cutoff anchor
                    const docs = querySnapshot.docs;
                    const tenthPlaceDoc = docs[docs.length - 1].data();
                    const tenthPlaceTime = Number(tenthPlaceDoc.finalTime);

                    if (finalTimeScore < tenthPlaceTime) {
                        makesTop10 = true;
                    }
                }

// --- CALCULATE LEADERBOARD ELIGIBILITY ---

// 1. Fetch current scores from Firebase or localStorage to check the cutoff time
// (Assuming local storage list here, swap with your Firebase array if pulling live)
const savedScoresRaw = localStorage.getItem('leaderboardScores') || "[]";
const leaderboardArray = JSON.parse(savedScoresRaw);

makesTop10 = false;

// 2. STAGE ONE: Check if they used the Ask AI coaching tool
if (data.askedAI === true) {
    // Disqualified! Do not let them on the board if they used the AI coach
    makesTop10 = false; 
} else {
    // STAGE TWO: If they didn't use AI, check if their time qualifies
    if (leaderboardArray.length < 10) {
        // If the leaderboard isn't full yet, any time qualifies!
        makesTop10 = true;
    } else {
        // Sort from fastest to slowest
        leaderboardArray.sort((a, b) => Number(a.time) - Number(b.time));
        const cutoffTime = Number(leaderboardArray[leaderboardArray.length - 1].time);
        
        // True if their time is strictly faster than the 10th place time
        if (Number(finalTimeScore) < cutoffTime) {
            makesTop10 = true;
        }
    }
}

// New Execution routing block: Pass the results to finish.html first!
const windSpeedValue = Number(data.windSpeed) || 0;
window.location.href = `finish.html?time=${finalTimeScore}&wind=${windSpeedValue}&top10=${makesTop10}`;

 

            } catch (error) {
                console.error("Database Verification Loop Interrupted:", error);
                window.location.href = "leaderboard.html";
            }
        });
    }
};
