import { initUI, updateUI } from './ui.js';
import { initEngine, tick } from './engine.js';
import { saveState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initEngine();
    const interval = 200; // ms
    const delta = interval / 1000;
    setInterval(() => {
        tick(delta);
        updateUI();
        saveState();
    }, interval);
});
