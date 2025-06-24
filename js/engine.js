const statDeltas = { strength: 0, intelligence: 0, creativity: 0 };
const resourceDeltas = { energy: 0, focus: 0, health: 0, money: 0 };

const DeltaEngine = {
    calculate() {
        // reset deltas
        STAT_KEYS.forEach(k => { statDeltas[k] = 0; });
        RESOURCE_KEYS.forEach(k => { resourceDeltas[k] = 0; });

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
        });

        // contributions from active encounters
        State.adventureSlots.forEach(slot => {
            if (!slot.active || !slot.encounter) return;
            const cost = slot.encounter.getResourceCost();
            for (const r in cost) {
                const rate = cost[r];
                resourceDeltas[r] = (resourceDeltas[r] || 0) - rate;
            }
        });
    },

    apply(deltaSeconds, mult = 1) {
        STAT_KEYS.forEach(k => {
            State.stats[k] = (State.stats[k] || 0) + statDeltas[k] * deltaSeconds * mult;
        });
        RESOURCE_KEYS.forEach(k => {
            const change = resourceDeltas[k] * deltaSeconds * mult;
            if (change >= 0) {
                ResourceSystem.add(State.resources[k], change);
            } else {
                ResourceSystem.consume(State.resources[k], -change);
            }
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { DeltaEngine, statDeltas, resourceDeltas };
}
