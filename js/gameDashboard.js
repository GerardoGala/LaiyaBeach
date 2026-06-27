  // Helper: set the active class on input buttons that match control/value.
  function setActiveInputButton(controlName, value) {
    if (value === null || value === undefined) value = '';
    const valueStr = String(value);
    // Find all buttons with data-control attribute equal to controlName
    const selector = '.control-button[data-control="' + controlName + '"]';
    const buttons = document.querySelectorAll(selector);

    // First clear active from all buttons in the same input section(s)
    buttons.forEach(btn => btn.classList.remove('active'));

    // Try to match data-value first
    let matched = false;
    buttons.forEach(btn => {
      const dataVal = btn.getAttribute('data-value');
      if (dataVal !== null && String(dataVal) === valueStr) {
        btn.classList.add('active');
        matched = true;
      }
    });

    // Fallback: try matching by button label text (for human strings like "Mid Center")
    if (!matched) {
      buttons.forEach(btn => {
        const txt = (btn.textContent || '').trim();
        if (txt && txt === valueStr) {
          btn.classList.add('active');
          matched = true;
        }
      });
    }

    // If still not matched, do nothing (no highlighted button)
  }

  // Helper: set dashboard label 'active' class for corresponding control
  function setDashboardActiveForControl(controlName) {
    // mapping control -> dashboard label id
    const map = {
      boom: 'boomControlLabel',
      sailorPosition: 'sailorPositionLabel',
      daggerboard: 'daggerboardLabel',
      vang: 'vangLabel',
      downhaul: 'downhaulLabel',
      outhaul: 'outhaulLabel',
      maneuver: 'ilcaLabel'
    };

    // remove active from all dashboard items
    document.querySelectorAll('.dashboard-item').forEach(el => el.classList.remove('active'));

    const labelId = map[controlName];
    if (labelId) {
      const el = document.getElementById(labelId);
      if (el) el.classList.add('active');
    }
  }

  // --- Update functions (replace the originals) ---

  function updateBoomControl(boomAngle) {
    showNotification('Boom Angle: ' + boomAngle);
    window.globalSimulationData.ILCA.boomAngle = boomAngle;

    // Update only the label, not the whole container
    const lbl = document.getElementById('boomControlLabel');
    if (lbl) lbl.textContent = 'BOOM ANGLE = ' + boomAngle;

    // Highlight the input button and dashboard item
    setActiveInputButton('boom', boomAngle);
    setDashboardActiveForControl('boom');
  }

  function updateSailorPosition(position) {
    showNotification('Sailor Position: ' + position);
    window.globalSimulationData.ILCA.sailorPosition = position;

    // Update only the label, not the whole container
    const lbl = document.getElementById('sailorPositionLabel');
    if (lbl) lbl.textContent = 'SAILOR POSITION = ' + position;

    // Highlight the input button and dashboard item
    setActiveInputButton('sailorPosition', position);
    setDashboardActiveForControl('sailorPosition');
  }

  function updateDaggerboardControl(daggerboard) {
    // Updated labels so 0 maps to "Center"
    const labels = {
      '-2': 'Down',
      '-1': 'Mid Down',
      '0':  'Center',
      '1':  'Mid Up',
      '2':  'Up'
    };
    const key = String(daggerboard);
    const label = labels[key] ?? 'Unknown';
    showNotification('Daggerboard: ' + label);
    window.globalSimulationData.ILCA.daggerboard = daggerboard;

    // Update only the label, not the whole container
    const lbl = document.getElementById('daggerboardLabel');
    if (lbl) lbl.textContent = 'DAGGERBOARD = ' + label;

    // Highlight the input button and dashboard item
    setActiveInputButton('daggerboard', daggerboard);
    setDashboardActiveForControl('daggerboard');
  }

  function updateVangControl(vang) {
    // Create a mapping object for your display text
    const labelMapping = {
        '2': 'LOOSE',
        '1': 'MID LOOSE',
        '0': 'CENTER',
        '-1': 'MID TIGHT',
        '-2': 'TIGHT'
    };

        // Safely get the text representation, default back to the number if not found
    const displayValue = labelMapping[vang] || vang;

    showNotification('Vang: ' + displayValue);
    window.globalSimulationData.ILCA.vang = vang;

    // Update only the label, not the whole container
    const lbl = document.getElementById('vangLabel');
    if (lbl) lbl.textContent = 'VANG = ' + displayValue;

    // Highlight the input button and dashboard item
    setActiveInputButton('vang', vang);
    setDashboardActiveForControl('vang');
  }

  function updateDownhaulControl(downhaul) {
    // Create a mapping object for your display text
    const labelMapping = {
        '2': 'OFF',
        '1': 'TWIST',
        '0': 'BASE',
        '-1': 'TRIM',
        '-2': 'MAX LUFF'
    };

    // Safely get the text representation, default back to the number if not found
    const displayValue = labelMapping[downhaul] || downhaul;


    showNotification('Downhaul: ' + displayValue);
    window.globalSimulationData.ILCA.downhaul = downhaul;

    // Update only the label, not the whole container
    const lbl = document.getElementById('downhaulLabel');
    if (lbl) lbl.textContent = 'DOWNHAUL = ' + displayValue;

    // Highlight the input button and dashboard item
    setActiveInputButton('downhaul', downhaul);
    setDashboardActiveForControl('downhaul');
  }

  function updateOuthaulControl(outhaul) {
        // Create a mapping object for your display text
    const labelMapping = {
        '2': 'FULL',
        '1': 'DEEP',
        '0': 'BASE',
        '-1': 'BLENDED',
        '-2': 'FLAT'
    };

    // Safely get the text representation, default back to the number if not found
    const displayValue = labelMapping[outhaul] || outhaul;

    showNotification('Outhaul: ' + displayValue);
    window.globalSimulationData.ILCA.outhaul = outhaul;

    // Update only the label, not the whole container
    const lbl = document.getElementById('outhaulLabel');
    if (lbl) lbl.textContent = 'OUTHAUL = ' + displayValue;

    // Highlight the input button and dashboard item
    setActiveInputButton('outhaul', outhaul);
    setDashboardActiveForControl('outhaul');
  }




document.addEventListener('DOMContentLoaded', function () {

  // Map dashboard label id -> input section id
  const dashboardToInput = {
    ilcaLabel: 'ilcaControl',
    boomControlLabel: 'boomControl',
    sailorPositionLabel: 'sailorPositionControl',
    daggerboardLabel: 'daggerboardControl',
    vangLabel: 'vangControl',
    downhaulLabel: 'downhaulControl',
    outhaulLabel: 'outhaulControl'
  };

  // Map input section -> property name in window.globalSimulationData.ILCA
  const inputToILCAprop = {
    ilcaControl: 'maneuver',
    boomControl: 'boomAngle',         // adjust if your code uses a different property name
    sailorPositionControl: 'sailorPosition',
    daggerboardControl: 'daggerboard',
    vangControl: 'vang',
    downhaulControl: 'downhaul',
    outhaulControl: 'outhaul'
  };

  // Highlight the button inside the input section that matches ILCA current value
  function highlightSelectionFromILCA(inputId) {
    if (!window.globalSimulationData || !window.globalSimulationData.ILCA) return;
    const ilca = window.globalSimulationData.ILCA;
    const prop = inputToILCAprop[inputId];
    if (!prop) return;

    const currentValue = ilca[prop];
    const currentStr = currentValue === null || currentValue === undefined ? '' : String(currentValue);

    const section = document.getElementById(inputId);
    if (!section) return;

    // find all buttons that belong to this control (data-control attr equal to prop name OR by section)
    // Prefer data-control attribute (recommended). Fallback: all .control-button in this section.
    const selectorByAttr = '.control-button[data-control="' + prop + '"]';
    let buttons = section.querySelectorAll(selectorByAttr);
    if (!buttons || buttons.length === 0) {
      buttons = section.querySelectorAll('.control-button');
    }

    // remove active from all
    buttons.forEach(b => b.classList.remove('active'));

    // Try to match data-value first
    let matched = false;
    buttons.forEach(b => {
      const dataVal = b.getAttribute('data-value');
      if (dataVal !== null && String(dataVal) === currentStr) {
        b.classList.add('active');
        matched = true;
      }
    });

    // Fallback: match by button text
    if (!matched) {
      buttons.forEach(b => {
        const txt = (b.textContent || '').trim();
        if (txt && txt === currentStr) {
          b.classList.add('active');
          matched = true;
        }
      });
    }

    // If still nothing matched and your daggerboard uses a different label mapping,
    // you could add custom mapping here (e.g., 0 -> "Center"). Example:
    if (!matched && inputId === 'daggerboardControl') {
      // map ILCA numeric values to button labels if needed
      const map = { '0': 'Center', '1': 'Mid Up', '-1': 'Mid Down', '2': 'Up', '-2': 'Down' };
      const mappedLabel = map[currentStr];
      if (mappedLabel) {
        buttons.forEach(b => {
          if ((b.textContent || '').trim() === mappedLabel) b.classList.add('active');
        });
      }
    }
  }

  // Open input section and highlight appropriate button
  function openInputAndHighlight(inputId, dashboardItem) {
    // mark dashboard item active
    document.querySelectorAll('.dashboard-item').forEach(el => el.classList.remove('active'));
    if (dashboardItem) dashboardItem.classList.add('active');

    // show only the chosen input section
    document.querySelectorAll('.input-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(inputId);
    if (!section) return;
    section.classList.add('active');

    // highlight from ILCA state
    highlightSelectionFromILCA(inputId);
  }

  // Wire dashboard clicks
  document.querySelectorAll('.dashboard-item').forEach(item => {
    item.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target') || dashboardToInput[this.id];
      if (!targetId) return;
      openInputAndHighlight(targetId, this);
    });
  });



});


document.addEventListener("DOMContentLoaded", () => {
  const dashboardItems = document.querySelectorAll(".dashboard-item");

  // 1. Set the default active state on page load
  const defaultLabel = document.getElementById("ilcaLabel");
  if (defaultLabel) {
    defaultLabel.classList.add("active");
  }

  // 2. Click handler to toggle active styles dynamically
  dashboardItems.forEach(item => {
    item.addEventListener("click", () => {
      // Remove 'active' class from whichever item currently holds it
      dashboardItems.forEach(el => el.classList.remove("active"));
      
      // Add 'active' class to the newly clicked dashboard label
      item.classList.add("active");

      // Optional: If your input pane partial is also on this page, 
      // this loop will automatically sync and show the matching input-section.
      const targetId = item.getAttribute("data-target");
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        document.querySelectorAll(".input-section").forEach(sec => {
          sec.classList.remove("active");
        });
        targetSection.classList.add("active");
      }
    });
  });
});

