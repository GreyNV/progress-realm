// Core engine driving action progression

const ActionEngine = {
    start(slotIndex, actionId) {
        if (typeof AdventureEngine !== 'undefined' && AdventureEngine.active) {
            AdventureEngine.cancel();
        }
        const slot = State.slots[slotIndex];
        const action = actions[actionId];
        if (!action) return;
        let canStart = true;
        if (action.resourceCost) {
            for (const r in action.resourceCost) {
                const res = State.resources[r];
                if (!res || res.value < action.resourceCost[r]) {
                    canStart = false;
                    break;
                }
            }
        }
        if (!canStart) {
            slot.actionId = State.defaultActionId;
            slot.blocked = false;
            slot.progress = actions[State.defaultActionId].progress || 0;
            slot.text = actions[State.defaultActionId] ? actions[State.defaultActionId].name : '';
            updateSlotUI(slotIndex);
            return;
        }
        if (action.resourceCost) {
            for (const r in action.resourceCost) {
                ResourceSystem.consume(State.resources[r], action.resourceCost[r]);
            }
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('resources:updated');
            }
        }
        slot.actionId = actionId;
        slot.progress = action.progress || 0;
        slot.blocked = false;
        slot.text = action.name;
        updateSlotUI(slotIndex);
    },
    tick(delta) {
        DeltaEngine.calculate();
        DeltaEngine.apply(delta, State.time);
        State.slots.forEach((slot, i) => {
            if (!slot.actionId || slot.blocked) return;
            if (typeof FurnitureSystem !== 'undefined' && FurnitureSystem.use) {
                FurnitureSystem.use(slot.actionId, delta * State.time);
                if (!slot.actionId) return; // action may be locked and removed
            }
            const action = actions[slot.actionId];
            if (!action) return;
            if (action.resourceConsumption) {
                const missing = canAfford(action.resourceConsumption, delta);
                if (missing) {
                    slot.actionId = State.defaultActionId;
                    slot.blocked = false;
                    slot.progress = actions[State.defaultActionId].progress || 0;
                    slot.text = actions[State.defaultActionId] ? actions[State.defaultActionId].name : '';
                    updateSlotUI(i);
                    return;
                }
                for (const r in action.resourceConsumption) {
                    const amt = action.resourceConsumption[r] * State.time * delta;
                    ResourceSystem.consume(State.resources[r], amt);
                }
                if (typeof PubSub !== 'undefined') {
                    PubSub.publish('resources:updated');
                }
            }
            slot.progress = (slot.progress || 0) + delta * State.time;
            while (slot.progress >= 1) {
                const mult = scalingMultiplier(action);
                if (action.baseYield) {
                    applyYield(action.baseYield, mult, 1, false);
                }
                if (action.baseYield && action.baseYield.exp) {
                    gainExp(action, action.baseYield.exp * mult);
                }
                slot.progress -= 1;
                // deduct start cost for next cycle
                if (action.resourceCost) {
                    let canRun = true;
                    for (const r in action.resourceCost) {
                        const res = State.resources[r];
                        if (!res || res.value < action.resourceCost[r]) {
                            canRun = false;
                            break;
                        }
                    }
                    if (!canRun) {
                        slot.actionId = State.defaultActionId;
                        slot.blocked = false;
                        slot.progress = actions[State.defaultActionId].progress || 0;
                        slot.text = actions[State.defaultActionId] ? actions[State.defaultActionId].name : '';
                        updateSlotUI(i);
                        return;
                    }
                    for (const r in action.resourceCost) {
                        ResourceSystem.consume(State.resources[r], action.resourceCost[r]);
                    }
                    if (typeof PubSub !== 'undefined') {
                        PubSub.publish('resources:updated');
                    }
                }
            }
            action.progress = slot.progress;
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
