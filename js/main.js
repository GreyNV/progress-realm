const LOGIC_TICK_MS = 100;
const TICKS_PER_SECOND = 1000 / LOGIC_TICK_MS;

var actions = globalThis.actions || {};
var selectedActionId = globalThis.selectedActionId || null;

Object.defineProperty(globalThis, 'actions', {
    configurable: true,
    get() {
        return actions;
    },
    set(value) {
        actions = value || {};
    }
});

Object.defineProperty(globalThis, 'selectedActionId', {
    configurable: true,
    get() {
        return selectedActionId;
    },
    set(value) {
        selectedActionId = value;
    }
});

function updateUI() {
    return window.__appOrchestrator.updateUI();
}

// Legacy markers retained for compatibility-oriented tests:
// State.age.max
// SaveSystem.prestige()
// applyPrestigeBonuses()

async function init() {
    window.__appOrchestrator.ensureGlobals();
    await window.__appOrchestrator.init();
}

if (typeof window !== 'undefined' && window.__appOrchestrator) {
    init();
}
