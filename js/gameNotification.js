// gameNotification.js



    function showNotification(message) {
      const container = document.getElementById('notification-container');
      const note = document.createElement('div');
      note.className = 'notification';
      note.textContent = message;
      container.appendChild(note);


  setTimeout(() => note.remove(), 10000);
}
/**
 * Bottom-Right Notification for UI Button Clicks
 * Stays at the bottom-right of the page
 */
function buttonClickNotification(message) {
  const container = document.getElementById('notification-container-bottom');
  const note = document.createElement('div');
  note.className = 'notification button-click-note';
  note.textContent = message;
  container.appendChild(note);

  // Shortened from 10000 to 3000 (3 seconds)
  setTimeout(() => note.remove(), 3000);
}

/**
 * Top-Right Notification for Race Course Track Events
 * Displays at the top-right, does not scroll down, and auto-disappears after 4 seconds
 */
function eventNotification(message) {
  const container = document.getElementById('notification-container-top');
  const note = document.createElement('div');
  note.className = 'notification event-note';
  note.textContent = message;
  container.appendChild(note);

  
  setTimeout(() => note.remove(), 5000);
}

// Bind both new functions to the global window scope so your other game files can find them
window.buttonClickNotification = buttonClickNotification;
window.eventNotification = eventNotification;



