import { CONFIG } from "./config/config.js";
import { StretchTimer } from "./core/StretchTimer.js";

document.addEventListener("DOMContentLoaded", () => {
  new StretchTimer(CONFIG);
});
