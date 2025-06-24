const statDeltas = { strength: 0, intelligence: 0, creativity: 0 };
const resourceDeltas = { energy: 0, focus: 0, health: 0, money: 0 };
let ageDelta = 0;
const expDeltas = {};
const encounterProgressDeltas = [];

const DeltaEngine = {
    calculate() {
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
            const mult = scalingMultiplier(action);

            if (action.baseYield.stats) {
                for (const s in action.baseYield.stats) {
                    statDeltas[s] = (statDeltas[s] || 0) +
                        action.baseYield.stats[s] * mult;
                }
            }

            if (action.baseYield.resources) {
                for (const r in action.baseYield.resources) {
                    const rate = action.baseYield.resources[r] * mult;
                    resourceDeltas[r] = (resourceDeltas[r] || 0) + rate;
                }
            }

            if (action.resourceConsumption) {
                for (const r in action.resourceConsumption) {
                    const rate = action.resourceConsumption[r] * mult;
                    resourceDeltas[r] = (resourceDeltas[r] || 0) - rate;
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
            const cost = slot.encounter.getResourceCost();
            for (const r in cost) {
                const rate = cost[r];
                resourceDeltas[r] = (resourceDeltas[r] || 0) - rate;
            }
            encounterProgressDeltas[i] = 1 / slot.duration;
        });
    },

    apply(deltaSeconds, mult = 1) {
        STAT_KEYS.forEach(k => {
            const base = statDeltas[k] * deltaSeconds * mult;
            const delta = typeof BonusEngine !== 'undefined' ?
                BonusEngine.applyStat(base, k) : base;
            State.stats[k] = (State.stats[k] || 0) + delta;
        });
        RESOURCE_KEYS.forEach(k => {
            const base = resourceDeltas[k] * deltaSeconds * mult;
            const change = typeof BonusEngine !== 'undefined' ?
                BonusEngine.applyResource(base, k) : base;
            if (change >= 0) {
                ResourceSystem.add(State.resources[k], change);
            } else {
                ResourceSystem.consume(State.resources[k], -change);
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
    }
};

if (typeof module !== 'undefined') {
    module.exports = { DeltaEngine, statDeltas, resourceDeltas, encounterProgressDeltas };
}
