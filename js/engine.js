// Core game engine and tick handlers
const AgeSystem = {
    daysPerYear: 365,
    tick(delta) {
        State.age.days += State.time * delta;
        if (State.age.days >= this.daysPerYear) {
            State.age.years += Math.floor(State.age.days / this.daysPerYear);
            State.age.days = State.age.days % this.daysPerYear;
        }
    }
};

const AdventureEngine = {
    activeIndex: null,
    waitResource: null,
    startSlot(i = 0) {
        if (this.waitResource) {
            const res = State.resources[this.waitResource];
            if (res && res.value < ResourceSystem.max(res)) {
                this.activeIndex = null;
                return;
            }
            this.waitResource = null;
        }
        const encounter = EncounterGenerator.randomEncounter();
        const slot = State.adventureSlots[i];
        slot.encounter = encounter;
        slot.duration = encounter ? encounter.getDuration() : 1;
        slot.progress = 0;
        slot.active = true;
        this.activeIndex = i;
        if (typeof updateAdventureSlotUI === 'function') {
            updateAdventureSlotUI(i);
        }
    },
    tick(delta) {
        if (this.activeIndex === null) {
            if (State.healerGoneSeen) this.startSlot(0);
            return;
        }
        const slot = State.adventureSlots[this.activeIndex];
        if (!slot.encounter) return;
        const cost = slot.encounter.getResourceCost();
        const missing = canAfford(cost, delta);
        if (missing) {
            retreat(missing);
            return;
        }
        slot.progress += delta / slot.duration;
        if (slot.progress >= 1) {
            EncounterGenerator.resolve(slot.encounter);
            slot.active = false;
            slot.encounter = null;
            slot.progress = 0;
            State.encounterStreak += 1;
            if (typeof updateAdventureSlotUI === 'function') {
                updateAdventureSlotUI(this.activeIndex);
            }
            if (State.encounterStreak >= 10) {
                if (State.autoProgress) {
                    EncounterGenerator.incrementLevel();
                    State.encounterStreak = 0;
                } else {
                    State.encounterStreak = 10;
                }
            }
            this.startSlot(this.activeIndex);
        } else {
            if (typeof updateAdventureSlotUI === 'function') {
                updateAdventureSlotUI(this.activeIndex);
            }
        }
        checkHealth();
    }
};

function updateDeltas() {
    STAT_KEYS.forEach(k => { statDeltas[k] = 0; });
    RESOURCE_KEYS.forEach(k => { resourceDeltas[k] = 0; });

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

    State.adventureSlots.forEach(slot => {
        if (!slot.active || !slot.encounter) return;
        const cost = slot.encounter.getResourceCost();
        for (const r in cost) {
            const rate = cost[r];
            resourceDeltas[r] = (resourceDeltas[r] || 0) - rate;
        }
    });
}

function applyDeltas(deltaSeconds) {
    STAT_KEYS.forEach(k => {
        State.stats[k] = (State.stats[k] || 0) + statDeltas[k] * deltaSeconds;
    });
    RESOURCE_KEYS.forEach(k => {
        const change = resourceDeltas[k] * deltaSeconds;
        if (change >= 0) {
            ResourceSystem.add(State.resources[k], change);
        } else {
            ResourceSystem.consume(State.resources[k], -change);
        }
    });
}

function retreat(resourceName) {
    const slot = AdventureEngine.activeIndex !== null ?
        State.adventureSlots[AdventureEngine.activeIndex] : null;
    const enc = slot && slot.encounter ? slot.encounter.name : 'an encounter';
    Log.add(`You had to retreat after ${enc} because you ran out of ${resourceName}.`);
    AdventureEngine.waitResource = resourceName;
    EncounterGenerator.decrementLevel();
    EncounterGenerator.resetProgress();
}

function checkHealth() {
    if (State.resources.health.value < 0.1) {
        retreat('health');
    }
}

const ActionEngine = {
    start(slotIndex, actionId) {
        const slot = State.slots[slotIndex];
        slot.actionId = actionId;
        slot.progress = 0;
        slot.blocked = false;
        slot.text = actions[actionId] ? actions[actionId].name : '';
        if (typeof updateSlotUI === 'function') {
            updateSlotUI(slotIndex);
        }
    },
    tick(delta) {
        AgeSystem.tick(delta);
        updateDeltas();
        applyDeltas(delta);
        State.slots.forEach((slot, i) => {
            if (!slot.actionId) return;
            const action = actions[slot.actionId];
            const mult = scalingMultiplier(action);
            gainExp(action, action.baseYield.exp * mult * delta);
            slot.progress = action.exp / action.expToNext;
            if (typeof updateSlotUI === 'function') {
                updateSlotUI(i);
            }
        });
        checkStoryEvents();
        SoftCapSystem.apply();
        checkHealth();
        SaveSystem.save();
    }
};

const GameEngine = {
    start() {
        setInterval(() => {
            ActionEngine.tick(LOGIC_TICK_MS / 1000);
            AdventureEngine.tick(LOGIC_TICK_MS / 1000);
        }, LOGIC_TICK_MS);
        setInterval(() => {
            if (typeof updateTaskList === 'function') updateTaskList();
            if (typeof updateUI === 'function') updateUI();
        }, UI_UPDATE_MS);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { AgeSystem, AdventureEngine, ActionEngine, GameEngine, updateDeltas, applyDeltas };
}
