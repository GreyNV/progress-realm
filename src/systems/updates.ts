import type { ContentRegistryData } from "../content/registry";
import { getLegacyRuntime } from "./runtime";

function buildUpdate(data: any) {
    return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        image: data.image || null,
        duration: data.duration || 1,
        resourceConsumption: data.resourceConsumption || {},
        state: data.state || "locked",
        bonus: data.bonus || {},
        unlocks: data.unlocks || { actions: [], encounters: [] },
        replaceEncounters: data.replaceEncounters || null,
        progress: 0
    };
}

export function createUpdateSystem(registry: ContentRegistryData) {
    return {
        updates: [] as any[],
        slots: [] as any[],
        slotCount: 1,
        async load() {
            this.updates = registry.updates.map((item) => buildUpdate(item));
        },
        init() {
            while (this.slots.length < this.slotCount) {
                this.slots.push({ updateId: null, progress: 0, active: false });
            }
            getLegacyRuntime().PubSub?.publish("updates:changed");
        },
        start(index: number, id: string) {
            const runtime = getLegacyRuntime();
            const slot = this.slots[index];
            const update = this.updates.find((entry) => entry.id === id && entry.state === "available");
            const inventory = (globalThis as any).Inventory;
            if (!slot || !update || !inventory?.canAfford(update.resourceConsumption)) {
                return;
            }
            inventory.consumeCost(update.resourceConsumption);
            slot.updateId = id;
            slot.progress = 0;
            slot.active = true;
            update.state = "inProgress";
            runtime.PubSub?.publish("updates:changed");
        },
        updateListUI() {},
        updateSlotUI() {},
        tick(delta: number) {
            const runtime = getLegacyRuntime();
            this.slots.forEach((slot) => {
                if (!slot.active) {
                    return;
                }
                const update = this.updates.find((entry) => entry.id === slot.updateId);
                if (!update) {
                    return;
                }
                slot.progress += delta / update.duration;
                runtime.PubSub?.publish("updates:changed");
                if (slot.progress >= 1) {
                    slot.active = false;
                    slot.updateId = null;
                    slot.progress = 0;
                    update.state = "done";
                    this.applyUpdate(update);
                    runtime.PubSub?.publish("updates:changed");
                }
            });
        },
        applyUpdate(update: any) {
            const runtime = getLegacyRuntime();
            if (update.bonus?.stats && runtime.BonusEngine) {
                Object.entries(update.bonus.stats).forEach(([key, value]) => {
                    runtime.BonusEngine!.statAdditions[key] = (runtime.BonusEngine!.statAdditions[key] || 0) + Number(value);
                });
            }
            if (update.unlocks?.actions) {
                update.unlocks.actions.forEach((id: string) => {
                    if (runtime.actions?.[id]) {
                        runtime.actions[id].locked = false;
                        runtime.PubSub?.publish("unlock:action", id);
                    }
                });
            }
            if (update.unlocks?.tabs) {
                update.unlocks.tabs.forEach((id: string) => {
                    runtime.TabManager?.unlockTab(id);
                    runtime.PubSub?.publish("unlock:tab", id);
                });
            }
            if (update.unlocks?.storyEvents) {
                update.unlocks.storyEvents.forEach((id: string) => runtime.StorySystem?.trigger(id));
            }
            if (update.replaceEncounters && runtime.EncounterGenerator) {
                Object.entries(update.replaceEncounters).forEach(([oldId, newId]) => {
                    const oldEncounter = runtime.EncounterGenerator!.encounters.find((entry: any) => entry.id === oldId);
                    const newEncounter = runtime.EncounterGenerator!.encounters.find((entry: any) => entry.id === newId);
                    if (oldEncounter) {
                        oldEncounter.locked = true;
                        runtime.PubSub?.publish("lock:encounter", oldId);
                    }
                    if (newEncounter) {
                        newEncounter.locked = false;
                        runtime.PubSub?.publish("unlock:encounter", newId);
                    }
                });
            }
        }
    };
}
