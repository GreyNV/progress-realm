import type { ContentRegistryData } from "../content/registry";
import { getLegacyRuntime } from "./runtime";

const DURABILITY_USE_RATE = 0.1;

function buildHome(data: any) {
    return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        image: data.image || null,
        rarity: data.rarity || "common",
        default: data.default || false,
        furnitureSlots: data.furnitureSlots || 0,
        cost: data.cost || {},
        adventureBonuses: data.adventureBonuses || {}
    };
}

function buildFurniture(data: any) {
    return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        image: data.image || null,
        cost: data.cost || {},
        durability: data.durability || 1,
        unlocks: data.unlocks || [],
        adventureBonuses: data.adventureBonuses || {}
    };
}

export function createDwellingSystems(registry: ContentRegistryData) {
    return {
        homeSystem: {
            homes: [] as any[],
            async load() {
                this.homes = registry.homes.map((home) => buildHome(home));
                const runtime = getLegacyRuntime();
                const defaultHome = this.homes.find((home) => home.default);
                if (!runtime.State.homeId && defaultHome) {
                    runtime.setState("homeId", defaultHome.id);
                    if (!Array.isArray(runtime.State.homesOwned)) {
                        runtime.setState("homesOwned", []);
                    }
                    if (!runtime.State.homesOwned.includes(defaultHome.id)) {
                        runtime.pushState("homesOwned", defaultHome.id);
                    }
                    runtime.SaveSystem?.save();
                }
            },
            setHome(id: string) {
                const runtime = getLegacyRuntime();
                const home = this.homes.find((entry) => entry.id === id);
                if (!home) {
                    return;
                }
                const inventory = (globalThis as any).Inventory;
                const owned = Array.isArray(runtime.State.homesOwned) && runtime.State.homesOwned.includes(id);
                if (!owned) {
                    if (!inventory?.canAfford(home.cost)) {
                        return;
                    }
                    inventory.consumeCost(home.cost);
                    if (!Array.isArray(runtime.State.homesOwned)) {
                        runtime.setState("homesOwned", []);
                    }
                    runtime.pushState("homesOwned", id);
                }
                runtime.setState("homeId", id);
                runtime.SaveSystem?.save();
                runtime.PubSub?.publish("home:changed", id);
            }
        },
        furnitureSystem: {
            furniture: [] as any[],
            async load() {
                this.furniture = registry.furniture.map((item) => buildFurniture(item));
            },
            purchase(id: string) {
                const runtime = getLegacyRuntime();
                const item = this.furniture.find((entry) => entry.id === id);
                if (!item) {
                    return;
                }
                const homeSystem = (globalThis as any).HomeSystem;
                const inventory = (globalThis as any).Inventory;
                const home = homeSystem?.homes.find((entry: any) => entry.id === runtime.State.homeId);
                const limit = home ? home.furnitureSlots : 0;
                const existing = runtime.State.furniture.find((entry: any) => entry.id === id);
                if (existing) {
                    const missing = item.durability - existing.durability;
                    if (missing <= 0) {
                        return;
                    }
                    const cost: Record<string, number> = {};
                    const ratio = missing / item.durability;
                    Object.entries(item.cost).forEach(([key, value]) => {
                        cost[key] = Math.ceil(Number(value) * ratio);
                    });
                    if (!inventory?.canAfford(cost)) {
                        return;
                    }
                    inventory.consumeCost(cost);
                    existing.durability = item.durability;
                    runtime.PubSub?.publish("furniture:durabilityChanged");
                    runtime.PubSub?.publish("furniture:updated");
                    runtime.SaveSystem?.save();
                    return;
                }
                if (runtime.State.furniture.length >= limit || !inventory?.canAfford(item.cost)) {
                    return;
                }
                inventory.consumeCost(item.cost);
                runtime.pushState(["furniture"], { id: item.id, durability: item.durability });
                item.unlocks.forEach((actionId: string) => runtime.PubSub?.publish("unlock:action", actionId));
                runtime.PubSub?.publish("furniture:updated");
                runtime.SaveSystem?.save();
            },
            use(actionId: string, seconds = 1) {
                const runtime = getLegacyRuntime();
                let changed = false;
                const removedUnlocks: string[] = [];
                const updated = runtime.State.furniture.filter((record: any) => {
                    const definition = this.furniture.find((entry) => entry.id === record.id);
                    if (!definition) {
                        return false;
                    }
                    if (definition.unlocks.includes(actionId)) {
                        record.durability -= seconds * DURABILITY_USE_RATE;
                        if (record.durability < 0) {
                            record.durability = 0;
                        }
                    }
                    if (record.durability > 0) {
                        return true;
                    }
                    changed = true;
                    removedUnlocks.push(...definition.unlocks);
                    return false;
                });
                runtime.setState("furniture", updated);
                runtime.PubSub?.publish("furniture:durabilityChanged");
                if (changed) {
                    removedUnlocks.forEach((actionId) => runtime.PubSub?.publish("lock:action", actionId));
                    runtime.PubSub?.publish("furniture:updated");
                }
            }
        }
    };
}
