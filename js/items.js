class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.rarity = data.rarity || 'common';
        this.effectType = data.effectType;
        this.effectValue = data.effectValue;
        this.maxQuantity = data.maxQuantity || 1;
    }

    applyEffect(targetState) {
        if (!targetState) return;
        if (this.effectType === 'generateResource') {
            for (const key in this.effectValue) {
                const capKey = 'max' + key.charAt(0).toUpperCase() + key.slice(1);
                targetState.resources[key] =
                    (targetState.resources[key] || 0) + this.effectValue[key];
                if (targetState.resources[capKey] !== undefined) {
                    targetState.resources[key] = Math.min(
                        targetState.resources[key],
                        targetState.resources[capKey]
                    );
                }
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
        hunting: ['energy_potion'],
        exploring: ['ancient_tome'],
        quests: ['energy_potion', 'ancient_tome'],
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
};

if (typeof module !== 'undefined') {
    module.exports = { Item, ItemGenerator };
}
