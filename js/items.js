// Agents: ItemGenerator and Inventory work together to manage loot. Encounters
// call `Inventory.add()` with items produced here. Consumable items now grant
// stat boosts when used instead of restoring resources directly.
class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.rarity = data.rarity || 'common';
        this.type = data.type || 'resource';
        this.restore = data.restore || {};
        this.image = data.image || null;
    }

    getEffectDescription() {
        if (this.type === 'consumable' && this.restore) {
            const parts = [];
            for (const [key, val] of Object.entries(this.restore)) {
                let label = key;
                if (typeof Lang !== 'undefined') {
                    const statName = typeof Lang.stat === 'function' ? Lang.stat(key) : null;
                    const resName = typeof Lang.resource === 'function' ? Lang.resource(key) : null;
                    label = statName || resName || key;
                }
                parts.push(`+${val} ${label}`);
            }
            if (!parts.length) {
                return '';
            }
            return `Grants ${parts.join(', ')}`;
        }
        return '';
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
            setState(['inventory', item.id], { quantity: 1 });
        } else {
            if (item.type !== 'equipment') {
                item.handleDuplicate(State.inventory);
            }
            updateState(['inventory', item.id, 'quantity'], q => q + 1);
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('item:added', item.id);
            // notify equipment listeners when new gear enters the inventory
            if (item.type === 'equipment') {
                PubSub.publish('equipment:available', item.id);
            }
            PubSub.publish('inventory:changed', State.inventory);
        }
    },
    consume(id, qty = 1) {
        const item = ItemGenerator.itemList.find(i => i.id === id);
        // do not allow consuming equipment currently in use
        if (item && item.type === 'equipment' && Object.values(State.equipment).includes(id)) {
            return false;
        }
        const record = State.inventory[id];
        if (!record || record.quantity < qty) return false;
        updateState(['inventory', id, 'quantity'], q => q - qty);
        if (State.inventory[id].quantity <= 0) deleteState(['inventory', id]);
        if (item && item.type === 'consumable') {
            const stats = (State && State.stats) ? State.stats : {};
            const resources = (State && State.resources) ? State.resources : {};
            let statsChanged = false;
            const restoreEntries = item.restore ? Object.entries(item.restore) : [];
            for (const [key, amt] of restoreEntries) {
                const stat = stats ? stats[key] : undefined;
                if (!stat) {
                    if (resources && resources[key]) {
                        continue;
                    }
                    const message = `Inventory.consume: missing stat definition for "${key}" on item ${id}`;
                    if (typeof Logger !== 'undefined' && typeof Logger.warn === 'function') {
                        Logger.warn(message);
                    } else if (typeof console !== 'undefined' && typeof console.warn === 'function') {
                        console.warn(message);
                    }
                    continue;
                }
                if (typeof StatSystem !== 'undefined' && typeof StatSystem.add === 'function') {
                    StatSystem.add(stat, amt * qty);
                } else {
                    stat.value = (Number(stat.value) || 0) + amt * qty;
                }
                statsChanged = true;
            }
            if (statsChanged && typeof PubSub !== 'undefined') {
                PubSub.publish('stats:updated');
            }
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('item:consumed', { id, quantity: qty });
            PubSub.publish('inventory:changed', State.inventory);
        }
        return true;
    },
    getItems(includeEquipment = true) {
        const items = Object.entries(State.inventory).map(([id, data]) => {
            const itemData = ItemGenerator.itemList.find(i => i.id === id) || {};
            return {
                id,
                name: itemData.name || id,
                rarity: itemData.rarity || 'common',
                // expose item type for UI logic like consumable buttons
                type: itemData.type || 'resource',
                quantity: data.quantity,
                image: itemData.image,
                description: itemData.description || '',
                effect: itemData.getEffectDescription ? itemData.getEffectDescription() : ''
            };
        });

        const rarityOrder = RARITY_CLASSES.slice().reverse();
        items.sort((a, b) => {
            const ra = rarityOrder.indexOf(a.rarity);
            const rb = rarityOrder.indexOf(b.rarity);
            if (ra !== rb) return ra - rb;
            return a.name.localeCompare(b.name);
        });
        let result = items;
        if (!includeEquipment) {
            result = result.filter(it => it.type !== 'equipment');
        }
        if (State.hideRarityEnabled) {
            const threshold = RARITY_CLASSES.indexOf(State.hideBelowRarity);
            result = result.filter(it => RARITY_CLASSES.indexOf(it.rarity) >= threshold);
        }

        return result;
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
