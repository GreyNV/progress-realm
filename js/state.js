// Shared game state and resource helpers
const VERSION = 2;
const LOGIC_TICK_MS = 100;
const UI_UPDATE_MS = 200;
const TICKS_PER_SECOND = 1000 / LOGIC_TICK_MS;

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
    if (!State.resources[name] || typeof State.resources[name].value !== 'number') {
        State.resources[name] = ResourceSystem.create(value, max);
    }
}

const State = {
    version: VERSION,
    age: { years: 16, days: 0, max: 75 },
    introSeen: false,
    healerGoneSeen: false,
    banditsAmbushSeen: false,
    stats: {
        strength: 0,
        intelligence: 0,
        creativity: 0,
    },
    resources: {
        energy: ResourceSystem.create(10, 10),
        focus: ResourceSystem.create(10, 10),
        health: ResourceSystem.create(1, 10),
        money: ResourceSystem.create(0, 100)
    },
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
    autoProgress: true
};

for (let i = 0; i < State.slotCount; i++) {
    State.slots.push({ actionId: null, progress: 0, blocked: false, text: '' });
}

for (let i = 0; i < State.adventureSlotCount; i++) {
    State.adventureSlots.push({ text: '', progress: 0, duration: 1, encounter: null, active: false });
}

if (typeof module !== 'undefined') {
    module.exports = { State, ResourceSystem, getResourceValue, getResourceMax, setResourceValue, ensureResource,
        VERSION, LOGIC_TICK_MS, UI_UPDATE_MS, TICKS_PER_SECOND };
}
