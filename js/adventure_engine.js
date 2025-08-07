// AdventureEngine handles encounter slots and retreat logic

const AdventureEngine = {
    activeIndex: null,
    active: false,
    start() {
        if (this.active) return;
        this.active = true;
        const actionSlot = State.slots[0];
        actionSlot.actionId = null;
        actionSlot.progress = 0;
        actionSlot.text = '';
        // Begin the encounter before refreshing UI so the default action isn't reassigned
        this.startSlot(0);
        updateSlotUI(0);
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('adventure:started');
        }
    },
    cancel(manual = false) {
        if (!this.active && !manual) return;
        this.active = false;
        if (this.activeIndex !== null) {
            const slot = State.adventureSlots[this.activeIndex];
            slot.active = false;
            slot.encounter = null;
            slot.progress = 0;
            updateAdventureSlotUI(this.activeIndex);
        }
        this.activeIndex = null;
        const actionSlot = State.slots[0];
        actionSlot.actionId = State.defaultActionId;
        actionSlot.blocked = false;
        actionSlot.progress = actions[State.defaultActionId].progress || 0;
        actionSlot.text = actions[State.defaultActionId] ? actions[State.defaultActionId].name : '';
        setState(['slots', 0, 'blocked'], false);
        updateSlotUI(0);
        EncounterGenerator.populateSlots();
        if (manual) {
            State.adventureSlots.forEach(s => { s.queue = null; });
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('adventure:stopped');
        }
    },
    startSlot(i = 0) {
        if (!this.active) return;
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
        if (!this.active) {
            for (let i = 0; i < State.adventureSlots.length; i++) {
                const slot = State.adventureSlots[i];
                if (slot.queue) {
                    const cost = slot.queue.encounter.getResourceCost();
                    const ready = Object.keys(cost).every(r => {
                        const res = State.resources[r];
                        return res && res.value >= ResourceSystem.max(res);
                    });
                    if (ready) {
                        slot.encounter = slot.queue.encounter;
                        slot.progress = slot.queue.progress;
                        slot.duration = slot.encounter.getDuration();
                        slot.queue = null;
                        slot.active = true;
                        this.active = true;
                        this.activeIndex = i;
                        updateAdventureSlotUI(i);
                    }
                    break;
                }
            }
            return;
        }
        if (this.activeIndex === null) {
            this.startSlot(0);
            return;
        }
        const slot = State.adventureSlots[this.activeIndex];
        if (!slot.encounter) return;
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
            if (this.active) this.startSlot(this.activeIndex);
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
    EncounterGenerator.decrementLevel();
    EncounterGenerator.resetProgress();
    AdventureEngine.cancel(manual);
}

function checkHealth() {
    if (State.resources.health.value < 0.1) {
        retreat('health');
    }
}

if (typeof module !== 'undefined') {
    module.exports = { AdventureEngine, retreat, checkHealth };
}
