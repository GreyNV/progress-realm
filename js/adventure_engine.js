// AdventureEngine handles encounter slots and retreat logic

const AdventureEngine = {
    activeIndex: null,
    waitResource: null,
    recovering: false,
    startSlot(i = 0) {
        if (this.recovering) {
            const rec = EncounterGenerator.getRecoverEncounter();
            if (rec) {
                const slot = State.adventureSlots[i];
                slot.encounter = rec;
                slot.duration = rec.getDuration();
                slot.progress = 0;
                slot.active = true;
                this.activeIndex = i;
                this.recovering = false;
                updateAdventureSlotUI(i);
                return;
            }
        }
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
        updateAdventureSlotUI(i);
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
        if (slot.progress >= 1) {
            const completedId = slot.encounter.id;
            EncounterGenerator.resolve(slot.encounter);
            slot.active = false;
            slot.encounter = null;
            slot.progress = 0;
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('encounter:complete', completedId);
            }
            updateState('encounterStreak', s => s + 1);
            EncounterGenerator.updateProgressBar();
            updateAdventureSlotUI(this.activeIndex);
            if (State.encounterStreak >= 10) {
                if (State.autoProgress) {
                    EncounterGenerator.incrementLevel();
                    setState('encounterStreak', 0);
                    EncounterGenerator.updateProgressBar();
                } else {
                    setState('encounterStreak', 10);
                    EncounterGenerator.updateProgressBar();
                }
            }
            this.startSlot(this.activeIndex);
        } else {
            updateAdventureSlotUI(this.activeIndex);
        }
        checkHealth();
    }
};

function retreat(resourceName, manual = false) {
    const slot = AdventureEngine.activeIndex !== null ?
        State.adventureSlots[AdventureEngine.activeIndex] : null;
    const enc = slot && slot.encounter ? slot.encounter.name : 'an encounter';
    const resLabel = Lang.resource(resourceName) || resourceName;
    const msg = Lang.log('retreat', { encounter: enc, resource: resLabel }) ||
        `You had to retreat after ${enc} because you ran out of ${resLabel}.`;
    Log.add(msg);
    AdventureEngine.waitResource = resourceName;
    if (!manual) AdventureEngine.recovering = true;
    EncounterGenerator.decrementLevel();
    EncounterGenerator.resetProgress();
}

function checkHealth() {
    if (State.resources.health.value < 0.1) {
        retreat('health');
    }
}

if (typeof module !== 'undefined') {
    module.exports = { AdventureEngine, retreat, checkHealth };
}
