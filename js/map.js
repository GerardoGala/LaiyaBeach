// map.js
let windControlDiv; // keep reference so we can update later
let ilcaControlDiv; // keep reference so we can update later
let vmgControlDiv; // keep reference so we can update later

export function initMap() {
  const rcLat = window.globalSimulationData.rcLat;
  const rcLon = window.globalSimulationData.rcLon;
  const buoyLat = window.globalSimulationData.buoyLat;
  const buoyLon = window.globalSimulationData.buoyLon;

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

  // Initialize the Leaflet map, centered on Laiya Beach with zoom ~16
  // Zoom 16 usually shows ~300m scale bar (depending on screen size and latitude)
  //const map = L.map('map').setView([13.670464, 121.401286], 16);

  const map = L.map('map', {
  center: [rcLat, rcLon], // your buoy coords
  zoom: 16,
  dragging: false,        // disables drag
  zoomControl: false,     // optional: removes zoom buttons
  scrollWheelZoom: false, // optional: disables mouse wheel zoom
  doubleClickZoom: false, // optional: disables double-click zoom
  touchZoom: false        // optional: disables pinch zoom
});


// Add marker for ILCA launch point
L.marker([rcLat, rcLon]).addTo(map).bindPopup("RC");

// Add buoy marker with custom SVG icon
L.marker([buoyLat, buoyLon], { icon: buoyIcon })
  .addTo(map)
  .bindPopup("Race Buoy");

// Add scale control to show distances on the map
L.control.scale({
  position: 'bottomleft', // place scale bar at bottom-left
  imperial: false,        // disable yards/miles
  metric: true            // enable meters/kilometers
}).addTo(map);

// --- Combined Right-Side Controls ---
const RightControls = L.Control.extend({
  options: { position: 'topright' },
  onAdd: function(map) {
    const container = L.DomUtil.create('div', 'right-controls-container');

    // Wind Indicator
    windControlDiv = L.DomUtil.create('div', 'wind-indicator-container', container);
    windControlDiv.style.background = 'white';
    windControlDiv.style.padding = '8px';
    windControlDiv.style.borderRadius = '5px';
    windControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    windControlDiv.style.textAlign = 'center';
    windControlDiv.style.fontFamily = 'sans-serif';
    windControlDiv.style.fontSize = '12px';
    windControlDiv.style.fontWeight = 'bold';
    windControlDiv.style.color = '#222';
    updateWindControl(map);

    // --- ILCA Status + Time ---
    ilcaControlDiv = L.DomUtil.create('div', 'ilca-status-container', container);
    ilcaControlDiv.style.background = 'white';
    ilcaControlDiv.style.padding = '8px';
    ilcaControlDiv.style.borderRadius = '5px';
    ilcaControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    ilcaControlDiv.style.textAlign = 'center';
    ilcaControlDiv.style.fontFamily = 'sans-serif';
    ilcaControlDiv.style.fontSize = '12px';
    ilcaControlDiv.style.lineHeight = '1.4em';
    ilcaControlDiv.style.color = '#222';
    ilcaControlDiv.style.fontWeight = 'bold'; 
    updateILCAControl();

        // --- VMG Status ---
    vmgControlDiv = L.DomUtil.create('div', 'vmg-status-container', container);
    vmgControlDiv.style.background = 'white';
    vmgControlDiv.style.padding = '8px';
    vmgControlDiv.style.borderRadius = '5px';
    vmgControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    vmgControlDiv.style.textAlign = 'center';
    vmgControlDiv.style.fontFamily = 'sans-serif';
    vmgControlDiv.style.fontSize = '12px';
    vmgControlDiv.style.lineHeight = '1.4em';
    vmgControlDiv.style.color = '#222';
    vmgControlDiv.style.fontWeight = 'bold'; 
    updateVMGControl();
    return container;
  }
});
map.addControl(new RightControls());

 
  // --- Leaderboard Button ---
  const LeaderboardControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function() {
      const btn = L.DomUtil.create('button', 'leaderboard-btn');
      btn.innerHTML = "🏆 Leaderboard";
      btn.style.cssText = `
        background:#007bff;color:white;border:none;
        padding:6px 10px;border-radius:4px;
        cursor:pointer;font-size:12px;
      `;
      btn.onclick = () => showDialogFromFile("Leaderboard", "partials/leaderBoard.html");
      return btn;
    }
  });
  map.addControl(new LeaderboardControl());

  // --- Physics Button ---
  const PhysicsControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function() {
      const btn = L.DomUtil.create('button', 'physics-btn');
      btn.innerHTML = "⚓ Physics of ILCA Sailing";
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

    // --- Local wind Button ---
  const LocalWindControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function() {
      const btn = L.DomUtil.create('button', 'localWind-btn');
      btn.innerHTML = "🌬️ Local Wind";
      btn.style.cssText = `
        background:#17a2b8;color:white;border:none;
        padding:6px 10px;border-radius:4px;
        cursor:pointer;font-size:12px;margin-top:5px;
      `;
      btn.onclick = () => showDialogFromFile("Local wind", "partials/localWind.html");
      return btn;
    }
  });
  map.addControl(new LocalWindControl());

// Define bounds using RC (launch point) and buoy
const bounds = L.latLngBounds([[rcLat, rcLon], [buoyLat, buoyLon]]);
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
      width:80vw;height:80vh;z-index:9999;
      overflow-y:auto; /* only here */
    `;


  dialog.innerHTML = `
    ${content}
    <button style="margin-top:10px;position: absolute; top: 10px; right: 10px;">Close</button>`;

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
      <g transform="rotate(${windDir + 180}, 25, 25)">
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
  if (window.globalSimulationData.raceFinished) return; // stop updating once finished

  const ilca = window.globalSimulationData.ILCA || {};
  const speedKnots = ilca.speed?.toFixed(1) || 0;
  const speedMS = (ilca.speed ? (ilca.speed * 0.514).toFixed(2) : "0.00");
  const heading = ilca.heading?.toFixed(0) || 0;
  const pointOfSail = ilca.pointOfSail;
  const timer = ilca.displayTimer || "0:00";
 
  // --- ILCA Control Renderer ---
  ilcaControlDiv.innerHTML = `
    <div><strong>ILCA Status</strong></div>
    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" style="margin:4px 0;">
      <circle cx="25" cy="25" r="22" fill="none" stroke="#ccc" stroke-width="2"/>
      <text x="25" y="10" font-size="8" text-anchor="middle" fill="#666">N</text>
      <g transform="rotate(${Number(heading) + 180}, 25, 25)">
        <line x1="25" y1="5" x2="25" y2="40" stroke="red" stroke-width="3" stroke-linecap="round"/>
        <polygon points="25,45 20,35 30,35" fill="red" />
      </g>
    </svg>
    <div>Heading: ${heading}°</div>
    <div>Point of Sail: ${pointOfSail}</div>
    <div>Speed: ${speedKnots} knots (${speedMS} m/s)</div>
    <div>Timer: ${timer}</div>
  `;
}


// --- Refresh function to update VMG ruler dynamically ---
export function updateVMGControl() {
  if (!vmgControlDiv) return;

  const ilca = window.globalSimulationData.ILCA || {};
  const buoyRounded = window.globalSimulationData.buoyRounded || 0;

  // --- Destination for VMG ---
  // VMG should point to buoy until rounded, then switch to RC.
  const destLat = buoyRounded === 0 
    ? window.globalSimulationData.buoyLat 
    : window.globalSimulationData.rcLat;
  const destLon = buoyRounded === 0 
    ? window.globalSimulationData.buoyLon 
    : window.globalSimulationData.rcLon;

  // --- Boat state ---
  const boatLat = ilca.lat || 0;
  const boatLon = ilca.lon || 0;
  const heading = ilca.heading || 0;
  const speedKnots = ilca.speed?.toFixed(1) || 0;   // for display
  const speedMS = ilca.speed ? (ilca.speed * 0.514) : 0; // knots → m/s

  // --- Bearing to destination (for VMG) ---
  const dLon = (destLon - boatLon) * Math.PI / 180;
  const lat1 = boatLat * Math.PI / 180;
  const lat2 = destLat * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let bearingDest = Math.atan2(y, x) * 180 / Math.PI;
  if (bearingDest < 0) bearingDest += 360;

  // --- VMG calculation ---
  // VMG = boat speed projected onto bearing to destination
  const angleDiff = (heading - bearingDest) * Math.PI / 180;
  const vmg = speedMS * Math.cos(angleDiff);

  // --- Distance to Buoy (always use buoyLat/buoyLon) ---
  const buoyLat = window.globalSimulationData.buoyLat;
  const buoyLon = window.globalSimulationData.buoyLon;
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(boatLat * Math.PI / 180);
  const deltaLatBuoy = (buoyLat - boatLat) * metersPerDegLat;
  const deltaLonBuoy = (buoyLon - boatLon) * metersPerDegLon;
  const distanceToBuoy = Math.sqrt(deltaLatBuoy**2 + deltaLonBuoy**2);

  // --- Bearing to Buoy (always use buoyLat/buoyLon) ---
  const dLonBuoy = (buoyLon - boatLon) * Math.PI / 180;
  const latBuoy = buoyLat * Math.PI / 180;
  const yBuoy = Math.sin(dLonBuoy) * Math.cos(latBuoy);
  const xBuoy = Math.cos(lat1) * Math.sin(latBuoy) -
                Math.sin(lat1) * Math.cos(latBuoy) * Math.cos(dLonBuoy);
  let bearingBuoy = Math.atan2(yBuoy, xBuoy) * 180 / Math.PI;
  if (bearingBuoy < 0) bearingBuoy += 360;

  // --- Distance to RC (always use rcLat/rcLon) ---
  const rcLat = window.globalSimulationData.rcLat;
  const rcLon = window.globalSimulationData.rcLon;
  const deltaLatRC = (rcLat - boatLat) * metersPerDegLat;
  const deltaLonRC = (rcLon - boatLon) * metersPerDegLon;
  const distanceToRC = Math.sqrt(deltaLatRC**2 + deltaLonRC**2);

  // --- Bearing to RC (always use rcLat/rcLon) ---
  const dLonRC = (rcLon - boatLon) * Math.PI / 180;
  const latRC = rcLat * Math.PI / 180;
  const yRC = Math.sin(dLonRC) * Math.cos(latRC);
  const xRC = Math.cos(lat1) * Math.sin(latRC) -
              Math.sin(lat1) * Math.cos(latRC) * Math.cos(dLonRC);
  let bearingRC = Math.atan2(yRC, xRC) * 180 / Math.PI;
  if (bearingRC < 0) bearingRC += 360;

window.globalSimulationData.distanceToBuoy = distanceToBuoy;
window.globalSimulationData.distanceToRC = distanceToRC;
window.globalSimulationData.vmg = vmg;
  // --- Display panel ---
  vmgControlDiv.innerHTML = `
    <div>VMG</div>
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="10" viewBox="0 0 80 10"></svg>
    <div style="color: blue;">
      ${vmg.toFixed(2)} m/s
    </div>
    <hr/>
    <div style="color: green;">Distance to Buoy: ${distanceToBuoy.toFixed(0)} m</div>
    <div style="color: green;">Bearing to Buoy: ${bearingBuoy.toFixed(0)}°</div>
    <div style="color: red;">Distance to RC: ${distanceToRC.toFixed(0)} m</div>
    <div style="color: red;">Bearing to RC: ${bearingRC.toFixed(0)}°</div>
  `;
}




