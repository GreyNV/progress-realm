import { initUI, updateUI } from './ui.js';
import { initEngine, tick } from './engine.js';
import { saveState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initEngine();
    setInterval(() => {
        tick();
        updateUI();
        saveState();
    }, 1000);
});
