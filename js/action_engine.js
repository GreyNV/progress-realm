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
            // require all cost resources to be at their maximum before starting
            for (const r in action.resourceCost) {
                const res = State.resources[r];
                if (!res || res.value !== ResourceSystem.max(res)) {
                    canStart = false;
                    break;
                }
            }
        }
        if (!canStart) {
            slot.queue = { id: actionId, progress: 0, costPaid: false };
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
            if (slot.blocked) return;
            if (slot.actionId === State.defaultActionId && slot.queue && slot.queue.id) {
                const qAction = actions[slot.queue.id];
                let canResume = true;
                if (qAction.resourceCost && !slot.queue.costPaid) {
                    // resume only when cost resources are fully replenished
                    for (const r in qAction.resourceCost) {
                        const res = State.resources[r];
                        if (!res || res.value !== ResourceSystem.max(res)) {
                            canResume = false;
                            break;
                        }
                    }
                }
                if (canResume && qAction.resourceConsumption) {
                    // consumption resources must also be at maximum before resuming
                    for (const r in qAction.resourceConsumption) {
                        const res = State.resources[r];
                        if (!res || res.value !== ResourceSystem.max(res)) {
                            canResume = false;
                            break;
                        }
                    }
                }
                if (canResume) {
                    if (!slot.queue.costPaid && qAction.resourceCost) {
                        for (const r in qAction.resourceCost) {
                            ResourceSystem.consume(State.resources[r], qAction.resourceCost[r]);
                        }
                        if (typeof PubSub !== 'undefined') {
                            PubSub.publish('resources:updated');
                        }
                    }
                    slot.actionId = slot.queue.id;
                    slot.progress = slot.queue.progress;
                    slot.text = qAction.name;
                    slot.queue = null;
                }
            }
            if (!slot.actionId) return;
            if (typeof FurnitureSystem !== 'undefined' && FurnitureSystem.use) {
                FurnitureSystem.use(slot.actionId, delta * State.time);
                if (!slot.actionId) return; // action may be locked and removed
            }
            const action = actions[slot.actionId];
            if (!action) return;
            if (action.resourceConsumption) {
                const missing = canAfford(action.resourceConsumption, delta);
                if (missing) {
                    slot.queue = { id: slot.actionId, progress: slot.progress, costPaid: true };
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
                    // next cycle only begins when cost resources are back at max
                    for (const r in action.resourceCost) {
                        const res = State.resources[r];
                        if (!res || res.value !== ResourceSystem.max(res)) {
                            canRun = false;
                            break;
                        }
                    }
                    if (!canRun) {
                        slot.queue = { id: slot.actionId, progress: slot.progress, costPaid: false };
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
