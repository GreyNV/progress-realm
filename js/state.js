// Global state and helper systems
//
// Dependencies:
//  - bonus.js: uses BonusEngine for multipliers
//  - utils.js: helper methods (e.g. weighted random)
//
// Exports:
//  - State: persistent game data
//  - ResourceSystem / StatSystem: resource helpers
//  - loadBaseData(): fetches data/resources.json
//
// AI Agents: inspect State object when modifying progression logic.
// Game flow touches this module constantly. Most systems read or modify
// properties here through helper functions (see ResourceSystem/StatSystem).
// Initialization chain: loadBaseData() -> init in main.js -> per tick updates
// via DeltaEngine and others.

// Game save version. Shared with main.js for compatibility checks
const VERSION = 2;

const ResourceSystem = {
    create(value, baseMax) {
        return { value: value, baseMax: baseMax, maxAdditions: [], maxMultipliers: [] };
    },
    max(res) {
        let m = res.baseMax;
        res.maxAdditions.forEach(a => { m += a; });
        res.maxMultipliers.forEach(x => { m *= x; });
        return m;
    },
    add(res, amt) {
        res.value = Math.min(res.value + amt, this.max(res));
    },
    consume(res, amt) {
        if (res.value < amt) return false;
        res.value -= amt;
        return true;
    }
};

const StatSystem = {
    create(value, baseMax) {
        return { value: value, baseMax: baseMax, maxAdditions: [], maxMultipliers: [] };
    },
    max(stat) {
        let m = stat.baseMax;
        stat.maxAdditions.forEach(a => { m += a; });
        stat.maxMultipliers.forEach(x => { m *= x; });
        return m;
    },
    add(stat, amt) {
        stat.value = Math.min(stat.value + amt, this.max(stat));
    }
};

function getResourceValue(name) {
    return State.resources[name].value;
}

function getResourceMax(name) {
    return ResourceSystem.max(State.resources[name]);
}

function setResourceValue(name, val) {
    const r = State.resources[name];
    r.value = Math.min(val, getResourceMax(name));
}
function ensureResource(name, value, max) {
    if (!State.resources[name] || typeof State.resources[name].value !== "number") {
        State.resources[name] = ResourceSystem.create(value, max);
    }
}

function getStatValue(name) {
    return State.stats[name].value;
}

function getStatMax(name) {
    return StatSystem.max(State.stats[name]);
}

function setStatValue(name, val) {
    const s = State.stats[name];
    s.value = Math.min(val, getStatMax(name));
}

function ensureStat(name, value, max) {
    if (!State.stats[name] || typeof State.stats[name].value !== "number") {
        State.stats[name] = StatSystem.create(value, max);
    }
}

let STAT_KEYS = [];
let RESOURCE_KEYS = [];
const RARITY_CLASSES = ['common', 'rare', 'epic', 'legendary', 'story'];

const State = {
    version: VERSION,
    age: { years: 16, days: 0, max: 75 },
    introSeen: false,
    healerGoneSeen: false,
    banditsAmbushSeen: false,
    stats: {},
    resources: {},
    prestige: {},
    // number of available action slots
    slotCount: 6,
    slots: [],
    adventureSlotCount: 1,
    adventureSlots: [],
    inventorySlotCount: 8,
    inventory: {},
    time: 1,
    masteryPoints: 0,
    encounterLevel: 0,
    encounterStreak: 0,
    autoProgress: true,
    darkMode: true,
    language: 'en',
};

for (let i = 0; i < State.slotCount; i++) {
    State.slots.push({ actionId: null, progress: 0, blocked: false, text: '' });
}

for (let i = 0; i < State.adventureSlotCount; i++) {
    State.adventureSlots.push({ text: '', progress: 0, duration: 1, encounter: null, active: false });
}

async function loadBaseData() {
    try {
        const res = await fetch('data/resources.json');
        const json = await res.json();
        STAT_KEYS = Object.keys(json.stats || {});
        RESOURCE_KEYS = Object.keys(json.resources || {});
        STAT_KEYS.forEach(k => {
            const def = json.stats[k];
            State.stats[k] = StatSystem.create(def.value, def.baseMax);
        });
        RESOURCE_KEYS.forEach(k => {
            const def = json.resources[k];
            State.resources[k] = ResourceSystem.create(def.value, def.baseMax);
        });
        State.prestige = { ...json.prestige };
        if (typeof BonusEngine !== 'undefined' && BonusEngine.initialize) {
            BonusEngine.initialize(STAT_KEYS, RESOURCE_KEYS);
        }
        Logger.info('Base resource data loaded');
    } catch (e) {
        Logger.error('Failed to load resource data', e);
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        State,
        ResourceSystem,
        StatSystem,
        loadBaseData,
        STAT_KEYS,
        RESOURCE_KEYS,
    };
}

