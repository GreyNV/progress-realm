export const state = {
    stats: {
        strength: 1,
        intelligence: 1,
        wisdom: 0,
        charisma: 1,
        endurance: 1,
    },
    prestige: {
        strength: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0,
        endurance: 0,
    },
    showPrestige: false,
    ageYears: 16,
    ageDays: 0,
    maxAge: 75,
    time: 1,
    resources: {
        energy: 5,
        maxEnergy: 10,
        gold: 0,
        maxGold: 100,
        crystalDust: 0,
        maxCrystalDust: 50,
        manaCores: 0,
        maxManaCores: 10,
    },
    buffs: [],
    activeRoutine: null,
    queuedRoutine: null,
};

export function applyResourceCaps() {
    const res = state.resources;
    res.energy = Math.min(res.energy, res.maxEnergy);
    res.gold = Math.min(res.gold, res.maxGold);
    res.crystalDust = Math.min(res.crystalDust, res.maxCrystalDust);
    res.manaCores = Math.min(res.manaCores, res.maxManaCores);
}

function getRoutineKey(routine) {
    if (!routine) return null;
    return routine.id || null;
}

export function saveState() {
    const data = {
        stats: state.stats,
        prestige: state.prestige,
        showPrestige: state.showPrestige,
        ageYears: state.ageYears,
        ageDays: state.ageDays,
        maxAge: state.maxAge,
        time: state.time,
        resources: state.resources,
        buffs: state.buffs,
        activeRoutine: getRoutineKey(state.activeRoutine),
        queuedRoutine: getRoutineKey(state.queuedRoutine),
    };
    localStorage.setItem('progressRealmSave', JSON.stringify(data));
}

export function loadState(routinesById) {
    const raw = localStorage.getItem('progressRealmSave');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        Object.assign(state.stats, data.stats || {});
        Object.assign(state.prestige, data.prestige || {});
        state.showPrestige = data.showPrestige || false;
        state.ageYears = data.ageYears || 16;
        state.ageDays = data.ageDays || 0;
        state.maxAge = data.maxAge || 75;
        state.time = data.time || 1;
        Object.assign(state.resources, data.resources || {});
        state.buffs = (data.buffs || []).filter(b => !b.expiresAt || Date.now() < b.expiresAt);
        state.activeRoutine = routinesById[data.activeRoutine] || null;
        state.queuedRoutine = routinesById[data.queuedRoutine] || null;
    } catch (e) {
        console.error('Failed to load save', e);
    }
}
