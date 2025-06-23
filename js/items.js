class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.rarity = data.rarity || 'common';
        this.effectType = data.effectType;
        this.effectValue = data.effectValue;
        this.maxQuantity = data.maxQuantity || 1;
        this.image = data.image || null;
    }

    applyEffect(targetState) {
        if (!targetState) return;
        if (this.effectType === 'generateResource') {
            for (const key in this.effectValue) {
                if (!targetState.resources[key]) continue;
                ResourceSystem.add(targetState.resources[key], this.effectValue[key]);
            }
        } else if (this.effectType === 'increaseSoftcap') {
            for (const key in this.effectValue) {
                SoftCapSystem.statCaps[key] =
                    (SoftCapSystem.statCaps[key] || 0) + this.effectValue[key];
            }
        }
    }

    handleDuplicate(inventory) {
        const record = inventory[this.id];
        if (!record) return;
        if (record.quantity >= this.maxQuantity) {
            record.quantity = this.maxQuantity;
            if (!inventory.knowledge) inventory.knowledge = 0;
            inventory.knowledge += 1;
            return 'converted';
        }
        record.effectiveness = (record.effectiveness || 1) * 0.5;
        return 'reduced';
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
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < pool.length; i++) {
            r -= weights[i];
            if (r <= 0) return pool[i];
        }
        return pool[pool.length - 1];
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
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < pool.length; i++) {
            r -= weights[i];
            if (r <= 0) return pool[i];
        }
        return pool[pool.length - 1];
    },
};

const Inventory = {
    add(item) {
        if (!State.inventory[item.id]) {
            State.inventory[item.id] = { quantity: 1 };
        } else {
            const result = item.handleDuplicate(State.inventory);
            if (result !== 'converted') {
                State.inventory[item.id].quantity += 1;
            }
        }
        InventoryUI.update();
    },
    getItems() {
        return Object.entries(State.inventory).map(([id, data]) => {
            const itemData = ItemGenerator.itemList.find(i => i.id === id) || {};
            return {
                id,
                quantity: data.quantity,
                image: itemData.image,
            };
        });
    },
};

if (typeof module !== 'undefined') {
    module.exports = { Item, ItemGenerator, Inventory };
}
