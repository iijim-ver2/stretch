import { CONFIG } from './constants.js';
import { StretchTimer } from './StretchTimer.js';

document.addEventListener("DOMContentLoaded", () => {
  new StretchTimer(CONFIG);
});