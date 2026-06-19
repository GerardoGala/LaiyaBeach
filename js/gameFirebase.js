
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

        // Resolve and format time values for the display overlay
        const timeText = data.ILCA?.displayTimer || 
                        (typeof data.ILCA?.timer === 'number' ? data.ILCA.timer.toFixed(1) : "--");
        document.getElementById("raceTime").textContent = timeText;

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
                const finalTimeScore = data.ILCA?.timer || 0;

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

                    // Execution routing block based on evaluated ranking rules
                    if (makesTop10) {
                        alert(`Congratulations! Your time of ${timeText} qualified for the Top 10!`);
                        // Pass BOTH time and wind speed via the URL parameters
                        window.location.href = `enterName.html?time=${finalTimeScore}&wind=${data.windSpeed}`;
                    } else {
                        alert(`Great race! However, your time of ${timeText} did not break into the Top 10.`);
                        window.location.href = "leaderboard.html";
                    }

                } catch (error) {
                    console.error("Database Verification Loop Interrupted:", error);
                    window.location.href = "leaderboard.html";
                }
            });
        }
    };
