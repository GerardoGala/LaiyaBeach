// wind.js
const API_KEY = "2ae1f247f2de797baacea07fe09b19b6"; // replace with your key
const LAT = 13.676;   // Laiya Beach latitude
const LON = 121.437;  // Laiya Beach longitude

export const wind = {
  init() {
    this.fetchWind();
    // refresh every 30 seconds
    setInterval(() => this.fetchWind(), 30000);
  },

  async fetchWind() {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url);
      const data = await res.json();

      const speed = data.wind.speed;       // m/s
      const deg = data.wind.deg;           // degrees from north

      this.updateDisplay(speed, deg);
    } catch (err) {
      console.error("Wind fetch failed:", err);
    }
  },

  updateDisplay(speed, deg) {
    const el = document.getElementById("wind-info");
    if (el) {
      // Get local time in Laiya Beach (Asia/Manila timezone)
      const now = new Date();
      const localTime = now.toLocaleTimeString("en-PH", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      el.textContent = `Wind: ${speed.toFixed(1)} m/s @ ${deg}° | Time: ${localTime}`;
    }
  }
};
