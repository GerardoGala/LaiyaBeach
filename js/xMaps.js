// --- Add these variables at the top with your other control references ---
let leaderboardBtnDiv;
let physicsBtnDiv;

// Inside initMap(), after adding your existing controls, add:
const LeaderboardControl = L.Control.extend({
  options: { position: 'topleft' },
  onAdd: function() {
    leaderboardBtnDiv = L.DomUtil.create('button', 'leaderboard-btn');
    leaderboardBtnDiv.innerHTML = "🏆 Leaderboard";
    leaderboardBtnDiv.style.cssText = `
      background:#007bff;color:white;border:none;
      padding:6px 10px;border-radius:4px;
      cursor:pointer;font-size:12px;
    `;
    leaderboardBtnDiv.onclick = () =>
      showDialog("Leaderboard", "<p>Here goes leaderboard content...</p>");
    return leaderboardBtnDiv;
  }
});
map.addControl(new LeaderboardControl());

const PhysicsControl = L.Control.extend({
  options: { position: 'topleft' },
  onAdd: function() {
    physicsBtnDiv = L.DomUtil.create('button', 'physics-btn');
    physicsBtnDiv.innerHTML = "⚓ Physics of Sailing";
    physicsBtnDiv.style.cssText = `
      background:#28a745;color:white;border:none;
      padding:6px 10px;border-radius:4px;
      cursor:pointer;font-size:12px;margin-top:5px;
    `;
    physicsBtnDiv.onclick = () =>
      showDialog("Physics of Sailing", "<p>Explain sailing physics here...</p>");
    return physicsBtnDiv;
  }
});
map.addControl(new PhysicsControl());

// --- Add this helper function at the bottom of map.js ---
function showDialog(title, content) {
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
    <div>${content}</div>
    <button style="margin-top:10px;">Close</button>
  `;
  dialog.querySelector('button').onclick = () => dialog.remove();
  document.body.appendChild(dialog);
}
