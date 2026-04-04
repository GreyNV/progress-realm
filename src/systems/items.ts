import type { ContentRegistryData } from "../content/registry";
import { getLegacyRuntime } from "./runtime";

export interface RuntimeItem {
    id: string;
    name: string;
    description: string;
    rarity: string;
    type: string;
    slot: string | null;
    combatBonuses: Record<string, unknown>;
    adventureBonuses: Record<string, unknown>;
    weaponProfile: Record<string, unknown> | null;
    shieldProfile: Record<string, unknown> | null;
    effectType?: string;
    effectValue?: Record<string, unknown>;
    image: string | null;
}

function buildRuntimeItem(data: any): RuntimeItem {
    return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        rarity: data.rarity || "common",
        type: data.type || "resource",
        slot: data.slot || null,
        combatBonuses: data.combatBonuses || {},
        adventureBonuses: data.adventureBonuses || {},
        weaponProfile: data.weaponProfile || null,
        shieldProfile: data.shieldProfile || null,
        effectType: data.effectType,
        effectValue: data.effectValue,
        image: data.image || null
    };
}

function getEffectDescription(item: RuntimeItem): string {
    const runtime = getLegacyRuntime();
    if (item.effectType === "increaseSoftcap" && item.effectValue) {
        const key = Object.keys(item.effectValue)[0];
        const resName = runtime.Lang?.stat(key) || runtime.Lang?.resource(key) || key;
        const template = runtime.Lang?.effect("increaseSoftcap") || "Improves {resource} cap";
        return template.replace("{resource}", resName);
    }
    return "";
}

export function createItemSystems(registry: ContentRegistryData) {
    const runtimeItems = registry.items.map(buildRuntimeItem);

    return {
        itemGenerator: {
            itemList: [] as RuntimeItem[],
            rarityTable: {
                common: 0.7,
                rare: 0.2,
                epic: 0.08,
                legendary: 0.02
            },
            generationSources: {
                hunting: ["rabbit_meat", "wolf_pelt"],
                exploring: ["herb"],
                quests: ["herb", "rabbit_meat", "wolf_pelt"]
            },
            async load() {
                this.itemList = runtimeItems.map((item) => ({ ...item }));
            },
            generateItem(context: string) {
                const runtime = getLegacyRuntime();
                const pool = this.itemList.filter((item) => {
                    const sources = this.generationSources[context as keyof typeof this.generationSources];
                    return !sources || sources.includes(item.id);
                });
                if (!pool.length || !runtime.Utils) {
                    return null;
                }
                const weights = pool.map((item) => this.rarityTable[item.rarity as keyof typeof this.rarityTable] || 1);
                return runtime.Utils.weightedRandomChoice(pool, weights);
            },
            adjustDropRates(progress: number) {
                if (progress > 10) {
                    this.rarityTable.rare += 0.05;
                    this.rarityTable.common -= 0.05;
                }
            },
            generateFromEncounter(encounter: any) {
                const runtime = getLegacyRuntime();
                if (!encounter.items || !runtime.Utils) {
                    return null;
                }
                const pool: RuntimeItem[] = [];
                const weights: number[] = [];
                Object.entries(encounter.items).forEach(([id, weight]) => {
                    const item = this.itemList.find((entry) => entry.id === id);
                    if (!item) {
                        return;
                    }
                    pool.push(item);
                    weights.push(Number(weight));
                });
                if (!pool.length) {
                    return null;
                }
                return runtime.Utils.weightedRandomChoice(pool, weights);
            }
        },
        inventory: {
            add(item: RuntimeItem) {
                const runtime = getLegacyRuntime();
                if (!runtime.State.inventory[item.id]) {
                    runtime.setState(["inventory", item.id], { quantity: 1 });
                } else {
                    runtime.updateState(["inventory", item.id, "quantity"], (quantity: number) => quantity + 1);
                }
                runtime.SoftCapSystem?.recalculateCaps(runtime.State.inventory);
                runtime.PubSub?.publish("item:added", item.id);
                runtime.PubSub?.publish("inventory:changed", runtime.State.inventory);
            },
            consume(id: string, qty = 1) {
                const runtime = getLegacyRuntime();
                const record = runtime.State.inventory[id];
                if (!record || record.quantity < qty) {
                    return false;
                }
                if ((globalThis as any).Equipment?.isEquipped && (globalThis as any).Equipment.isEquipped(id)) {
                    return false;
                }
                runtime.updateState(["inventory", id, "quantity"], (quantity: number) => quantity - qty);
                if (runtime.State.inventory[id].quantity <= 0) {
                    runtime.deleteState(["inventory", id]);
                }
                runtime.SoftCapSystem?.recalculateCaps(runtime.State.inventory);
                runtime.PubSub?.publish("item:consumed", { id, quantity: qty });
                runtime.PubSub?.publish("inventory:changed", runtime.State.inventory);
                return true;
            },
            getItems() {
                const runtime = getLegacyRuntime();
                const rarityClasses = runtime.RARITY_CLASSES || ["common", "rare", "epic", "legendary", "story"];
                const items = Object.entries(runtime.State.inventory).map(([id, data]: [string, any]) => {
                    const itemData = (globalThis as any).ItemGenerator?.itemList?.find((item: RuntimeItem) => item.id === id) || {};
                    return {
                        id,
                        name: itemData.name || id,
                        rarity: itemData.rarity || "common",
                        quantity: data.quantity,
                        image: itemData.image,
                        type: itemData.type || "resource",
                        slot: itemData.slot || null,
                        combatBonuses: itemData.combatBonuses || {},
                        weaponProfile: itemData.weaponProfile || null,
                        shieldProfile: itemData.shieldProfile || null,
                        description: itemData.description || "",
                        effect: getEffectDescription(itemData)
                    };
                });
                const rarityOrder = rarityClasses.slice().reverse();
                items.sort((a, b) => {
                    const ra = rarityOrder.indexOf(a.rarity);
                    const rb = rarityOrder.indexOf(b.rarity);
                    if (ra !== rb) {
                        return ra - rb;
                    }
                    return a.name.localeCompare(b.name);
                });
                if (runtime.State.hideRarityEnabled) {
                    const threshold = rarityClasses.indexOf(runtime.State.hideBelowRarity);
                    return items.filter((item) => rarityClasses.indexOf(item.rarity) >= threshold);
                }
                return items;
            },
            hasItem(id: string) {
                const runtime = getLegacyRuntime();
                return runtime.State.inventory[id] && runtime.State.inventory[id].quantity > 0;
            },
            hasQuantity(id: string, qty = 1) {
                const runtime = getLegacyRuntime();
                return runtime.State.inventory[id] && runtime.State.inventory[id].quantity >= qty;
            },
            canAfford(cost: Record<string, number>) {
                return Object.entries(cost).every(([id, quantity]) => this.hasQuantity(id, quantity));
            },
            consumeCost(cost: Record<string, number>) {
                Object.entries(cost).forEach(([id, quantity]) => this.consume(id, quantity));
            }
        }
    };
}
