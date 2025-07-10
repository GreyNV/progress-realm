// Applies prestige multipliers to stats and bonuses

function applyPrestigeBonuses() {
    STAT_KEYS.forEach(k => {
        const pKey = PRESTIGE_MAP[k];
        const p = State.prestige[pKey] || 0;
        if (State.stats[k]) {
            setState(['stats', k, 'maxMultipliers'], [1 + p * 0.02]);
        }
        if (typeof BonusEngine !== 'undefined') {
            BonusEngine.statMultipliers[k] = 1 + p * 0.05;
        }
    });
}

if (typeof module !== 'undefined') {
    module.exports = { applyPrestigeBonuses };
}
