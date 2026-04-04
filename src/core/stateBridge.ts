function getScope(): any {
    return globalThis as any;
}

export const VERSION = 3;
export let STAT_KEYS: string[] = [];
export let RESOURCE_KEYS: string[] = [];
export const DEFAULT_ACTION_ID = "rest";
export const PRESTIGE_MAP: Record<string, string> = {
    strength: "constitution",
    intelligence: "wisdom",
    agility: "reflexes",
    constitution: "vigor",
    will: "instinct"
};
export const PRESTIGE_KEYS = Object.values(PRESTIGE_MAP);
export const RARITY_CLASSES = ["common", "rare", "epic", "legendary", "story"];

export const ResourceSystem = {
    create(value: number, baseMax: number, key: string | null = null) {
        return { value, baseMax, maxAdditions: [], maxMultipliers: [], key };
    },
    max(res: any) {
        let max = res.baseMax;
        (res.maxAdditions || []).forEach((add: number) => { max += add; });
        (res.maxMultipliers || []).forEach((mult: number) => { max *= mult; });
        return max;
    },
    add(res: any, amount: number) {
        res.value = Math.min(res.value + amount, this.max(res));
    },
    consume(res: any, amount: number) {
        if (res.value < amount) return false;
        res.value -= amount;
        return true;
    }
};

function getBaseRequirement(base: number, level: number) {
    return Math.floor(base * Math.pow(1.5, Math.max(0, Number(level || 0))));
}

export const StatSystem = {
    create(value: number, baseMax: number, key: string | null = null) {
        const level = Math.max(0, Number(value || 0));
        const baseXpRequirement = Math.max(1, Number(baseMax || 20));
        return {
            value: level,
            level,
            exp: 0,
            expToNext: getBaseRequirement(baseXpRequirement, level),
            baseMax,
            baseXpRequirement,
            maxAdditions: [],
            maxMultipliers: [],
            key
        };
    },
    max(stat: any) {
        return stat.expToNext || stat.baseXpRequirement || 20;
    },
    add(stat: any, amount: number) {
        if (amount <= 0) return;
        stat.exp = (stat.exp || 0) + amount;
        while (stat.exp >= stat.expToNext) {
            stat.exp -= stat.expToNext;
            stat.level = (stat.level || stat.value || 0) + 1;
            stat.value = stat.level;
            stat.expToNext = getBaseRequirement((stat.baseXpRequirement || 20), stat.level);
        }
    }
};

export const MasterySystem = {
    create(level = 0, baseXpRequirement = 20) {
        const safeLevel = Math.max(0, Number(level || 0));
        const safeBase = Math.max(1, Number(baseXpRequirement || 20));
        return {
            level: safeLevel,
            exp: 0,
            expToNext: getBaseRequirement(safeBase, safeLevel),
            baseXpRequirement: safeBase
        };
    },
    add(key: string, amount: number) {
        if (amount <= 0) return;
        const mastery = State.mastery?.[key];
        if (!mastery) return;
        mastery.exp = (mastery.exp || 0) + amount;
        while (mastery.exp >= mastery.expToNext) {
            mastery.exp -= mastery.expToNext;
            mastery.level = (mastery.level || 0) + 1;
            State.prestige[key] = mastery.level;
            mastery.expToNext = getBaseRequirement(mastery.baseXpRequirement || 20, mastery.level);
        }
    }
};

export function createDefaultEquipment() {
    return { head: null, armor: null, leftHand: null, rightHand: null, pants: null, boots: null, gloves: null, ring1: null, ring2: null, necklace: null };
}

export function createDefaultCombatState() {
    return { active: false, phase: "idle", encounterId: null, round: 0, player: null, enemy: null, log: [], outcome: null, timeToNextTurn: 0 };
}

export const State: any = {
    version: VERSION,
    age: { years: 16, days: 0, max: 75 },
    introSeen: false,
    healerGoneSeen: false,
    banditsAmbushSeen: false,
    stats: {},
    resources: {},
    prestige: {},
    mastery: {},
    statDescriptions: {},
    resourceDescriptions: {},
    prestigeDescriptions: {},
    prestiging: false,
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
    routineUpgrades: {},
    encounterCompletions: {},
    adventureCompletions: {},
    time: 1,
    masteryPoints: 0,
    encounterLevel: 1,
    encounterStreak: 0,
    currentDungeon: "frontier",
    queuedEncounterId: null,
    combat: createDefaultCombatState(),
    autoProgress: true,
    darkMode: true,
    language: "en",
    showEncounterLog: true,
    hideRarityEnabled: false,
    hideBelowRarity: "rare",
    defaultActionId: DEFAULT_ACTION_ID
};

for (let i = 0; i < State.slotCount; i += 1) {
    State.slots.push({ actionId: DEFAULT_ACTION_ID, progress: 0, blocked: false, text: "", queuedActionId: null, queue: null });
}
for (let i = 0; i < State.adventureSlotCount; i += 1) {
    State.adventureSlots.push({ text: "", progress: 0, duration: 1, encounter: null, active: false, queue: null });
}

function pathParts(path: string | string[]) { return Array.isArray(path) ? path : path.split("."); }
function resolve(path: string | string[]) { const parts = pathParts(path); let obj = State; for (let i = 0; i < parts.length - 1; i += 1) obj = obj[parts[i]]; return [obj, parts[parts.length - 1]] as const; }
export function setState(path: string | string[], value: unknown) { const [obj, key] = resolve(path); obj[key] = value; }
export function updateState(path: string | string[], fn: (value: any) => any) { const [obj, key] = resolve(path); obj[key] = fn(obj[key]); }
export function pushState(path: string | string[], value: unknown) { const [obj, key] = resolve(path); obj[key].push(value); }
export function deleteState(path: string | string[]) { const [obj, key] = resolve(path); delete obj[key]; }
export function mergeState(obj: Record<string, unknown>) { Object.assign(State, obj); }
export function getResourceValue(name: string) { return State.resources[name].value; }
export function getResourceMax(name: string) { return ResourceSystem.max(State.resources[name]); }
export function setResourceValue(name: string, value: number) { State.resources[name].value = Math.min(value, getResourceMax(name)); }
export function ensureResource(name: string, value: number, max: number) { if (!State.resources[name] || typeof State.resources[name].value !== "number") State.resources[name] = ResourceSystem.create(value, max, name); if (State.resources[name].key !== name) State.resources[name].key = name; }
export function getStatValue(name: string) { return State.stats[name].value; }
export function getStatMax(name: string) { return StatSystem.max(State.stats[name]); }
export function setStatValue(name: string, value: number) { const stat = State.stats[name]; stat.level = Math.max(0, value); stat.value = stat.level; }
export function ensureStat(name: string, value: number, max: number) { if (!State.stats[name] || typeof State.stats[name].value !== "number") State.stats[name] = StatSystem.create(value, max, name); if (State.stats[name].key !== name) State.stats[name].key = name; if (State.stats[name].baseXpRequirement === undefined) State.stats[name].baseXpRequirement = max || 20; if (State.stats[name].level === undefined) State.stats[name].level = State.stats[name].value || 0; if (State.stats[name].exp === undefined) State.stats[name].exp = 0; if (State.stats[name].expToNext === undefined) State.stats[name].expToNext = Math.floor((State.stats[name].baseXpRequirement || 20) * Math.pow(1.5, State.stats[name].level || 0)); }
export function getStatLevel(name: string) { return State.stats[name] ? State.stats[name].level || 0 : 0; }
export function getStatExp(name: string) { return State.stats[name] ? State.stats[name].exp || 0 : 0; }
export function getMasteryLevel(name: string) { return State.mastery[name] ? State.mastery[name].level || 0 : (State.prestige[name] || 0); }
export function getMasteryExp(name: string) { return State.mastery[name] ? State.mastery[name].exp || 0 : 0; }
export function getMasteryMax(name: string) { return State.mastery[name] ? State.mastery[name].expToNext || State.mastery[name].baseXpRequirement || 20 : 20; }
export function ensureMastery(name: string, level: number, baseXpRequirement: number) {
    if (!State.mastery[name] || typeof State.mastery[name].level !== "number") {
        State.mastery[name] = MasterySystem.create(level, baseXpRequirement);
    }
    if (State.mastery[name].baseXpRequirement === undefined) {
        State.mastery[name].baseXpRequirement = baseXpRequirement || 20;
    }
    if (State.mastery[name].exp === undefined) {
        State.mastery[name].exp = 0;
    }
    if (State.mastery[name].expToNext === undefined) {
        State.mastery[name].expToNext = getBaseRequirement(State.mastery[name].baseXpRequirement || 20, State.mastery[name].level || 0);
    }
    State.mastery[name].level = Math.max(0, Number(level || State.mastery[name].level || 0));
    State.prestige[name] = State.mastery[name].level;
}

export async function loadBaseData() {
    try {
        const scope = getScope();
        const registry = typeof window !== "undefined" ? (window as any).__appContent : null;
        let json = registry && registry.resources ? registry.resources : null;
        if (!json) {
            let res = await fetch("data/resources.json");
            if (!res.ok) res = await fetch("../data/resources.json");
            json = await res.json();
        }
        STAT_KEYS = Object.keys(json.stats || {});
        RESOURCE_KEYS = Object.keys(json.resources || {});
        STAT_KEYS.forEach((key) => {
            const def = json.stats[key];
            State.stats[key] = StatSystem.create(def.value, def.baseXpRequirement || def.baseMax, key);
            if (def.exp) State.stats[key].exp = def.exp;
            if (def.expToNext) State.stats[key].expToNext = def.expToNext;
            State.statDescriptions[key] = def.description || "";
        });
        RESOURCE_KEYS.forEach((key) => {
            const def = json.resources[key];
            State.resources[key] = ResourceSystem.create(def.value, def.baseMax, key);
            State.resourceDescriptions[key] = def.description || "";
        });
        State.prestige = {};
        State.mastery = {};
        Object.keys(json.prestige || {}).forEach((key) => {
            const def = json.prestige[key];
            const mappedStat = Object.keys(PRESTIGE_MAP).find((statKey) => PRESTIGE_MAP[statKey] === key);
            const baseXpRequirement = mappedStat && json.stats?.[mappedStat]
                ? Number(json.stats[mappedStat].baseXpRequirement || json.stats[mappedStat].baseMax || 20)
                : 20;
            if (typeof def === "number") {
                State.prestige[key] = def;
                State.prestigeDescriptions[key] = "";
                State.mastery[key] = MasterySystem.create(def, baseXpRequirement);
            } else {
                State.prestige[key] = def.value || 0;
                State.prestigeDescriptions[key] = def.description || "";
                State.mastery[key] = MasterySystem.create(def.value || 0, baseXpRequirement);
            }
        });
        scope.BonusEngine?.initialize?.(STAT_KEYS, RESOURCE_KEYS);
        scope.Logger?.info?.("Base resource data loaded");
    } catch (error) {
        getScope().Logger?.error?.("Failed to load resource data", error);
        if (typeof window !== "undefined") alert("Resource data could not be loaded. Ensure the server is serving the /data directory correctly.");
    }
}

export function installStateGlobals() {
    const scope = getScope();
    Object.defineProperty(scope, "VERSION", { configurable: true, get: () => VERSION });
    Object.defineProperty(scope, "STAT_KEYS", { configurable: true, get: () => STAT_KEYS, set: (value) => { STAT_KEYS = value; } });
    Object.defineProperty(scope, "RESOURCE_KEYS", { configurable: true, get: () => RESOURCE_KEYS, set: (value) => { RESOURCE_KEYS = value; } });
    Object.assign(scope, { State, ResourceSystem, StatSystem, MasterySystem, setState, updateState, pushState, deleteState, mergeState, loadBaseData, PRESTIGE_MAP, PRESTIGE_KEYS, RARITY_CLASSES, getStatLevel, getStatExp, getMasteryLevel, getMasteryExp, getMasteryMax, getResourceValue, getResourceMax, setResourceValue, ensureResource, getStatValue, getStatMax, setStatValue, ensureStat, ensureMastery, createDefaultEquipment, createDefaultCombatState });
}
