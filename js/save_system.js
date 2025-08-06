// Handles save/load and prestige mechanics
const SaveSystem = {
    save() {
        const actionData = {};
        Object.values(actions).forEach(a => {
            actionData[a.id] = {
                level: a.level,
                exp: a.exp,
                expToNext: a.expToNext,
                currentTier: a.currentTier,
                locked: a.locked,
                hidden: a.hidden,
                progress: a.progress || 0
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
                mergeState(data.state);
                ensureMastery();
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
                        if (!s.actionId) s.actionId = State.defaultActionId;
                        if (s.text === undefined) s.text = '';
                    });
                } else {
                    setState('slots', []);
                }
                if (State.slotCount === undefined) {
                    setState('slotCount', Array.isArray(State.slots) ? State.slots.length : 0);
                }
                if (State.encounterLevel === undefined) {
                    setState('encounterLevel', 1);
                }
                if (State.encounterStreak === undefined) {
                    setState('encounterStreak', 0);
                }
                if (!State.currentAdventure) {
                    setState('currentAdventure', 'forest');
                }
                if (!State.adventureLevels || typeof State.adventureLevels !== 'object') {
                    setState('adventureLevels', { forest: 1 });
                } else if (State.adventureLevels.forest === undefined) {
                    setState(['adventureLevels', 'forest'], 1);
                }
                if (State.adventureSlotCount === undefined || State.adventureSlotCount > 1) {
                    setState('adventureSlotCount', 1);
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
                    setState('inventorySlotCount', 8);
                }
                if (!State.inventory) {
                    setState('inventory', {});
                }
                if (!State.equipment) {
                    // initialize equipment slots for older saves
                    setState('equipment', {
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
                    });
                }
                if (State.banditsAmbushSeen === undefined) {
                    setState('banditsAmbushSeen', false);
                }
                if (State.adventureActive === undefined) {
                    setState('adventureActive', false);
                }
                if (State.autoProgress === undefined) {
                    setState('autoProgress', true);
                }
                if (State.darkMode === undefined) {
                    setState('darkMode', true);
                }
                if (State.hideRarityEnabled === undefined) {
                    setState('hideRarityEnabled', false);
                }
                if (!State.hideBelowRarity) {
                    setState('hideBelowRarity', 'rare');
                }
                if (State.homeId === undefined) {
                    setState('homeId', null);
                }
                if (!Array.isArray(State.furniture)) {
                    setState('furniture', []);
                }
                if (!Array.isArray(State.researchCompleted)) {
                    setState('researchCompleted', []);
                }
                if (!Array.isArray(State.homesOwned)) {
                    setState('homesOwned', []);
                }
                if (!State.language) {
                    setState('language', 'en');
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
                currentTier: a.currentTier,
                progress: 0
            };
        });

        const prestigeGain = {};
        STAT_KEYS.forEach(k => {
            const val = State.stats[k] ? State.stats[k].value : 0;
            const pKey = PRESTIGE_MAP[k];
            prestigeGain[pKey] = Math.floor(Math.log10(val + 1));
        });

        const previousPrestige = {};
        Object.keys(State.prestige).forEach(k => {
            previousPrestige[k] = State.prestige[k].value;
        });
        await loadBaseData();
        PRESTIGE_KEYS.forEach(k => {
            setState(['prestige', k, 'value'], (previousPrestige[k] || 0) + (prestigeGain[k] || 0));
        });

        applyPrestigeBonuses();

        setState(['age', 'years'], 16);
        setState(['age', 'days'], 0);

        setState('inventory', {});
        // clear all equipped items
        setState('equipment', {
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
        });
        setState('homeId', null);
        setState('furniture', []);
        if (typeof PubSub !== 'undefined' && Array.isArray(FurnitureSystem.furniture)) {
            FurnitureSystem.furniture.forEach(f => {
                if (Array.isArray(f.unlocks)) {
                    PubSub.publish('furniture:destroyed', { id: f.id, unlocks: f.unlocks });
                }
            });
        }
        setState('adventureSlots', State.adventureSlots.map(() => ({
            text: '', progress: 0, duration: 1, encounter: null, active: false
        })));
        setState('currentAdventure', 'forest');
        setState('adventureLevels', { forest: 1 });
        setState('adventureActive', false);
        setState('encounterLevel', 1);
        setState('encounterStreak', 0);
        Object.entries(preserved).forEach(([id, data]) => {
            if (actions[id]) Object.assign(actions[id], data);
        });
        setState('prestiging', false);
        if (typeof HomeSystem !== 'undefined' && HomeSystem.assignDefault) {
            HomeSystem.assignDefault();
        }
        SaveSystem.save();
        window.location.reload();
    }
};
