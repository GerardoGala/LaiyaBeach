 
    function showNotification(message) {
      const container = document.getElementById('notification-container');
      const note = document.createElement('div');
      note.className = 'notification';
      note.textContent = message;
      container.appendChild(note);

  // Shortened from 10000 to 3000 (3 seconds)
  setTimeout(() => note.remove(), 3000);
}

