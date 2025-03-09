import { saveGameData, save } from "./index.js";

var autosaveTimer

export function setAutosave() {
    autosaveTimer = setInterval(() => {
        saveGameData(true);
    }, save.settings.autoSaveInterval);
}

export function stopAutosave() {
    clearInterval(autosaveTimer)
}