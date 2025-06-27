// Agents: ItemGenerator and Inventory work together to manage loot. Encounters
// call `Inventory.add()` with items produced here. Effects like softcap boosts
// are handled by SoftCapSystem after items are acquired.
class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.rarity = data.rarity || 'common';
        this.effectType = data.effectType;
        this.effectValue = data.effectValue;
        this.image = data.image || null;
    }

    getEffectDescription() {
        if (this.effectType === 'increaseSoftcap' && this.effectValue) {
            const key = Object.keys(this.effectValue)[0];
            return `Improves ${key} cap`;
        }
        return '';
    }

    applyEffect() {
        // Effect application now handled by SoftCapSystem.recalculateCaps
    }

    handleDuplicate() {
        // No conversion or diminishing returns for duplicates
        return null;
    }
}

const ItemGenerator = {
    itemList: [],
    rarityTable: {
        common: 0.7,
        rare: 0.2,
        epic: 0.08,
        legendary: 0.02,
    },
    generationSources: {
        hunting: ['rabbit_meat', 'wolf_pelt'],
        exploring: ['herb'],
        quests: ['herb', 'rabbit_meat', 'wolf_pelt'],
    },

    async load() {
        try {
            const res = await fetch('data/items.json');
            const json = await res.json();
            this.itemList = json.map((i) => new Item(i));
        } catch (e) {
            console.error('Failed to load items', e);
            this.itemList = [];
        }
    },

    generateItem(context) {
        const pool = this.itemList.filter((i) => {
            const src = this.generationSources[context];
            return !src || src.includes(i.id);
        });
        if (!pool.length) return null;
        const weights = pool.map((i) => this.rarityTable[i.rarity] || 1);
        return Utils.weightedRandomChoice(pool, weights);
    },

    adjustDropRates(progress) {
        if (progress > 10) {
            this.rarityTable.rare += 0.05;
            this.rarityTable.common -= 0.05;
        }
    },

    generateFromEncounter(encounter) {
        if (!encounter.items) return null;
        const pool = [];
        const weights = [];
        for (const [id, weight] of Object.entries(encounter.items)) {
            const item = this.itemList.find(i => i.id === id);
            if (!item) continue;
            pool.push(item);
            weights.push(weight);
        }
        if (!pool.length) return null;
        return Utils.weightedRandomChoice(pool, weights);
    },
};

const Inventory = {
    add(item) {
        if (!State.inventory[item.id]) {
            State.inventory[item.id] = { quantity: 1 };
        } else {
            item.handleDuplicate(State.inventory);
            State.inventory[item.id].quantity += 1;
        }
        SoftCapSystem.recalculateCaps(State.inventory);
        InventoryUI.update();
        if (typeof CharacterBackground !== 'undefined') {
            CharacterBackground.update();
        }
    },
    getItems() {
        return Object.entries(State.inventory).map(([id, data]) => {
            const itemData = ItemGenerator.itemList.find(i => i.id === id) || {};
            return {
                id,
                name: itemData.name || id,
                rarity: itemData.rarity || 'common',
                quantity: data.quantity,
                image: itemData.image,
                description: itemData.description || '',
                effect: itemData.getEffectDescription ? itemData.getEffectDescription() : ''
            };
        });
    },
    hasItem(id) {
        return State.inventory[id] && State.inventory[id].quantity > 0;
    },
};

if (typeof module !== 'undefined') {
    module.exports = { Item, ItemGenerator, Inventory };
}
