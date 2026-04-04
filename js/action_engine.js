// Legacy compatibility module for Node-based tests.
// The live browser runtime uses the typed action engine from `src/systems`.

function clearQueuedAction(slot) {
    slot.queue = null;
    slot.queuedActionId = null;
}

const ActionEngine = {
    start(slotIndex, actionId, options = {}) {
        const slot = State.slots[slotIndex];
        const action = actions[actionId];
        if (!slot || !action) return;

        updateState(['actionAssignments', actionId], count => (count || 0) + 1);
        slot.blocked = false;
        clearQueuedAction(slot);
        slot.actionId = actionId;
        slot.progress = typeof options.resumeProgress === 'number'
            ? options.resumeProgress
            : action.exp / action.expToNext;
        slot.text = action.name;

        if (typeof updateSlotUI === 'function') {
            updateSlotUI(slotIndex);
        }
    },

    tick(delta) {
        DeltaEngine.calculate();
        DeltaEngine.apply(delta, State.time);

        State.slots.forEach((slot, index) => {
            if (!slot.actionId) return;

            if (typeof FurnitureSystem !== 'undefined' && FurnitureSystem.use) {
                FurnitureSystem.use(slot.actionId, delta * State.time);
                if (!slot.actionId) return;
            }

            const action = actions[slot.actionId];
            if (!action) return;

            updateState(['actionRuntime', action.id], seconds => (seconds || 0) + (delta * State.time));
            slot.progress = action.exp / action.expToNext;

            if (typeof updateSlotUI === 'function') {
                updateSlotUI(index);
            }
        });

        if (typeof SoftCapSystem !== 'undefined' && SoftCapSystem.apply) {
            SoftCapSystem.apply();
        }
        if (typeof SaveSystem !== 'undefined' && SaveSystem.save) {
            SaveSystem.save();
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ActionEngine };
}
