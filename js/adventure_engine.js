// AdventureEngine handles encounter slots and retreat logic

let queueResourceHelpers = null;
if (typeof module !== 'undefined' && module.exports) {
    try {
        queueResourceHelpers = require('./resource_queue_helpers.js');
    } catch (err) {
        queueResourceHelpers = null;
    }
}

const AdventureEngine = {
    activeIndex: null,
    active: false,
    start() {
        if (this.active) return;
        this.active = true;
        EncounterGenerator.level = 1;
        setState('encounterLevel', 1);
        if (typeof EncounterGenerator.updateName === 'function') {
            EncounterGenerator.updateName();
        }
        if (typeof EncounterGenerator.updateProgressBar === 'function') {
            EncounterGenerator.updateProgressBar();
        }
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
            if (Array.isArray(State.slots)) {
                State.slots.forEach(s => { if (s) s.queue = null; });
            }
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
                const actionSlot = Array.isArray(State.slots) ? State.slots[i] : null;
                const queue = slot.queue;
                if (!queue) continue;

                if (queue && actionSlot && actionSlot.queue !== queue) {
                    actionSlot.queue = queue;
                }

                if (queue.restart) {
                    const resources = Array.isArray(queue.resources) ? queue.resources : [];
                    const ready = resources.length === 0 || resources.every(r => resourceAtQueueThreshold(r));
                    if (ready) {
                        slot.queue = null;
                        if (actionSlot) {
                            actionSlot.queue = null;
                        }
                        if (typeof updateSlotUI === 'function') {
                            updateSlotUI(i);
                        }
                        this.start();
                    }
                    break;
                }

                if (queue.encounter) {
                    const cost = typeof queue.encounter.getResourceCost === 'function' ?
                        queue.encounter.getResourceCost() || {} : {};
                    const costKeys = Object.keys(cost);
                    const ready = costKeys.length === 0 || costKeys.every(r => {
                        const rawCost = cost[r];
                        const numericCost = Number(rawCost);
                        const threshold = Number.isNaN(numericCost) ? undefined : numericCost;
                        return resourceAtQueueThreshold(r, threshold);
                    });
                    if (ready) {
                        slot.encounter = queue.encounter;
                        slot.progress = typeof queue.progress === 'number' ? queue.progress : 0;
                        slot.duration = slot.encounter.getDuration();
                        slot.queue = null;
                        if (actionSlot) {
                            actionSlot.queue = null;
                        }
                        if (typeof updateSlotUI === 'function') {
                            updateSlotUI(i);
                        }
                        slot.active = true;
                        this.active = true;
                        this.activeIndex = i;
                        if (typeof updateAdventureSlotUI === 'function') {
                            updateAdventureSlotUI(i);
                        } else if (typeof updateSlotUI === 'function') {
                            updateSlotUI(i);
                        }
                    }
                    break;
                }

                break;
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
    if (State.showEncounterLog) Log.add(msg);
    if (!manual && slot) {
        const queue = { restart: true };
        const resources = new Set();
        if (slot.encounter && typeof slot.encounter.getResourceCost === 'function') {
            Object.keys(slot.encounter.getResourceCost() || {}).forEach(r => resources.add(r));
        }
        if (resourceName) resources.add(resourceName);
        if (resources.size) {
            queue.resources = Array.from(resources);
        }
        if (slot.encounter) {
            queue.encounter = slot.encounter;
        }
        queue.progress = typeof slot.progress === 'number' ? slot.progress : 0;
        slot.queue = queue;
        if (
            Array.isArray(State.slots) &&
            AdventureEngine.activeIndex !== null &&
            State.slots[AdventureEngine.activeIndex]
        ) {
            State.slots[AdventureEngine.activeIndex].queue = queue;
        }
    }
    EncounterGenerator.decrementLevel();
    EncounterGenerator.resetProgress();
    AdventureEngine.cancel(manual);
}

function checkHealth() {
    const names = ['health', 'energy', 'focus'];
    for (const name of names) {
        const res = State.resources && State.resources[name];
        if (res && res.value <= 0) {
            retreat(name);
        }
    }
}

function resolveQueueResourceCap(name) {
    const helper = queueResourceHelpers ||
        (typeof QueueResourceHelper !== 'undefined' ? QueueResourceHelper : null);
    if (helper && typeof helper.resolveQueueResourceCap === 'function') {
        return helper.resolveQueueResourceCap(name);
    }
    return undefined;
}

function resourceAtQueueThreshold(name, explicitThreshold) {
    const helper = queueResourceHelpers ||
        (typeof QueueResourceHelper !== 'undefined' ? QueueResourceHelper : null);
    if (helper && typeof helper.resourceAtQueueThreshold === 'function') {
        return helper.resourceAtQueueThreshold(name, explicitThreshold);
    }
    return false;
}

if (typeof module !== 'undefined') {
    module.exports = { AdventureEngine, retreat, checkHealth };
}
