// Legacy compatibility module for Node-based tests.
// The live browser runtime uses the typed adventure engine from `src/systems`.

const AdventureEngine = {
    activeIndex: null,

    startSlot(index = 0) {
        const slot = State.adventureSlots[index];
        if (!slot) return;

        let encounter = null;
        if (State.queuedEncounterId) {
            encounter = EncounterGenerator.encounters.find(entry => entry.id === State.queuedEncounterId) || null;
            setState('queuedEncounterId', null);
        } else {
            encounter = EncounterGenerator.randomEncounter();
        }

        slot.encounter = encounter;
        slot.duration = encounter ? encounter.getDuration() : 1;
        slot.progress = 0;
        slot.active = true;
        this.activeIndex = index;

        if (encounter && encounter.combat) {
            CombatEngine.start(encounter);
        }

        if (typeof updateAdventureSlotUI === 'function') {
            updateAdventureSlotUI(index);
        }
    },

    completeEncounter(encounterId) {
        const slot = this.activeIndex !== null ? State.adventureSlots[this.activeIndex] : null;
        if (!slot || !slot.encounter) return;

        const encounter = slot.encounter;
        EncounterGenerator.resolve(encounter);
        slot.active = false;
        slot.encounter = null;
        slot.progress = 0;

        if (typeof PubSub !== 'undefined') {
            PubSub.publish('encounter:complete', encounterId);
        }

        updateState('encounterStreak', streak => streak + 1);
        updateState(['encounterCompletions', encounterId], count => (count || 0) + 1);
        updateState(['adventureCompletions', encounter.dungeon || 'frontier'], count => (count || 0) + 1);

        EncounterGenerator.updateProgressBar();
        if (typeof updateAdventureSlotUI === 'function') {
            updateAdventureSlotUI(this.activeIndex);
        }

        if (State.encounterStreak >= 10) {
            if (State.autoProgress) {
                EncounterGenerator.incrementLevel();
                setState('encounterStreak', 0);
            } else {
                setState('encounterStreak', 10);
            }
            EncounterGenerator.updateProgressBar();
        }

        this.startSlot(this.activeIndex);
    },

    handleCombatOutcome() {
        if (!CombatEngine.isActive()) return;

        if (State.combat.phase === 'victory') {
            const encounterId = CombatEngine.finishVictory();
            this.completeEncounter(encounterId);
            return;
        }

        if (State.combat.phase === 'defeat') {
            CombatEngine.clear();
            retreat('defeat');
        }
    },

    tick(delta) {
        if (CombatEngine.isActive()) {
            CombatEngine.tick(delta);
            this.handleCombatOutcome();
            return;
        }

        if (this.activeIndex === null) {
            const queuedSlot = State.adventureSlots[0];
            if (queuedSlot && queuedSlot.queue && typeof encounterQueueReady === 'function' && encounterQueueReady(queuedSlot.queue)) {
                this.startSlot(0);
                return;
            }
            if (State.healerGoneSeen) {
                this.startSlot(0);
            }
            return;
        }

        const slot = State.adventureSlots[this.activeIndex];
        if (!slot || !slot.encounter) return;

        if (slot.encounter.combat) {
            if (!CombatEngine.isActive()) {
                CombatEngine.start(slot.encounter);
            }
            return;
        }

        if (slot.progress >= 1) {
            this.completeEncounter(slot.encounter.id);
        } else if (typeof updateAdventureSlotUI === 'function') {
            updateAdventureSlotUI(this.activeIndex);
        }
    }
};

function retreat(resourceName, manual = false) {
    void manual;
    const slot = AdventureEngine.activeIndex !== null
        ? State.adventureSlots[AdventureEngine.activeIndex]
        : null;
    const encounterName = slot && slot.encounter ? slot.encounter.name : 'an encounter';
    const resourceLabel = Lang.ui(resourceName) || resourceName;
    const message = Lang.log('retreat', { encounter: encounterName, resource: resourceLabel }) ||
        `You had to retreat after ${encounterName} because you ran out of ${resourceLabel}.`;

    Log.add({ text: message, options: { encounter: true } });

    if (slot && slot.encounter) {
        setState('queuedEncounterId', slot.encounter.id);
        slot.active = false;
        slot.progress = 0;
        slot.encounter = null;
        if (typeof updateAdventureSlotUI === 'function') {
            updateAdventureSlotUI(AdventureEngine.activeIndex);
        }
    }

    CombatEngine.clear();
    EncounterGenerator.decrementLevel();
    EncounterGenerator.resetProgress();
}

function checkHealth() {
    return false;
}

if (typeof module !== 'undefined') {
    module.exports = { AdventureEngine, retreat, checkHealth };
}
