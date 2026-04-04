import type { ContentRegistryData } from "../content/registry";
import { getLegacyRuntime } from "./runtime";

function getEncounterHelpers() {
    const scope = globalThis as any;
    return {
        getEncounterSpeedMultiplier: scope.getEncounterSpeedMultiplier,
        getEncounterOutputMultiplier: scope.getEncounterOutputMultiplier
    };
}

export class RuntimeEncounter {
    id: string;
    name: string;
    description: string;
    image: string;
    rarity: string;
    category: string;
    baseDuration: number;
    minLevel: number;
    storyLevel: number | undefined;
    resourceConsumption: Record<string, number>;
    weight: number;
    dungeon: string;
    statFactors: Record<string, unknown>;
    items: Record<string, number> | null;
    loot: Record<string, number>;
    combat: boolean;
    enemy: Record<string, unknown> | null;
    locked?: boolean;

    constructor(data: any) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || "";
        this.image = data.image || "";
        this.rarity = data.rarity || "common";
        this.category = data.category || "strength";
        this.baseDuration = data.baseDuration || 5;
        this.minLevel = data.minLevel || 0;
        this.storyLevel = data.storyLevel;
        this.resourceConsumption = data.resourceConsumption || {};
        this.weight = data.weight || 1;
        this.dungeon = data.dungeon || "frontier";
        this.statFactors = data.statFactors || {};
        this.items = data.items || null;
        this.loot = data.loot || {};
        this.combat = !!data.combat;
        this.enemy = data.enemy || null;
        this.locked = data.locked || false;
    }

    getDuration(): number {
        const runtime = getLegacyRuntime();
        const helpers = getEncounterHelpers();
        const bonuses = runtime.EncounterGenerator?.getAdventureBonuses
            ? runtime.EncounterGenerator.getAdventureBonuses(this)
            : { speed: 0 };
        const speedMult = Math.max((helpers.getEncounterSpeedMultiplier?.(this) || 1) * (1 + Number(bonuses.speed || 0)), 0.25);
        const level = Math.max(runtime.EncounterGenerator?.level || 1, 1);
        const scaledBase = this.baseDuration * (1 + level * 0.08);
        return Math.max(0.4, scaledBase / speedMult);
    }

    getLootChance(): number {
        const runtime = getLegacyRuntime();
        const helpers = getEncounterHelpers();
        const base = runtime.EncounterGenerator?.lootBaseByCategory?.[this.category] || 0;
        const outputMult = helpers.getEncounterOutputMultiplier?.(this) || 1;
        const bonuses = runtime.EncounterGenerator?.getAdventureBonuses
            ? runtime.EncounterGenerator.getAdventureBonuses(this)
            : { lootChance: 0 };
        return base + (outputMult - 1) * (runtime.EncounterGenerator?.lootBonusPerStat || 0) + Number(bonuses.lootChance || 0);
    }

    getLootMultiplier(): number {
        const runtime = getLegacyRuntime();
        const helpers = getEncounterHelpers();
        const bonuses = runtime.EncounterGenerator?.getAdventureBonuses
            ? runtime.EncounterGenerator.getAdventureBonuses(this)
            : { lootMultiplier: 0 };
        return (1 + ((helpers.getEncounterOutputMultiplier?.(this) || 1) - 1) * (runtime.EncounterGenerator?.lootYieldBonusPerStat || 0)) * (1 + Number(bonuses.lootMultiplier || 0));
    }

    getResourceCost(): Record<string, number> {
        const runtime = getLegacyRuntime();
        const scale = 1 + (runtime.EncounterGenerator?.level || 0) * (runtime.EncounterGenerator?.costScalePerLevel || 0);
        const cost: Record<string, number> = {};
        Object.entries(this.resourceConsumption).forEach(([key, value]) => {
            cost[key] = Number(value) * scale;
        });
        return cost;
    }
}

export function createEncounterSystem(registry: ContentRegistryData) {
    return {
        encounters: [] as RuntimeEncounter[],
        dungeons: [] as any[],
        container: null as HTMLElement | null,
        level: 1,
        milestones: [] as any[],
        rarityWeights: {
            common: 1,
            rare: 0.5,
            epic: 0.2,
            legendary: 0.1,
            story: 0.05
        },
        lootBaseByCategory: {
            strength: 0.02,
            intelligence: 0.02,
            agility: 0.02,
            constitution: 0.02,
            will: 0.02
        },
        lootBonusPerStat: 0.001,
        lootYieldBonusPerStat: 0.02,
        durationModPerStat: 0.02,
        costScalePerLevel: 0.1,
        baseDurationScale: 1,
        async load() {
            this.encounters = registry.encounters.map((entry) => new RuntimeEncounter(entry));
            this.milestones = registry.locations.slice();
            this.dungeons = registry.dungeons.slice();
        },
        updateName() {
            getLegacyRuntime().PubSub?.publish("encounter:update");
        },
        updateProgressBar() {
            getLegacyRuntime().PubSub?.publish("encounter:update");
        },
        incrementLevel() {
            const runtime = getLegacyRuntime();
            this.level += 1;
            runtime.setState("encounterLevel", this.level);
            this.updateName();
            this.updateProgressBar();
        },
        decrementLevel() {
            const runtime = getLegacyRuntime();
            if (this.level > 1) {
                this.level -= 1;
            }
            runtime.setState("encounterLevel", this.level);
            this.updateName();
            this.updateProgressBar();
        },
        resetProgress() {
            const runtime = getLegacyRuntime();
            this.populateSlots();
            runtime.setState("encounterStreak", 0);
            this.updateProgressBar();
            if ((globalThis as any).window?.__gameSystems?.adventureEngine) {
                (globalThis as any).window.__gameSystems.adventureEngine.startSlot(0);
            } else if ((globalThis as any).AdventureEngine) {
                (globalThis as any).AdventureEngine.startSlot(0);
            }
        },
        init() {
            const runtime = getLegacyRuntime();
            this.container = null;
            this.level = runtime.State.encounterLevel || 1;
            if (!runtime.State.currentDungeon || !this.isDungeonUnlocked(runtime.State.currentDungeon)) {
                runtime.setState("currentDungeon", "frontier");
            }
            this.updateName();
            this.updateProgressBar();
            this.populateSlots();
        },
        createAdventureBonusRecord() {
            return { speed: 0, lootChance: 0, lootMultiplier: 0 };
        },
        applyAdventureBonusSet(target: Record<string, number>, bonusSet: Record<string, unknown> = {}) {
            target.speed += Number(bonusSet.speed || 0);
            target.lootChance += Number(bonusSet.lootChance || 0);
            target.lootMultiplier += Number(bonusSet.lootMultiplier || 0);
        },
        applyAdventureBonusesFromSource(target: Record<string, number>, source: any, encounter: RuntimeEncounter | null) {
            if (!source) {
                return;
            }
            this.applyAdventureBonusSet(target, source);
            if (source.dungeons && encounter && source.dungeons[encounter.dungeon || "frontier"]) {
                this.applyAdventureBonusSet(target, source.dungeons[encounter.dungeon || "frontier"]);
            }
            if (source.categories && encounter && source.categories[encounter.category]) {
                this.applyAdventureBonusSet(target, source.categories[encounter.category]);
            }
        },
        getAdventureBonuses(encounter: RuntimeEncounter | null) {
            const runtime = getLegacyRuntime();
            const total = this.createAdventureBonusRecord();
            if (!encounter) {
                return total;
            }
            const homeSystem = (globalThis as any).HomeSystem;
            if (homeSystem?.homes) {
                const home = homeSystem.homes.find((entry: any) => entry.id === runtime.State.homeId);
                if (home) {
                    this.applyAdventureBonusesFromSource(total, home.adventureBonuses, encounter);
                }
            }
            const furnitureSystem = (globalThis as any).FurnitureSystem;
            if (furnitureSystem?.furniture) {
                runtime.State.furniture.forEach((record: any) => {
                    if (!record || record.durability <= 0) {
                        return;
                    }
                    const item = furnitureSystem.furniture.find((entry: any) => entry.id === record.id);
                    if (item) {
                        this.applyAdventureBonusesFromSource(total, item.adventureBonuses, encounter);
                    }
                });
            }
            const itemGenerator = (globalThis as any).ItemGenerator;
            if (itemGenerator?.itemList) {
                Object.values(runtime.State.equipment || {}).forEach((itemId) => {
                    if (!itemId) {
                        return;
                    }
                    const item = itemGenerator.itemList.find((entry: any) => entry.id === itemId);
                    if (item) {
                        this.applyAdventureBonusesFromSource(total, item.adventureBonuses, encounter);
                    }
                });
            }
            return total;
        },
        getDungeonDefinition(dungeonId: string) {
            return this.dungeons.find((dungeon) => dungeon.id === dungeonId) || null;
        },
        isDungeonUnlocked(dungeonId: string) {
            const runtime = getLegacyRuntime();
            const service = (globalThis as any).window?.__progressionService;
            const registryRef = (globalThis as any).window?.__appContent;
            if (service && registryRef && service.isDungeonUnlocked) {
                return service.isDungeonUnlocked(dungeonId, runtime.State, registryRef);
            }
            const definition = this.getDungeonDefinition(dungeonId);
            if (!definition || !definition.unlock || definition.unlock.type === "always") {
                return dungeonId === "frontier" || !definition;
            }
            const unlock = definition.unlock;
            if (unlock.storyFlag && !runtime.State[unlock.storyFlag]) {
                return false;
            }
            if (unlock.encounterLevel && this.level < unlock.encounterLevel) {
                return false;
            }
            if (unlock.dungeonClears) {
                return Object.entries(unlock.dungeonClears).every(([id, clears]) => (runtime.State.adventureCompletions[id] || 0) >= Number(clears));
            }
            return true;
        },
        getDungeonUnlockLabel(dungeonId: string) {
            const definition = this.getDungeonDefinition(dungeonId);
            if (!definition || !definition.unlock || definition.unlock.type === "always") {
                return "Open";
            }
            const parts: string[] = [];
            if (definition.unlock.encounterLevel) {
                parts.push(`Encounter Lv.${definition.unlock.encounterLevel}`);
            }
            if (definition.unlock.dungeonClears) {
                Object.entries(definition.unlock.dungeonClears).forEach(([id, clears]) => {
                    parts.push(`${id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} x${Number(clears)}`);
                });
            }
            return parts.join(" | ");
        },
        getDungeonCatalog() {
            const runtime = getLegacyRuntime();
            const catalog: Record<string, any> = {};
            this.encounters.forEach((encounter) => {
                if (encounter.id === "recover") {
                    return;
                }
                const dungeonId = encounter.dungeon || "frontier";
                const definition = this.getDungeonDefinition(dungeonId);
                if (!catalog[dungeonId]) {
                    catalog[dungeonId] = {
                        id: dungeonId,
                        name: definition?.name || dungeonId.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
                        description: definition?.description || "",
                        recommendedStat: definition?.recommendedStat || null,
                        encounterCount: 0,
                        minLevel: encounter.minLevel || 0,
                        maxEncounterLevel: encounter.minLevel || 0,
                        combatCount: 0,
                        guaranteedLoot: {},
                        weightedDrops: {},
                        unlocked: this.isDungeonUnlocked(dungeonId),
                        unlockLabel: this.getDungeonUnlockLabel(dungeonId),
                        hiddenUntilUnlocked: !!definition?.hiddenUntilUnlocked
                    };
                }
                const bucket = catalog[dungeonId];
                bucket.encounterCount += 1;
                bucket.minLevel = Math.min(bucket.minLevel, encounter.minLevel || 0);
                bucket.maxEncounterLevel = Math.max(bucket.maxEncounterLevel, encounter.minLevel || 0);
                if (encounter.combat) {
                    bucket.combatCount += 1;
                }
                Object.entries(encounter.loot || {}).forEach(([id, quantity]) => {
                    bucket.guaranteedLoot[id] = (bucket.guaranteedLoot[id] || 0) + Number(quantity || 0);
                });
                Object.entries(encounter.items || {}).forEach(([id, weight]) => {
                    bucket.weightedDrops[id] = (bucket.weightedDrops[id] || 0) + Number(weight || 0);
                });
            });
            this.dungeons.forEach((definition) => {
                if (!catalog[definition.id]) {
                    catalog[definition.id] = {
                        id: definition.id,
                        name: definition.name,
                        description: definition.description || "",
                        recommendedStat: definition.recommendedStat || null,
                        encounterCount: 0,
                        minLevel: 0,
                        maxEncounterLevel: 0,
                        combatCount: 0,
                        guaranteedLoot: {},
                        weightedDrops: {},
                        unlocked: this.isDungeonUnlocked(definition.id),
                        unlockLabel: this.getDungeonUnlockLabel(definition.id),
                        hiddenUntilUnlocked: !!definition.hiddenUntilUnlocked
                    };
                }
            });
            return Object.values(catalog)
                .filter((dungeon: any) => dungeon.unlocked || !dungeon.hiddenUntilUnlocked)
                .sort((a: any, b: any) => a.minLevel - b.minLevel);
        },
        setCurrentDungeon(dungeonId: string) {
            const runtime = getLegacyRuntime();
            if (!dungeonId || !this.isDungeonUnlocked(dungeonId)) {
                return;
            }
            runtime.setState("currentDungeon", dungeonId);
            runtime.PubSub?.publish("dungeon:selected", dungeonId);
            runtime.PubSub?.publish("encounter:update");
        },
        getRecoverEncounter() {
            return this.encounters.find((encounter) => encounter.id === "recover") || null;
        },
        randomEncounter() {
            const runtime = getLegacyRuntime();
            if (!this.encounters.length || !runtime.Utils) {
                return null;
            }
            const story = this.encounters.find((encounter) => {
                if (encounter.rarity !== "story" || encounter.storyLevel === undefined || this.level < encounter.storyLevel) {
                    return false;
                }
                if (encounter.id === "banditsAmbush" && runtime.State.banditsAmbushSeen) {
                    return Math.random() < 0.0005;
                }
                return true;
            });
            if (story) {
                return story;
            }
            const selectedDungeon = runtime.State.currentDungeon || "frontier";
            let pool = this.encounters.filter((encounter) =>
                !encounter.locked &&
                (encounter.minLevel || 0) <= this.level &&
                encounter.id !== "recover" &&
                (encounter.dungeon || "frontier") === selectedDungeon &&
                this.isDungeonUnlocked(encounter.dungeon || "frontier")
            );
            if (!pool.length) {
                pool = this.encounters.filter((encounter) =>
                    !encounter.locked &&
                    (encounter.minLevel || 0) <= this.level &&
                    encounter.id !== "recover" &&
                    this.isDungeonUnlocked(encounter.dungeon || "frontier")
                );
            }
            if (!pool.length) {
                return null;
            }
            const weights = pool.map((encounter) => (this.rarityWeights[encounter.rarity as keyof typeof this.rarityWeights] || 1) * (encounter.weight || 1));
            return runtime.Utils.weightedRandomChoice(pool, weights);
        },
        populateSlots() {
            const runtime = getLegacyRuntime();
            for (let i = 0; i < runtime.State.adventureSlots.length; i += 1) {
                runtime.State.adventureSlots[i].encounter = null;
                runtime.State.adventureSlots[i].duration = 1;
                runtime.State.adventureSlots[i].progress = 0;
                runtime.State.adventureSlots[i].active = false;
                runtime.updateAdventureSlotUI?.(i);
            }
        },
        resolve(encounter: RuntimeEncounter) {
            const runtime = getLegacyRuntime();
            const itemGenerator = (globalThis as any).ItemGenerator;
            const inventory = (globalThis as any).Inventory;
            Object.entries(encounter.loot || {}).forEach(([id, qty]) => {
                const item = itemGenerator?.itemList.find((entry: any) => entry.id === id);
                if (!item) {
                    return;
                }
                const total = Math.max(0, Math.floor(Number(qty) * encounter.getLootMultiplier()));
                for (let i = 0; i < total; i += 1) {
                    inventory.add(item);
                }
            });
            if (encounter.id === "banditsAmbush") {
                const msg = runtime.Lang?.log?.("banditsAmbushWin") || "You survived the bandits ambush and claimed your reward.";
                runtime.Log?.add({ text: msg, options: { encounter: true } });
                if (!runtime.State.banditsAmbushSeen) {
                    runtime.StorySystem?.trigger("banditsAmbushVictory");
                }
                return;
            }
            if (Math.random() < encounter.getLootChance()) {
                const item = itemGenerator?.generateFromEncounter(encounter);
                if (item) {
                    const itemHTML = `<span class="rarity-${item.rarity}"><b>${item.name}</b></span>`;
                    const encHTML = `<span class="rarity-${encounter.rarity}"><b>${encounter.name}</b></span>`;
                    const msg = runtime.Lang?.log?.("foundItem", { item: itemHTML, encounter: encHTML }) || `You found ${itemHTML} during ${encHTML}!`;
                    runtime.Log?.add({ text: msg, options: { encounter: true } });
                    inventory.add(item);
                }
            }
        }
    };
}
