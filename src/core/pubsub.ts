function getScope(): any {
    return globalThis as any;
}

export const PubSub = {
    _events: {} as Record<string, Function[]>,
    subscribe(name: string, handler: Function) {
        if (!this._events[name]) this._events[name] = [];
        this._events[name].push(handler);
    },
    publish(name: string, data?: unknown) {
        const handlers = this._events[name];
        if (!handlers) return;
        handlers.slice().forEach((handler) => {
            try { handler(data); } catch (error) { console.error("PubSub handler error", error); }
        });
    },
    unsubscribe(name: string, handler: Function) {
        const handlers = this._events[name];
        if (!handlers) return;
        const index = handlers.indexOf(handler);
        if (index !== -1) handlers.splice(index, 1);
    }
};

export function initPubSub() {
    const scope = getScope();
    PubSub.subscribe("modal:open", (id: string) => { PubSub.publish("ui:modalOpen", id); });
    PubSub.subscribe("modal:close", (id: string) => { PubSub.publish("ui:modalClose", id); });
    PubSub.subscribe("unlock:tab", (id: string) => scope.TabManager.unlockTab(id));
    PubSub.subscribe("unlock:action", (id: string) => {
        if (scope.actions[id]) {
            scope.actions[id].locked = false;
            scope.actions[id].hidden = false;
            scope.updateTaskList();
        }
    });
    PubSub.subscribe("lock:action", (id: string) => {
        if (scope.actions[id]) {
            scope.actions[id].hidden = true;
            scope.actions[id].locked = true;
            if (scope.selectedActionId === id) scope.selectedActionId = null;
            scope.updateTaskList();
            scope.State.slots.forEach((slot: any, index: number) => {
                if (slot.actionId === id) {
                    slot.actionId = scope.State.defaultActionId;
                    slot.progress = 0;
                    slot.text = "";
                    scope.updateSlotUI?.(index);
                }
            });
        }
    });
    PubSub.subscribe("unlock:encounter", (id: string) => { const enc = scope.EncounterGenerator.encounters.find((entry: any) => entry.id === id); if (enc) enc.locked = false; });
    PubSub.subscribe("lock:encounter", (id: string) => { const enc = scope.EncounterGenerator.encounters.find((entry: any) => entry.id === id); if (enc) enc.locked = true; });
    PubSub.subscribe("age:maxReached", () => {
        if (!scope.State.prestiging) {
            scope.setState("prestiging", true);
            scope.SaveSystem.prestige();
        }
    });
}

export function installPubSubGlobals() {
    const scope = getScope();
    scope.PubSub = PubSub;
    scope.initPubSub = initPubSub;
}
