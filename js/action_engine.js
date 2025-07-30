// Core engine driving action progression

const ActionEngine = {
    start(slotIndex, actionId) {
        const slot = State.slots[slotIndex];
        const action = actions[actionId];
        if (!action) return;
        slot.blocked = false;
        if (action.activationCost) {
            const missing = canAfford(action.activationCost, 1, 1);
            if (missing) {
                slot.blocked = true;
                slot.progress = 0;
                slot.text = `${Lang.resource(missing) || missing} required`;
                updateSlotUI(slotIndex);
                return;
            }
            for (const r in action.activationCost) {
                ResourceSystem.consume(State.resources[r], action.activationCost[r]);
            }
            if (typeof PubSub !== 'undefined') PubSub.publish('resources:updated');
        }
        slot.actionId = actionId;
        slot.progress = action.exp / action.expToNext;
        slot.text = action.name;
        updateSlotUI(slotIndex);
    },
    tick(delta) {
        DeltaEngine.calculate();
        DeltaEngine.apply(delta, State.time);
        State.slots.forEach((slot, i) => {
            if (!slot.actionId) return;
            if (typeof FurnitureSystem !== 'undefined' && FurnitureSystem.use) {
                FurnitureSystem.use(slot.actionId, delta * State.time);
                if (!slot.actionId) return; // action may be locked and removed
            }
            const action = actions[slot.actionId];
            if (!action) return;
            slot.progress = action.exp / action.expToNext;
            updateSlotUI(i);
        });
        SoftCapSystem.apply();
        checkHealth();
        SaveSystem.save();
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ActionEngine };
}
