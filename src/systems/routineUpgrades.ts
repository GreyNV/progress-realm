import type { ContentRegistryData } from "../content/registry";
import { getLegacyRuntime } from "./runtime";

function getTotalCost(cost: Record<string, number>) {
    return Object.values(cost || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

function getScaledCost(cost: Record<string, number>, level: number) {
    const scale = Math.max(1, Number(level || 0) + 1);
    return Object.fromEntries(
        Object.entries(cost || {}).map(([key, value]) => [key, Math.ceil(Number(value || 0) * scale)])
    );
}

function getMultiplier(level: number, perLevel: number) {
    return Math.pow(1 + Number(perLevel || 0), Math.max(0, Number(level || 0)));
}

export function createRoutineUpgradeSystem(registry: ContentRegistryData) {
    return {
        upgrades: [] as any[],
        async load() {
            this.upgrades = registry.routineUpgrades.map((entry) => ({ ...entry }));
        },
        ensureState() {
            const runtime = getLegacyRuntime();
            if (!runtime.State.routineUpgrades || typeof runtime.State.routineUpgrades !== "object") {
                runtime.setState("routineUpgrades", {});
            }
        },
        getLevel(id: string) {
            this.ensureState();
            return Number(getLegacyRuntime().State.routineUpgrades?.[id] || 0);
        },
        getUpgrade(id: string) {
            return this.upgrades.find((entry) => entry.id === id) || null;
        },
        getCurrentCost(upgrade: any) {
            return getScaledCost(upgrade.cost || {}, this.getLevel(upgrade.id));
        },
        getMultiplierForStat(statKey: string) {
            return this.upgrades
                .filter((upgrade) => upgrade.stat === statKey)
                .reduce((total, upgrade) => total * getMultiplier(this.getLevel(upgrade.id), upgrade.perLevel), 1);
        },
        canPurchase(id: string) {
            const upgrade = this.getUpgrade(id);
            const inventory = (globalThis as any).Inventory;
            if (!upgrade || !inventory?.canAfford) {
                return false;
            }
            const level = this.getLevel(id);
            if (upgrade.maxLevel !== undefined && level >= Number(upgrade.maxLevel)) {
                return false;
            }
            return inventory.canAfford(this.getCurrentCost(upgrade));
        },
        purchase(id: string) {
            const runtime = getLegacyRuntime();
            const upgrade = this.getUpgrade(id);
            const inventory = (globalThis as any).Inventory;
            if (!upgrade || !inventory?.consumeCost || !this.canPurchase(id)) {
                return false;
            }
            inventory.consumeCost(this.getCurrentCost(upgrade));
            runtime.updateState(["routineUpgrades", id], (level: number) => (Number(level || 0) + 1));
            runtime.PubSub?.publish("routine-upgrades:changed", runtime.State.routineUpgrades);
            runtime.SaveSystem?.save();
            return true;
        },
        getSortedUpgrades() {
            this.ensureState();
            return this.upgrades
                .map((upgrade) => {
                    const level = this.getLevel(upgrade.id);
                    const currentCost = this.getCurrentCost(upgrade);
                    return {
                        ...upgrade,
                        level,
                        multiplier: getMultiplier(level, upgrade.perLevel),
                        nextMultiplier: getMultiplier(level + 1, upgrade.perLevel),
                        currentCost,
                        totalCost: getTotalCost(currentCost),
                        affordable: this.canPurchase(upgrade.id),
                        capped: upgrade.maxLevel !== undefined && level >= Number(upgrade.maxLevel)
                    };
                })
                .sort((a, b) => a.totalCost - b.totalCost || a.name.localeCompare(b.name));
        }
    };
}
