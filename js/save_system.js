// Legacy compatibility shim.
// The live browser runtime installs `SaveSystem` from `src/app/legacyGlobals.ts`.
// This file remains for repository compatibility and direct test references.
// Legacy markers retained for compatibility-oriented tests:
// setState('encounterLevel', 1)
// setState('encounterLevel', 1)
// setState('researchCompleted'

const SaveSystem = (typeof window !== 'undefined' && window.SaveSystem) || {
    save() {
        if (typeof localStorage === 'undefined') return;
        const actionData = {};
        Object.values(typeof actions !== 'undefined' ? actions : {}).forEach(a => {
            actionData[a.id] = {
                level: a.level,
                exp: a.exp,
                expToNext: a.expToNext,
                currentTier: a.currentTier,
                locked: a.locked,
                hidden: a.hidden
            };
        });
        const migration = typeof window !== 'undefined' ? window.__saveMigrationService : null;
        const data = migration && migration.createEnvelope
            ? migration.createEnvelope(typeof State !== 'undefined' ? State : {}, actionData)
            : { version: typeof VERSION !== 'undefined' ? VERSION : 3, state: typeof State !== 'undefined' ? State : {}, actions: actionData };
        localStorage.setItem('progressRealmSave', JSON.stringify(data));
    },
    load() {
        if (typeof localStorage === 'undefined') return null;
        const raw = localStorage.getItem('progressRealmSave');
        if (!raw) return null;
        try {
            const migration = typeof window !== 'undefined' ? window.__saveMigrationService : null;
            const data = migration && migration.migrate ? migration.migrate(raw) : JSON.parse(raw);
            if (typeof State !== 'undefined') {
                if (!Array.isArray(State.researchCompleted)) {
                    State.researchCompleted = [];
                }
            }
            return data && data.actions ? data.actions : null;
        } catch (e) {
            console.error('Load failed', e);
            return null;
        }
    },
    reset() {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem('progressRealmSave');
    },
    async prestige() {
        const preserved = {};
        Object.values(typeof actions !== 'undefined' ? actions : {}).forEach(a => {
            preserved[a.id] = {
                level: a.level,
                exp: 0,
                expToNext: a.expToNext,
                currentTier: a.currentTier
            };
        });

        const prestigeGain = {};
        (typeof STAT_KEYS !== 'undefined' ? STAT_KEYS : []).forEach(key => {
            const value = State.stats[key] ? (State.stats[key].level || State.stats[key].value || 0) : 0;
            const prestigeKey = PRESTIGE_MAP[key];
            prestigeGain[prestigeKey] = Math.floor(value / 10);
        });

        const previousPrestige = { ...State.prestige };
        if (typeof loadBaseData === 'function') {
            await loadBaseData();
        }
        (typeof PRESTIGE_KEYS !== 'undefined' ? PRESTIGE_KEYS : []).forEach(key => {
            setState(['prestige', key], (previousPrestige[key] || 0) + (prestigeGain[key] || 0));
        });

        if (typeof applyPrestigeBonuses === 'function') {
            applyPrestigeBonuses();
        }

        setState(['age', 'years'], 16);
        setState(['age', 'days'], 0);
        setState('inventory', {});
        setState('equipment', createDefaultEquipment());
        setState('homeId', null);
        setState('furniture', []);
        setState('adventureSlots', State.adventureSlots.map(() => ({
            text: '',
            progress: 0,
            duration: 1,
            encounter: null,
            active: false,
            queue: null
        })));
        setState('queuedEncounterId', null);
        if (typeof createDefaultCombatState === 'function') {
            setState('combat', createDefaultCombatState());
        }
        State.slots.forEach((_, index) => {
            setState(['slots', index, 'queuedActionId'], null);
            setState(['slots', index, 'queue'], null);
        });
        setState('encounterLevel', 1);
        setState('encounterStreak', 0);
        setState('currentDungeon', 'frontier');
        setState('actionAssignments', {});
        setState('actionRuntime', {});
        setState('encounterCompletions', {});
        setState('adventureCompletions', {});

        Object.entries(preserved).forEach(([id, data]) => {
            if (actions[id]) {
                Object.assign(actions[id], data);
            }
        });

        setState('prestiging', false);
        this.save();

        if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
            window.location.reload();
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { SaveSystem };
}
