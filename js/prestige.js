// Compatibility shim. The browser runtime installs `applyPrestigeBonuses` from `src/systems`.

function applyPrestigeBonuses() {
    const installed = typeof globalThis !== 'undefined' ? globalThis.applyPrestigeBonuses : null;
    if (typeof installed === 'function' && installed !== applyPrestigeBonuses) {
        return installed();
    }
    STAT_KEYS.forEach(k => {
        if (typeof BonusEngine !== 'undefined') {
            BonusEngine.statMultipliers[k] = 1;
        }
    });
}

if (typeof module !== 'undefined') {
    module.exports = { applyPrestigeBonuses };
}
