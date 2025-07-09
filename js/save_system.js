// Handles save/load and prestige mechanics
const SaveSystem = {
    save() {
        const actionData = {};
        Object.values(actions).forEach(a => {
            actionData[a.id] = {
                level: a.level,
                exp: a.exp,
                expToNext: a.expToNext,
                currentTier: a.currentTier
            };
        });
        const data = { version: VERSION, state: State, actions: actionData };
        localStorage.setItem('progressRealmSave', JSON.stringify(data));
    },
    load() {
        const raw = localStorage.getItem('progressRealmSave');
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            if (data.version !== VERSION) return null;
            if (data.state) {
                Object.assign(State, data.state);
                RESOURCE_KEYS.forEach(k => {
                    const def = State.resources[k] || { value: 0, baseMax: 0 };
                    ensureResource(k, def.value, def.baseMax);
                });
                STAT_KEYS.forEach(k => {
                    const def = State.stats[k] || { value: 0, baseMax: 0 };
                    ensureStat(k, def.value, def.baseMax);
                });
                if (Array.isArray(State.slots)) {
                    State.slots.forEach(s => {
                        if (s.text === undefined) s.text = '';
                    });
                } else {
                    State.slots = [];
                }
                if (State.slotCount === undefined) {
                    State.slotCount = Array.isArray(State.slots) ? State.slots.length : 0;
                }
                if (State.encounterLevel === undefined) {
                    State.encounterLevel = 1;
                }
                if (State.encounterStreak === undefined) {
                    State.encounterStreak = 0;
                }
                if (State.adventureSlotCount === undefined || State.adventureSlotCount > 1) {
                    State.adventureSlotCount = 1;
                }
                if (Array.isArray(State.adventureSlots)) {
                    State.adventureSlots.forEach(s => {
                        if (s.active === undefined) s.active = false;
                        if (s.encounter && typeof s.encounter.getLootChance !== 'function') {
                            s.encounter = new Encounter(s.encounter);
                        }
                    });
                }
                if (State.inventorySlotCount === undefined) {
                    State.inventorySlotCount = 8;
                }
                if (!State.inventory) {
                    State.inventory = {};
                }
                if (State.banditsAmbushSeen === undefined) {
                    State.banditsAmbushSeen = false;
                }
                if (State.autoProgress === undefined) {
                    State.autoProgress = true;
                }
                if (State.darkMode === undefined) {
                    State.darkMode = true;
                }
                if (State.hideRarityEnabled === undefined) {
                    State.hideRarityEnabled = false;
                }
                if (!State.hideBelowRarity) {
                    State.hideBelowRarity = 'rare';
                }
                if (State.homeId === undefined) {
                    State.homeId = null;
                }
                if (!Array.isArray(State.furniture)) {
                    State.furniture = [];
                }
                if (!Array.isArray(State.researchCompleted)) {
                    State.researchCompleted = [];
                }
                if (!State.language) {
                    State.language = 'en';
                }
                return data.actions || null;
            } else {
                Object.assign(State, data); // legacy save
                return null;
            }
        } catch (e) {
            console.error('Load failed', e);
            return null;
        }
    },
    reset() {
        localStorage.removeItem('progressRealmSave');
        window.location.reload();
    },
    async prestige() {
        const preserved = {};
        Object.values(actions).forEach(a => {
            preserved[a.id] = {
                level: a.level,
                exp: 0,
                expToNext: a.expToNext,
                currentTier: a.currentTier
            };
        });

        const prestigeGain = {};
        STAT_KEYS.forEach(k => {
            const val = State.stats[k] ? State.stats[k].value : 0;
            const pKey = PRESTIGE_MAP[k];
            prestigeGain[pKey] = Math.floor(Math.log10(val + 1));
        });

        const previousPrestige = { ...State.prestige };
        await loadBaseData();
        PRESTIGE_KEYS.forEach(k => {
            State.prestige[k] = (previousPrestige[k] || 0) + (prestigeGain[k] || 0);
        });

        applyPrestigeBonuses();

        State.age.years = 16;
        State.age.days = 0;

        State.inventory = {};
        State.homeId = null;
        State.furniture = [];
        State.researchCompleted = [];
        State.adventureSlots = State.adventureSlots.map(() => ({
            text: '', progress: 0, duration: 1, encounter: null, active: false
        }));
        State.encounterLevel = 1;
        State.encounterStreak = 0;
        Object.entries(preserved).forEach(([id, data]) => {
            if (actions[id]) Object.assign(actions[id], data);
        });
        State.prestiging = false;
        SaveSystem.save();
        window.location.reload();
    }
};
