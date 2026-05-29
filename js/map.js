// map.js
let windControlDiv; // keep reference so we can update later
let ilcaControlDiv; // keep reference so we can update later
let leaderboardBtnDiv;
let physicsBtnDiv;

export function initMap() {
  const laiya = [13.670464, 121.401286];
  const buoyLat = window.globalSimulationData.buoyLat;
  const buoyLng = window.globalSimulationData.buoyLon;

  const buoySVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="yellow" stroke="orange" stroke-width="4"/>
      <circle cx="24" cy="24" r="8" fill="orange" opacity="0.6"/>
    </svg>
  `;

  const buoyIcon = L.icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(buoySVG),
    iconSize: [20, 20],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });

  const map = L.map('map');

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker(laiya).addTo(map).bindPopup("ILCA Launch Point");
  L.marker([buoyLat, buoyLng], { icon: buoyIcon }).addTo(map).bindPopup("Race Buoy");

  // --- Wind Direction Indicator ---
  const WindControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      windControlDiv = L.DomUtil.create('div', 'wind-indicator-container');
      // styling...
      updateWindControl(map);
      return windControlDiv;
    }
  });
  map.addControl(new WindControl());

  // --- ILCA Status + Time Overlay ---
  const ILCAControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function() {
      ilcaControlDiv = L.DomUtil.create('div', 'ilca-status-container');
      // styling...
      updateILCAControl();
      return ilcaControlDiv;
    }
  });
  map.addControl(new ILCAControl());

  // --- Leaderboard Button ---
  const LeaderboardControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
      const btn = L.DomUtil.create('button', 'leaderboard-btn');
      btn.innerHTML = "🏆 Leaderboard";
      btn.style.cssText = `
        background:#007bff;color:white;border:none;
        padding:6px 10px;border-radius:4px;
        cursor:pointer;font-size:12px;
      `;
      btn.onclick = () => showDialogFromFile("Leaderboard", "partials/leaderboard.html");
      return btn;
    }
  });
  map.addControl(new LeaderboardControl());

  // --- Physics Button ---
  const PhysicsControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
      const btn = L.DomUtil.create('button', 'physics-btn');
      btn.innerHTML = "⚓ Physics of Sailing";
      btn.style.cssText = `
        background:#28a745;color:white;border:none;
        padding:6px 10px;border-radius:4px;
        cursor:pointer;font-size:12px;margin-top:5px;
      `;
      btn.onclick = () => showDialogFromFile("Physics of Sailing", "partials/physics.html");
      return btn;
    }
  });
  map.addControl(new PhysicsControl());

  const bounds = L.latLngBounds([laiya, [buoyLat, buoyLng]]);
  map.fitBounds(bounds, { padding: [50, 50] });

  return map;
}

// --- Define the modal loader function here ---
async function showDialogFromFile(title, filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error("Failed to load " + filePath);
    const content = await response.text();

    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.5);z-index:9998;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'popup-dialog';
    dialog.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      background:white;padding:20px;border-radius:8px;
      box-shadow:0 2px 10px rgba(0,0,0,0.5);
      max-width:400px;max-height:300px;overflow-y:auto;z-index:9999;
    `;
    dialog.innerHTML = `
      <h3>${title}</h3>
      ${content}
      <button style="margin-top:10px;">Close</button>
    `;

    dialog.querySelector('button').onclick = () => {
      dialog.remove();
      backdrop.remove();
    };

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
  } catch (err) {
    console.error(err);
    alert("Could not load dialog content.");
  }
}


// --- Refresh function to update wind arrow dynamically ---
export function updateWindControl(map) {
  if (!windControlDiv) return;

  const windDir = window.globalSimulationData.windDirection || 0;
  const windSpeed = Number(window.globalSimulationData.windSpeed)?.toFixed(1) || "0.0";


  windControlDiv.innerHTML = `
    <div style="margin-bottom: 4px;">WIND</div>
    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="22" fill="none" stroke="#ccc" stroke-width="2"/>
      <text x="25" y="10" font-size="8" text-anchor="middle" fill="#666">N</text>
      <g transform="rotate(${windDir}, 25, 25)">
        <line x1="25" y1="5" x2="25" y2="40" stroke="blue" stroke-width="3" stroke-linecap="round"/>
        <polygon points="25,45 20,35 30,35" fill="blue" />
      </g>
    </svg>
    <div style="margin-top: 4px; color: blue;">
      ${windDir}° at ${windSpeed} kn
    </div>
  `;
}

// --- Refresh function to update ILCA status + time ---
export function updateILCAControl() {
  if (!ilcaControlDiv) return;

  const ilca = window.globalSimulationData.ILCA || {};
  const speed = ilca.speed?.toFixed(1) || 0;
  const heading = ilca.heading?.toFixed(0) || 0;
  const timer = ilca.displayTimer || "0:00";
  const laiyaTime = ilca.localTime || "--:--:--";

  ilcaControlDiv.innerHTML = `
    <div><strong>ILCA Status</strong></div>
    <div>Speed: ${speed} kn</div>
    <div>Heading: ${heading}°</div>
    <div>Timer: ${timer}</div>
    <div style="margin-top:4px;"><strong>Laiya Time:</strong> ${laiyaTime}</div>
  `;
}
