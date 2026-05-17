import { initMap } from './map.js';
import { initBoatLoop } from './boat.js';
import { initWind } from './wind.js';
import { updateILCA } from './ilca.js';

let config;
let map;

async function loadConfig() {
  const response = await fetch('config.json');
  config = await response.json();

  // Initialize map
  map = initMap(config);

  // Start ILCA boat loop
  initBoatLoop(map, config);

  // Initial ILCA display (heading east at 20 knots for example)
  updateILCA(180, 20);

  // Start wind API loop
  initWind(config);
}

loadConfig();
