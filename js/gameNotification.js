 
    function showNotification(message) {
      const container = document.getElementById('notification-container');
      const note = document.createElement('div');
      note.className = 'notification';
      note.textContent = message;
      container.appendChild(note);

      setTimeout(() => note.remove(), 10000);
    }
