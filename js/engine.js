/*
 * Agents: DeltaEngine is the heart of the tick cycle. `calculate()` gathers
 * contributions from actions and encounters while `apply()` writes the
 * aggregated deltas back to `State`. Most game logic ultimately flows through
 * these two functions, so follow the chain:
 *   ActionEngine.tick -> DeltaEngine.calculate -> DeltaEngine.apply
 */
const migratedDelta = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.deltaEngine;
const statDeltas = migratedDelta ? migratedDelta.statDeltas : { strength: 0, intelligence: 0, agility: 0, constitution: 0, will: 0 };
const resourceDeltas = migratedDelta ? migratedDelta.resourceDeltas : {};
let ageDelta = 0;
const expDeltas = {};
const encounterProgressDeltas = migratedDelta ? migratedDelta.encounterProgressDeltas : [];
const STAT_XP_GAIN_MULTIPLIER = 1.2;

const DeltaEngine = {
    calculate() {
        const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.deltaEngine;
        if (migrated) return migrated.calculate();
        // reset deltas
        STAT_KEYS.forEach(k => { statDeltas[k] = 0; });
        RESOURCE_KEYS.forEach(k => { resourceDeltas[k] = 0; });
        ageDelta = 1;
        for (const id in expDeltas) {
            delete expDeltas[id];
        }

        // contributions from active actions
        State.slots.forEach(slot => {
            if (!slot.actionId || slot.blocked) return;
            const action = actions[slot.actionId];
            const mult = scalingMultiplier(action) *
                getActionSpeedMultiplier(action) *
                getActionOutputMultiplier(action);

            if (action.baseYield.stats) {
                for (const s in action.baseYield.stats) {
                    statDeltas[s] = (statDeltas[s] || 0) +
                        action.baseYield.stats[s] * mult;
                }
            }

            if (action.baseYield.exp) {
                expDeltas[action.id] = (expDeltas[action.id] || 0) +
                    action.baseYield.exp * mult;
            }
        });

        // contributions from active encounters
        encounterProgressDeltas.length = State.adventureSlots.length;
        State.adventureSlots.forEach((slot, i) => {
            encounterProgressDeltas[i] = 0;
            if (!slot.active || !slot.encounter) return;
            if (slot.encounter.combat) return;
            encounterProgressDeltas[i] = 1 / slot.duration;
        });
    },

    apply(deltaSeconds, mult = 1) {
        const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.deltaEngine;
        if (migrated) return migrated.apply(deltaSeconds, mult);
        let statsChanged = false;
        STAT_KEYS.forEach(k => {
            const base = statDeltas[k] * deltaSeconds * mult * STAT_XP_GAIN_MULTIPLIER;
            const delta = typeof BonusEngine !== 'undefined' ?
                BonusEngine.applyStat(base, k) : base;
            const beforeLevel = State.stats[k].level;
            const beforeExp = State.stats[k].exp;
            StatSystem.add(State.stats[k], delta);
            if (State.stats[k].level !== beforeLevel || State.stats[k].exp !== beforeExp || delta !== 0) {
                statsChanged = true;
            }
        });
        AgeSystem.addDays(ageDelta * deltaSeconds * mult);
        for (const id in expDeltas) {
            gainExp(actions[id], expDeltas[id] * deltaSeconds * mult);
        }
        State.adventureSlots.forEach((slot, i) => {
            if (!slot.active || !slot.encounter) return;
            slot.progress += encounterProgressDeltas[i] * deltaSeconds * mult;
        });
        if (typeof PubSub !== 'undefined') {
            if (statsChanged) PubSub.publish('stats:updated');
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { DeltaEngine, statDeltas, resourceDeltas, encounterProgressDeltas };
}
