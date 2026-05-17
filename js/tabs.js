import { launchSimulation } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  // Open dialogs
  document.querySelectorAll('.open-dialog').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      document.getElementById(target).style.display = 'block';
    });
  });

  // Close dialogs
  document.querySelectorAll('.close-dialog').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      document.getElementById(target).style.display = 'none';
    });
  });

  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');

      document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
      button.classList.add('active');

      if (tabId === 'launch') {
        launchSimulation();
        document.getElementById('map').style.display = 'block';
      } else {
        document.getElementById('map').style.display = 'none';
      }
    });
  });

  // Standing Rig Launch button
  const launchBtn = document.getElementById('launchBtn');
  if (launchBtn) {
    launchBtn.addEventListener('click', () => {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.getElementById('launch').classList.add('active');

      document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
      document.querySelector('.tab-button[data-tab="launch"]').classList.add('active');

      launchSimulation();
      document.getElementById('map').style.display = 'block';
    });
  }

  // Map overlay Launch button
  const mapLaunchBtn = document.getElementById('mapLaunchBtn');
  if (mapLaunchBtn) {
    mapLaunchBtn.addEventListener('click', () => {
      launchSimulation();
      mapLaunchBtn.style.display = 'none';
      document.getElementById('map').style.display = 'block';
    });
  }
});
