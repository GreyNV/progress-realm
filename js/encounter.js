// Legacy compatibility module for Node-based tests.
// The live browser runtime uses the typed encounter system from `src/systems`.

class Encounter {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || '';
        this.rarity = data.rarity || 'common';
        this.category = data.category || 'strength';
        this.baseDuration = data.baseDuration || 5;
        this.minLevel = data.minLevel || 0;
        this.storyLevel = data.storyLevel;
        this.resourceConsumption = data.resourceConsumption || {};
        this.weight = data.weight || 1;
        this.dungeon = data.dungeon || 'frontier';
        this.statFactors = data.statFactors || {};
        this.items = data.items || null;
        this.loot = data.loot || {};
        this.combat = !!data.combat;
        this.enemy = data.enemy || null;
        this.locked = !!data.locked;
    }

    getDuration() {
        const expeditionBonuses = EncounterGenerator.getAdventureBonuses(this);
        const speedMult = Math.max(getEncounterSpeedMultiplier(this) * (1 + expeditionBonuses.speed), 0.25);
        const level = Math.max(EncounterGenerator.level, 1);
        const scaledBase = this.baseDuration * (1 + level * 0.08);
        return Math.max(0.4, scaledBase / speedMult);
    }

    getLootChance() {
        const base = EncounterGenerator.lootBaseByCategory[this.category] || 0;
        const outputMult = getEncounterOutputMultiplier(this);
        const expeditionBonuses = EncounterGenerator.getAdventureBonuses(this);
        return base + (outputMult - 1) * EncounterGenerator.lootBonusPerStat + expeditionBonuses.lootChance;
    }

    getLootMultiplier() {
        const expeditionBonuses = EncounterGenerator.getAdventureBonuses(this);
        return (1 + (getEncounterOutputMultiplier(this) - 1) * EncounterGenerator.lootYieldBonusPerStat) * (1 + expeditionBonuses.lootMultiplier);
    }

    getResourceCost() {
        const scale = 1 + EncounterGenerator.level * EncounterGenerator.costScalePerLevel;
        const cost = {};
        for (const key in this.resourceConsumption) {
            cost[key] = this.resourceConsumption[key] * scale;
        }
        return cost;
    }
}

const EncounterGenerator = {
    encounters: [],
    dungeons: [],
    container: null,
    level: 1,
    milestones: [],
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
      agility: 0.02
    },
    lootBonusPerStat: 0.001,
    lootYieldBonusPerStat: 0.02,
    durationModPerStat: 0.02,
    costScalePerLevel: 0.1,
    baseDurationScale: 1,

    async load() {
        try {
            const registry = typeof window !== 'undefined' ? window.__appContent : null;
            const encounterJson = registry && Array.isArray(registry.encounters)
                ? registry.encounters
                : await (await fetch('data/encounters.json')).json();
            this.encounters = encounterJson.map(entry => new Encounter(entry));
        } catch (e) {
            console.error('Failed to load encounters', e);
            this.encounters = [];
        }

        try {
            const registry = typeof window !== 'undefined' ? window.__appContent : null;
            this.milestones = registry && Array.isArray(registry.locations)
                ? registry.locations
                : await (await fetch('data/locations.json')).json();
        } catch (e) {
            console.error('Failed to load locations', e);
            this.milestones = [{ level: 0, name: 'Unknown' }];
        }

        try {
            const registry = typeof window !== 'undefined' ? window.__appContent : null;
            const dungeonJson = registry && Array.isArray(registry.dungeons)
                ? registry.dungeons
                : await (await fetch('data/dungeons.json')).json();
            this.dungeons = Array.isArray(dungeonJson) ? dungeonJson : [];
        } catch (e) {
            console.error('Failed to load dungeons', e);
            this.dungeons = [];
        }
    },

    updateName() {
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('encounter:update');
        }
    },

    updateProgressBar() {
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('encounter:update');
        }
    },

    incrementLevel() {
        this.level += 1;
        if (typeof setState === 'function') {
            setState('encounterLevel', this.level);
        }
        this.updateName();
        this.updateProgressBar();
    },

    decrementLevel() {
        if (this.level > 1) {
            this.level -= 1;
        }
        if (typeof setState === 'function') {
            setState('encounterLevel', this.level);
        }
        this.updateName();
        this.updateProgressBar();
    },

    resetProgress() {
        this.populateSlots();
        if (typeof setState === 'function') {
            setState('encounterStreak', 0);
        }
        this.updateProgressBar();
        if (typeof AdventureEngine !== 'undefined' && AdventureEngine.startSlot) {
            AdventureEngine.startSlot(0);
        }
    },

    init() {
        this.container = null;
        this.level = State.encounterLevel || 1;
        if (!State.currentDungeon || !this.isDungeonUnlocked(State.currentDungeon)) {
            setState('currentDungeon', 'frontier');
        }
        this.updateName();
        this.updateProgressBar();
        this.populateSlots();
    },

    createAdventureBonusRecord() {
        return {
            speed: 0,
            lootChance: 0,
            lootMultiplier: 0
        };
    },

    applyAdventureBonusSet(target, bonusSet = {}) {
        target.speed += Number(bonusSet.speed || 0);
        target.lootChance += Number(bonusSet.lootChance || 0);
        target.lootMultiplier += Number(bonusSet.lootMultiplier || 0);
    },

    applyAdventureBonusesFromSource(target, source, encounter) {
        if (!source) return;
        this.applyAdventureBonusSet(target, source);
        if (source.dungeons && encounter && source.dungeons[encounter.dungeon || 'frontier']) {
            this.applyAdventureBonusSet(target, source.dungeons[encounter.dungeon || 'frontier']);
        }
        if (source.categories && encounter && source.categories[encounter.category]) {
            this.applyAdventureBonusSet(target, source.categories[encounter.category]);
        }
    },

    getAdventureBonuses(encounter) {
        const total = this.createAdventureBonusRecord();
        if (!encounter) return total;

        if (typeof HomeSystem !== 'undefined' && Array.isArray(HomeSystem.homes)) {
            const home = HomeSystem.homes.find(item => item.id === State.homeId);
            if (home) {
                this.applyAdventureBonusesFromSource(total, home.adventureBonuses, encounter);
            }
        }

        if (typeof FurnitureSystem !== 'undefined' && Array.isArray(FurnitureSystem.furniture)) {
            State.furniture.forEach(record => {
                if (!record || record.durability <= 0) return;
                const item = FurnitureSystem.furniture.find(entry => entry.id === record.id);
                if (item) {
                    this.applyAdventureBonusesFromSource(total, item.adventureBonuses, encounter);
                }
            });
        }

        if (typeof ItemGenerator !== 'undefined' && Array.isArray(ItemGenerator.itemList)) {
            Object.values(State.equipment || {}).forEach(itemId => {
                if (!itemId) return;
                const item = ItemGenerator.itemList.find(entry => entry.id === itemId);
                if (item) {
                    this.applyAdventureBonusesFromSource(total, item.adventureBonuses, encounter);
                }
            });
        }

        return total;
    },

    getDungeonDefinition(dungeonId) {
        return this.dungeons.find(dungeon => dungeon.id === dungeonId) || null;
    },

    isDungeonUnlocked(dungeonId) {
        const registry = typeof window !== 'undefined' ? window.__appContent : null;
        const service = typeof window !== 'undefined' ? window.__progressionService : null;
        if (service && registry && service.isDungeonUnlocked) {
            return service.isDungeonUnlocked(dungeonId, State, registry);
        }

        const definition = this.getDungeonDefinition(dungeonId);
        if (!definition || !definition.unlock || definition.unlock.type === 'always') {
            return dungeonId === 'frontier' || !definition;
        }

        const unlock = definition.unlock;
        if (unlock.storyFlag && !State[unlock.storyFlag]) {
            return false;
        }
        if (unlock.encounterLevel && this.level < unlock.encounterLevel) {
            return false;
        }
        if (unlock.dungeonClears) {
            return Object.entries(unlock.dungeonClears).every(([id, clears]) =>
                (State.adventureCompletions[id] || 0) >= clears
            );
        }
        return true;
    },

    getDungeonUnlockLabel(dungeonId) {
        const definition = this.getDungeonDefinition(dungeonId);
        if (!definition || !definition.unlock || definition.unlock.type === 'always') {
            return 'Open';
        }

        const parts = [];
        if (definition.unlock.encounterLevel) {
            parts.push(`Encounter Lv.${definition.unlock.encounterLevel}`);
        }
        if (definition.unlock.dungeonClears) {
            Object.entries(definition.unlock.dungeonClears).forEach(([id, clears]) => {
                parts.push(`${id.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())} x${clears}`);
            });
        }
        return parts.join(' | ');
    },

    getDungeonCatalog() {
        const catalog = {};

        this.encounters.forEach(encounter => {
            if (encounter.id === 'recover') return;
            const dungeonId = encounter.dungeon || 'frontier';
            const definition = this.getDungeonDefinition(dungeonId);
            if (!catalog[dungeonId]) {
                catalog[dungeonId] = {
                    id: dungeonId,
                    name: definition && definition.name ? definition.name : dungeonId.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
                    description: definition && definition.description ? definition.description : '',
                    recommendedStat: definition && definition.recommendedStat ? definition.recommendedStat : null,
                    encounterCount: 0,
                    minLevel: encounter.minLevel || 0,
                    maxEncounterLevel: encounter.minLevel || 0,
                    combatCount: 0,
                    guaranteedLoot: {},
                    weightedDrops: {},
                    unlocked: this.isDungeonUnlocked(dungeonId),
                    unlockLabel: this.getDungeonUnlockLabel(dungeonId),
                    hiddenUntilUnlocked: !!(definition && definition.hiddenUntilUnlocked)
                };
            }

            const bucket = catalog[dungeonId];
            bucket.encounterCount += 1;
            bucket.minLevel = Math.min(bucket.minLevel, encounter.minLevel || 0);
            bucket.maxEncounterLevel = Math.max(bucket.maxEncounterLevel, encounter.minLevel || 0);

            if (encounter.combat) {
                bucket.combatCount += 1;
            }

            Object.entries(encounter.loot || {}).forEach(([id, qty]) => {
                bucket.guaranteedLoot[id] = (bucket.guaranteedLoot[id] || 0) + Number(qty || 0);
            });
            Object.entries(encounter.items || {}).forEach(([id, weight]) => {
                bucket.weightedDrops[id] = (bucket.weightedDrops[id] || 0) + Number(weight || 0);
            });
        });

        this.dungeons.forEach(definition => {
            if (!catalog[definition.id]) {
                catalog[definition.id] = {
                    id: definition.id,
                    name: definition.name,
                    description: definition.description || '',
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
            .filter(dungeon => dungeon.unlocked || !dungeon.hiddenUntilUnlocked)
            .sort((a, b) => a.minLevel - b.minLevel);
    },

    setCurrentDungeon(dungeonId) {
        if (!dungeonId || !this.isDungeonUnlocked(dungeonId)) return;
        setState('currentDungeon', dungeonId);
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('dungeon:selected', dungeonId);
            PubSub.publish('encounter:update');
        }
    },

    getRecoverEncounter() {
        return this.encounters.find(entry => entry.id === 'recover') || null;
    },

    randomEncounter() {
        if (!this.encounters.length) return null;

        const story = this.encounters.find(encounter => {
            if (encounter.rarity !== 'story') return false;
            if (encounter.storyLevel === undefined) return false;
            if (this.level < encounter.storyLevel) return false;
            if (encounter.id === 'banditsAmbush' && State.banditsAmbushSeen) {
                return Math.random() < 0.0005;
            }
            return true;
        });
        if (story) return story;

        const selectedDungeon = State.currentDungeon || 'frontier';
        let pool = this.encounters.filter(encounter => {
            if (encounter.locked) return false;
            if ((encounter.minLevel || 0) > this.level) return false;
            if (encounter.id === 'recover') return false;
            if ((encounter.dungeon || 'frontier') !== selectedDungeon) return false;
            if (!this.isDungeonUnlocked(encounter.dungeon || 'frontier')) return false;
            return true;
        });

        if (!pool.length) {
            pool = this.encounters.filter(encounter => {
                if (encounter.locked) return false;
                if ((encounter.minLevel || 0) > this.level) return false;
                if (encounter.id === 'recover') return false;
                if (!this.isDungeonUnlocked(encounter.dungeon || 'frontier')) return false;
                return true;
            });
        }

        if (!pool.length) return null;
        const weights = pool.map(encounter => (this.rarityWeights[encounter.rarity] || 1) * (encounter.weight || 1));
        return Utils.weightedRandomChoice(pool, weights);
    },

    populateSlots() {
        for (let index = 0; index < State.adventureSlots.length; index += 1) {
            State.adventureSlots[index].encounter = null;
            State.adventureSlots[index].duration = 1;
            State.adventureSlots[index].progress = 0;
            State.adventureSlots[index].active = false;
            if (typeof updateAdventureSlotUI === 'function') {
                updateAdventureSlotUI(index);
            }
        }
    },

    resolve(encounter) {
        Object.entries(encounter.loot || {}).forEach(([id, qty]) => {
            const item = ItemGenerator.itemList.find(entry => entry.id === id);
            if (!item) return;

            const total = Math.max(0, Math.floor(qty * encounter.getLootMultiplier()));
            for (let index = 0; index < total; index += 1) {
                Inventory.add(item);
            }
        });

        if (encounter.id === 'banditsAmbush') {
            const message = Lang.log('banditsAmbushWin') ||
                'You survived the bandits ambush and claimed your reward.';
            Log.add({ text: message, options: { encounter: true } });
            if (!State.banditsAmbushSeen) {
                StorySystem.trigger('banditsAmbushVictory');
            }
            return;
        }

        if (Math.random() < encounter.getLootChance()) {
            const item = ItemGenerator.generateFromEncounter(encounter);
            if (!item) return;

            const itemHTML = `<span class="rarity-${item.rarity}"><b>${item.name}</b></span>`;
            const encounterHTML = `<span class="rarity-${encounter.rarity}"><b>${encounter.name}</b></span>`;
            const message = Lang.log('foundItem', { item: itemHTML, encounter: encounterHTML }) ||
                `You found ${itemHTML} during ${encounterHTML}!`;
            Log.add({ text: message, options: { encounter: true } });
            Inventory.add(item);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Encounter, EncounterGenerator };
}
