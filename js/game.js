// game.js
function closeFinishDialog() {
document.getElementById("nearRC").style.display = "none";
}

async function loadPartial(id, file) {
const res = await fetch(file);
const html = await res.text();
document.getElementById(id).innerHTML = html;

// Attach click handlers once dashboard is loaded
if (id === "dashboard-container") {
    document.querySelectorAll(".dashboard-item").forEach(item => {
    item.addEventListener("click", function() {
        const targetId = this.getAttribute("data-target");

        // Hide all input sections
        document.querySelectorAll(".input-section").forEach(div => {
        div.classList.remove("active");
        });

        // Show the one that matches
        const targetDiv = document.getElementById(targetId);
        if (targetDiv) {
        targetDiv.classList.add("active");
        }
    });
    });
}
}

// Load both partials
loadPartial("dashboard-container", "partials/dashboard.html");
loadPartial("input-container", "partials/input.html");

// Map start simulation button logic
const mapStartSimulationBtn = document.getElementById('mapStartSimulationBtn');
if (mapStartSimulationBtn) {
    mapStartSimulationBtn.addEventListener('click', () => {
    launchSimulation();
    mapStartSimulationBtn.style.display = 'none';
    // Show the feedback notification
    showNotification("You are in Irons! Do something to start moving.");
    });
}
