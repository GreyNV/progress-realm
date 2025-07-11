// Core engine driving action progression

const ActionEngine = {
    start(slotIndex, actionId) {
        const slot = State.slots[slotIndex];
        slot.actionId = actionId;
        slot.progress = 0;
        slot.blocked = false;
        slot.text = actions[actionId] ? actions[actionId].name : '';
        updateSlotUI(slotIndex);
    },
    tick(delta) {
        DeltaEngine.calculate();
        DeltaEngine.apply(delta, State.time);
        State.slots.forEach((slot, i) => {
            if (!slot.actionId) return;
            if (typeof FurnitureSystem !== 'undefined' && FurnitureSystem.use) {
                FurnitureSystem.use(slot.actionId, delta * State.time);
            }
            const action = actions[slot.actionId];
            slot.progress = action.exp / action.expToNext;
            updateSlotUI(i);
        });
        StorySystem.check();
        SoftCapSystem.apply();
        checkHealth();
        SaveSystem.save();
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ActionEngine };
}
