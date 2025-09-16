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
    // baseMax is coerced to a number and defaults to 10
    create(value, baseMax, key) {
        return {
            value: value,
            baseMax: Number(baseMax ?? 10),
            maxAdditions: [],
            maxMultipliers: [],
            key: key
        };
    },
    max(res) {
        const base = Number(res.baseMax ?? 0);
        const additions = (res.maxAdditions || []).reduce((s, a) => s + a, 0);
        const mult = 1 + (res.maxMultipliers || [0]).reduce((s, x) => s + x, 0);
        return (base + additions) * mult;
    },
    add(res, amt) {
        if (!res || typeof amt !== 'number' || Number.isNaN(amt)) {
            return;
        }
        const cap = resolveResourceCap(res);
        res.value = applySoftCap(res.value, cap, amt);
    },
    consume(res, amt) {
        if (res.value < amt) return false;
        res.value -= amt;
        return true;
    }
};

const StatSystem = {
    // baseMax is coerced to a number and defaults to 10
    create(value, baseMax, key) {
        return {
            value: value,
            baseMax: Number(baseMax ?? 10),
            maxAdditions: [],
            maxMultipliers: [],
            key: key
        };
    },
    max(stat) {
        const base = Number(stat.baseMax ?? 0);
        const additions = (stat.maxAdditions || []).reduce((s, a) => s + a, 0);
        const mult = 1 + (stat.maxMultipliers || [0]).reduce((s, x) => s + x, 0);
        return (base + additions) * mult;
    },
    add(stat, amt) {
        if (!stat || typeof amt !== 'number' || Number.isNaN(amt)) {
            return;
        }
        const cap = resolveStatCap(stat);
        stat.value = applySoftCap(stat.value, cap, amt);
    }
};

function applySoftCap(current, cap, inc) {
    const baseValue = Number(current ?? 0);
    const amount = Number(inc ?? 0);
    if (!Number.isFinite(amount) || amount === 0) {
        return baseValue;
    }
    if (!Number.isFinite(cap)) {
        return baseValue + amount;
    }
    let newValue = baseValue;
    let delta = amount;
    if (delta > 0 && newValue < cap) {
        const toCap = cap - newValue;
        if (delta <= toCap) {
            return newValue + delta;
        }
        newValue = cap;
        delta -= toCap;
    }
    if (delta <= 0) {
        return newValue + delta;
    }
    const distance = Math.max(0, newValue - cap);
    const target = delta + distance + (distance * distance) / 2;
    const nextDistance = Math.sqrt(1 + (2 * target)) - 1;
    return cap + nextDistance;
}

function resolveResourceCap(res) {
    if (!res) return undefined;
    const key = res.key;
    if (typeof SoftCapSystem !== 'undefined' && SoftCapSystem && typeof SoftCapSystem.getResourceCap === 'function') {
        const cap = SoftCapSystem.getResourceCap(key);
        if (cap !== undefined) {
            return cap;
        }
    }
    return ResourceSystem.max(res);
}

function resolveStatCap(stat) {
    if (!stat) return undefined;
    const key = stat.key;
    if (typeof SoftCapSystem !== 'undefined' && SoftCapSystem && typeof SoftCapSystem.getStatCap === 'function') {
        const cap = SoftCapSystem.getStatCap(key);
        if (cap !== undefined) {
            return cap;
        }
    }
    return StatSystem.max(stat);
}

function getResourceValue(name) {
    return State.resources[name].value;
}

function getResourceMax(name) {
    return ResourceSystem.max(State.resources[name]);
}

function setResourceValue(name, val) {
    const r = State.resources[name];
    if (!r) return;
    if (typeof val !== 'number' || Number.isNaN(val)) {
        r.value = val;
        return;
    }
    const delta = val - Number(r.value ?? 0);
    if (delta <= 0) {
        r.value = val;
        return;
    }
    const cap = resolveResourceCap(r);
    r.value = applySoftCap(r.value, cap, delta);
}
function ensureResource(name, value, max) {
    const res = State.resources[name];
    if (!res || typeof res.value !== "number") {
        State.resources[name] = ResourceSystem.create(value, max, name);
    }
    const r = State.resources[name];
    if (r.key !== name) r.key = name;
    if (!Array.isArray(r.maxAdditions)) r.maxAdditions = [];
    if (!Array.isArray(r.maxMultipliers) || r.maxMultipliers.length === 0) r.maxMultipliers = [0];
}

function getStatValue(name) {
    return State.stats[name].value;
}

function getStatMax(name) {
    return StatSystem.max(State.stats[name]);
}

function setStatValue(name, val) {
    const s = State.stats[name];
    if (!s) return;
    if (typeof val !== 'number' || Number.isNaN(val)) {
        s.value = val;
        return;
    }
    const delta = val - Number(s.value ?? 0);
    if (delta <= 0) {
        s.value = val;
        return;
    }
    const cap = resolveStatCap(s);
    s.value = applySoftCap(s.value, cap, delta);
}

function ensureStat(name, value, max) {
    const stat = State.stats[name];
    if (!stat || typeof stat.value !== "number") {
        State.stats[name] = StatSystem.create(value, max, name);
    }
    const s = State.stats[name];
    if (s.key !== name) s.key = name;
    if (!Array.isArray(s.maxAdditions)) s.maxAdditions = [];
    if (!Array.isArray(s.maxMultipliers) || s.maxMultipliers.length === 0) s.maxMultipliers = [0];
}

function ensureMastery() {
    const savedValue = State.mastery && typeof State.mastery.value === 'number'
        ? State.mastery.value
        : 0;
    State.mastery = ResourceSystem.create(savedValue, Infinity, 'mastery');
    if (State.mastery.key !== 'mastery') State.mastery.key = 'mastery';
    if (!Array.isArray(State.mastery.maxAdditions)) State.mastery.maxAdditions = [];
    if (!Array.isArray(State.mastery.maxMultipliers) || State.mastery.maxMultipliers.length === 0) State.mastery.maxMultipliers = [0];
}

function _pathParts(path) {
    return Array.isArray(path) ? path : path.split('.');
}

function _resolve(path) {
    const parts = _pathParts(path);
    let obj = State;
    for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
    }
    return [obj, parts[parts.length - 1]];
}

function setState(path, value) {
    const [obj, key] = _resolve(path);
    obj[key] = value;
}

function updateState(path, fn) {
    const [obj, key] = _resolve(path);
    obj[key] = fn(obj[key]);
}

function pushState(path, value) {
    const [obj, key] = _resolve(path);
    obj[key].push(value);
}

function deleteState(path) {
    const [obj, key] = _resolve(path);
    delete obj[key];
}

function mergeState(obj) {
    Object.assign(State, obj);
}

let STAT_KEYS = [];
let RESOURCE_KEYS = [];
const DEFAULT_ACTION_ID = 'rest';
// Mapping from base stats to their prestige equivalents
const PRESTIGE_MAP = {
    strength: 'constitution',
    intelligence: 'wisdom',
    dexterity: 'reflexes'
};
const PRESTIGE_KEYS = Object.values(PRESTIGE_MAP);
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
    statDescriptions: {},
    resourceDescriptions: {},
    prestigeDescriptions: {},
    prestiging: false,
    // number of available action slots
    slotCount: 1,
    slots: [],
    adventureSlotCount: 1,
    adventureSlots: [],
    inventorySlotCount: 8,
    inventory: {},
    equipment: {
        head: null,
        armor: null,
        leftHand: null,
        rightHand: null,
        pants: null,
        boots: null,
        gloves: null,
        ring1: null,
        ring2: null,
        necklace: null
    },
    homeId: null,
    homesOwned: [],
    furniture: [],
    researchCompleted: [],
    time: 1,
    mastery: ResourceSystem.create(0, Infinity, 'mastery'),
    masteryDescription: 'Earned by advancing action tiers.',
    encounterLevel: 1,
    maxEncounterLevel: 1,
    encounterStreak: 0,
    currentAdventure: 'forest',
    adventureLevels: { forest: 1 },
    adventureActive: false,
    autoProgress: true,
    darkMode: true,
    language: 'en',
    showEncounterLog: true,
    hideRarityEnabled: false,
    hideBelowRarity: 'rare',
    defaultActionId: DEFAULT_ACTION_ID,
};

for (let i = 0; i < State.slotCount; i++) {
    State.slots.push({
        actionId: DEFAULT_ACTION_ID,
        progress: 0,
        blocked: false,
        text: '',
        queue: null
    });
}

for (let i = 0; i < State.adventureSlotCount; i++) {
    State.adventureSlots.push({ text: '', progress: 0, duration: 1, encounter: null, active: false, queue: null });
}

async function loadBaseData() {
    try {
        let res = await fetch('data/resources.json');
        if (!res.ok) {
            res = await fetch('../data/resources.json');
        }
        const json = await res.json();
        STAT_KEYS = Object.keys(json.stats || {});
        RESOURCE_KEYS = Object.keys(json.resources || {});
        STAT_KEYS.forEach(k => {
            const def = json.stats[k];
            State.stats[k] = StatSystem.create(def.value, def.baseMax, k);
            State.statDescriptions[k] = def.description || '';
        });
        RESOURCE_KEYS.forEach(k => {
            const def = json.resources[k];
            State.resources[k] = ResourceSystem.create(def.value, def.baseMax, k);
            State.resourceDescriptions[k] = def.description || '';
        });
        State.prestige = {};
        Object.keys(json.prestige || {}).forEach(k => {
            const def = json.prestige[k];
            State.prestige[k] = StatSystem.create(def.value, Infinity, k);
            State.prestigeDescriptions[k] = def.description || '';
        });
        if (typeof BonusEngine !== 'undefined' && BonusEngine.initialize) {
            BonusEngine.initialize(STAT_KEYS, RESOURCE_KEYS);
        }
        Logger.info('Base resource data loaded');
    } catch (e) {
        Logger.error('Failed to load resource data', e);
        if (typeof window !== 'undefined') {
            alert('Resource data could not be loaded. Ensure the server is serving the /data directory correctly.');
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        State,
        ResourceSystem,
        StatSystem,
        setState,
        updateState,
        pushState,
        deleteState,
        mergeState,
        ensureMastery,
        loadBaseData,
        STAT_KEYS,
        RESOURCE_KEYS,
        PRESTIGE_MAP,
        PRESTIGE_KEYS,
        DEFAULT_ACTION_ID,
    };
}

