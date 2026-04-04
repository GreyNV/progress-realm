// Legacy compatibility module for Node-based tests.
// The live browser runtime uses the typed item and inventory systems from `src/systems`.

class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.rarity = data.rarity || 'common';
        this.type = data.type || 'resource';
        this.slot = data.slot || null;
        this.combatBonuses = data.combatBonuses || {};
        this.adventureBonuses = data.adventureBonuses || {};
        this.weaponProfile = data.weaponProfile || null;
        this.shieldProfile = data.shieldProfile || null;
        this.effectType = data.effectType;
        this.effectValue = data.effectValue;
        this.image = data.image || null;
    }

    getEffectDescription() {
        if (this.effectType === 'increaseSoftcap' && this.effectValue) {
            const key = Object.keys(this.effectValue)[0];
            const resName = typeof Lang !== 'undefined' && (Lang.stat(key) || Lang.resource(key)) || key;
            const template = typeof Lang !== 'undefined' && Lang.effect('increaseSoftcap') || 'Improves {resource} cap';
            return template.replace('{resource}', resName);
        }
        return '';
    }

    applyEffect() {}

    handleDuplicate() {
        return null;
    }
}

const ItemGenerator = (typeof window !== 'undefined' && window.ItemGenerator) || {
    itemList: [],
    rarityTable: {
        common: 0.7,
        rare: 0.2,
        epic: 0.08,
        legendary: 0.02
    },
    generationSources: {
        hunting: ['rabbit_meat', 'wolf_pelt'],
        exploring: ['herb'],
        quests: ['herb', 'rabbit_meat', 'wolf_pelt']
    },
    async load() {},
    generateItem(context) {
        const pool = this.itemList.filter(item => {
            const source = this.generationSources[context];
            return !source || source.includes(item.id);
        });
        if (!pool.length) return null;
        const weights = pool.map(item => this.rarityTable[item.rarity] || 1);
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
            const item = this.itemList.find(entry => entry.id === id);
            if (!item) continue;
            pool.push(item);
            weights.push(weight);
        }
        if (!pool.length) return null;
        return Utils.weightedRandomChoice(pool, weights);
    }
};

const Inventory = (typeof window !== 'undefined' && window.Inventory) || {
    add(item) {
        if (!State.inventory[item.id]) {
            setState(['inventory', item.id], { quantity: 1 });
        } else {
            item.handleDuplicate(State.inventory);
            updateState(['inventory', item.id, 'quantity'], quantity => quantity + 1);
        }
        if (typeof SoftCapSystem !== 'undefined' && SoftCapSystem.recalculateCaps) {
            SoftCapSystem.recalculateCaps(State.inventory);
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('item:added', item.id);
            PubSub.publish('inventory:changed', State.inventory);
        }
    },
    consume(id, qty = 1) {
        const record = State.inventory[id];
        if (!record || record.quantity < qty) return false;
        if (typeof Equipment !== 'undefined' && Equipment.isEquipped && Equipment.isEquipped(id)) {
            return false;
        }
        updateState(['inventory', id, 'quantity'], quantity => quantity - qty);
        if (State.inventory[id].quantity <= 0) {
            deleteState(['inventory', id]);
        }
        if (typeof SoftCapSystem !== 'undefined' && SoftCapSystem.recalculateCaps) {
            SoftCapSystem.recalculateCaps(State.inventory);
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('item:consumed', { id, quantity: qty });
            PubSub.publish('inventory:changed', State.inventory);
        }
        return true;
    },
    getItems() {
        const rarityOrder = (typeof RARITY_CLASSES !== 'undefined' ? RARITY_CLASSES : ['common', 'rare', 'epic', 'legendary', 'story']).slice().reverse();
        const items = Object.entries(State.inventory).map(([id, data]) => {
            const itemData = ItemGenerator.itemList.find(item => item.id === id) || {};
            return {
                id,
                name: itemData.name || id,
                rarity: itemData.rarity || 'common',
                quantity: data.quantity,
                image: itemData.image,
                type: itemData.type || 'resource',
                slot: itemData.slot || null,
                combatBonuses: itemData.combatBonuses || {},
                weaponProfile: itemData.weaponProfile || null,
                shieldProfile: itemData.shieldProfile || null,
                description: itemData.description || '',
                effect: itemData.getEffectDescription ? itemData.getEffectDescription() : ''
            };
        });
        items.sort((a, b) => {
            const ra = rarityOrder.indexOf(a.rarity);
            const rb = rarityOrder.indexOf(b.rarity);
            if (ra !== rb) return ra - rb;
            return a.name.localeCompare(b.name);
        });
        if (State.hideRarityEnabled) {
            const threshold = (typeof RARITY_CLASSES !== 'undefined' ? RARITY_CLASSES : ['common', 'rare', 'epic', 'legendary', 'story']).indexOf(State.hideBelowRarity);
            return items.filter(item => (typeof RARITY_CLASSES !== 'undefined' ? RARITY_CLASSES : ['common', 'rare', 'epic', 'legendary', 'story']).indexOf(item.rarity) >= threshold);
        }
        return items;
    },
    hasItem(id) {
        return State.inventory[id] && State.inventory[id].quantity > 0;
    },
    hasQuantity(id, qty = 1) {
        return State.inventory[id] && State.inventory[id].quantity >= qty;
    },
    canAfford(cost) {
        for (const id in cost) {
            if (!this.hasQuantity(id, cost[id])) return false;
        }
        return true;
    },
    consumeCost(cost) {
        for (const id in cost) {
            this.consume(id, cost[id]);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Item, ItemGenerator, Inventory };
}
