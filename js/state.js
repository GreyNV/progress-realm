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
const VERSION = 3;

const ResourceSystem = {
    create(value, baseMax, key = null) {
        return { value: value, baseMax: baseMax, maxAdditions: [], maxMultipliers: [], key: key };
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
    create(value, baseMax, key = null) {
        const level = Math.max(0, Number(value || 0));
        return {
            value: level,
            level: level,
            exp: 0,
            expToNext: 10 + level * 6,
            baseMax: baseMax,
            maxAdditions: [],
            maxMultipliers: [],
            key: key
        };
    },
    max(stat) {
        return stat.expToNext || 10;
    },
    add(stat, amt) {
        if (amt <= 0) return;
        stat.exp = (stat.exp || 0) + amt;
        while (stat.exp >= stat.expToNext) {
            stat.exp -= stat.expToNext;
            stat.level = (stat.level || stat.value || 0) + 1;
            stat.value = stat.level;
            stat.expToNext = Math.floor(stat.expToNext * 1.16 + 6);
        }
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
        State.resources[name] = ResourceSystem.create(value, max, name);
    }
    if (State.resources[name].key !== name) {
        State.resources[name].key = name;
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
    s.level = Math.max(0, val);
    s.value = s.level;
}

function ensureStat(name, value, max) {
    if (!State.stats[name] || typeof State.stats[name].value !== "number") {
        State.stats[name] = StatSystem.create(value, max, name);
    }
    if (State.stats[name].key !== name) {
        State.stats[name].key = name;
    }
    if (State.stats[name].level === undefined) {
        State.stats[name].level = State.stats[name].value || 0;
    }
    if (State.stats[name].exp === undefined) {
        State.stats[name].exp = 0;
    }
    if (State.stats[name].expToNext === undefined) {
        State.stats[name].expToNext = 10 + State.stats[name].level * 6;
    }
}

function getStatLevel(name) {
    return State.stats[name] ? State.stats[name].level || 0 : 0;
}

function getStatExp(name) {
    return State.stats[name] ? State.stats[name].exp || 0 : 0;
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
    agility: 'reflexes',
    constitution: 'vigor',
    will: 'instinct'
};
const PRESTIGE_KEYS = Object.values(PRESTIGE_MAP);
const RARITY_CLASSES = ['common', 'rare', 'epic', 'legendary', 'story'];

function createDefaultEquipment() {
    return {
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
    };
}

function createDefaultCombatState() {
    return {
        active: false,
        phase: 'idle',
        encounterId: null,
        round: 0,
        player: null,
        enemy: null,
        log: [],
        outcome: null,
        timeToNextTurn: 0
    };
}

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
    equipment: createDefaultEquipment(),
    homeId: null,
    homesOwned: [],
    furniture: [],
    researchCompleted: [],
    actionAssignments: {},
    actionRuntime: {},
    encounterCompletions: {},
    adventureCompletions: {},
    time: 1,
    masteryPoints: 0,
    encounterLevel: 1,
    encounterStreak: 0,
    currentDungeon: 'frontier',
    queuedEncounterId: null,
    combat: createDefaultCombatState(),
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
        queuedActionId: null,
        queue: null
    });
}

for (let i = 0; i < State.adventureSlotCount; i++) {
    State.adventureSlots.push({
        text: '',
        progress: 0,
        duration: 1,
        encounter: null,
        active: false,
        queue: null
    });
}

async function loadBaseData() {
    try {
        const registry = typeof window !== 'undefined' ? window.__appContent : null;
        let json = registry && registry.resources ? registry.resources : null;
        if (!json) {
            let res = await fetch('data/resources.json');
            if (!res.ok) {
                res = await fetch('../data/resources.json');
            }
            json = await res.json();
        }
        STAT_KEYS = Object.keys(json.stats || {});
        RESOURCE_KEYS = Object.keys(json.resources || {});
        STAT_KEYS.forEach(k => {
            const def = json.stats[k];
        State.stats[k] = StatSystem.create(def.value, def.baseMax, k);
        if (def.exp) {
            State.stats[k].exp = def.exp;
        }
        if (def.expToNext) {
            State.stats[k].expToNext = def.expToNext;
        }
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
            if (typeof def === 'number') {
                State.prestige[k] = def;
                State.prestigeDescriptions[k] = '';
                return;
            }
            State.prestige[k] = def.value || 0;
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
        loadBaseData,
        STAT_KEYS,
        RESOURCE_KEYS,
        PRESTIGE_MAP,
        PRESTIGE_KEYS,
        getStatLevel,
        getStatExp,
        DEFAULT_ACTION_ID,
        createDefaultEquipment,
        createDefaultCombatState,
    };
}

if (typeof globalThis !== 'undefined') {
    const scope = globalThis;

    if (!Object.getOwnPropertyDescriptor(scope, 'VERSION')) {
        Object.defineProperty(scope, 'VERSION', {
            configurable: true,
            get() {
                return VERSION;
            }
        });
    }

    if (!Object.getOwnPropertyDescriptor(scope, 'STAT_KEYS')) {
        Object.defineProperty(scope, 'STAT_KEYS', {
            configurable: true,
            get() {
                return STAT_KEYS;
            },
            set(value) {
                STAT_KEYS = value;
            }
        });
    }

    if (!Object.getOwnPropertyDescriptor(scope, 'RESOURCE_KEYS')) {
        Object.defineProperty(scope, 'RESOURCE_KEYS', {
            configurable: true,
            get() {
                return RESOURCE_KEYS;
            },
            set(value) {
                RESOURCE_KEYS = value;
            }
        });
    }

    scope.State = State;
    scope.ResourceSystem = ResourceSystem;
    scope.StatSystem = StatSystem;
    scope.setState = setState;
    scope.updateState = updateState;
    scope.pushState = pushState;
    scope.deleteState = deleteState;
    scope.mergeState = mergeState;
    scope.loadBaseData = loadBaseData;
    scope.PRESTIGE_MAP = PRESTIGE_MAP;
    scope.PRESTIGE_KEYS = PRESTIGE_KEYS;
    scope.RARITY_CLASSES = RARITY_CLASSES;
    scope.getStatLevel = getStatLevel;
    scope.getStatExp = getStatExp;
    scope.createDefaultEquipment = createDefaultEquipment;
    scope.createDefaultCombatState = createDefaultCombatState;
}

