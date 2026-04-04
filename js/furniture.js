// Legacy compatibility module for Node-based tests.
// The live browser runtime uses the typed dwelling system from `src/systems`.

const DURABILITY_USE_RATE = 0.1;

class Furniture {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.cost = data.cost || {};
        this.durability = data.durability || 1;
        this.unlocks = data.unlocks || [];
        this.adventureBonuses = data.adventureBonuses || {};
    }
}

const FurnitureSystem = (typeof window !== 'undefined' && window.FurnitureSystem) || {
    furniture: [],
    async load() {},
    purchase(id) {
        const item = this.furniture.find(entry => entry.id === id);
        if (!item) return;

        const home = typeof HomeSystem !== 'undefined' && HomeSystem.homes.find(entry => entry.id === State.homeId);
        const limit = home ? home.furnitureSlots : 0;
        const existing = State.furniture.find(entry => entry.id === id);

        if (existing) {
            const missing = item.durability - existing.durability;
            if (missing <= 0) return;
            const cost = {};
            const ratio = missing / item.durability;
            for (const [key, value] of Object.entries(item.cost)) {
                cost[key] = Math.ceil(value * ratio);
            }
            if (!Inventory.canAfford(cost)) return;
            Inventory.consumeCost(cost);
            existing.durability = item.durability;
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('furniture:durabilityChanged');
                PubSub.publish('furniture:updated');
            }
            if (typeof SaveSystem !== 'undefined' && SaveSystem.save) {
                SaveSystem.save();
            }
            return;
        }

        if (State.furniture.length >= limit) return;
        if (!Inventory.canAfford(item.cost)) return;

        Inventory.consumeCost(item.cost);
        pushState(['furniture'], { id: item.id, durability: item.durability });
        if (typeof PubSub !== 'undefined') {
            item.unlocks.forEach(actionId => PubSub.publish('unlock:action', actionId));
            PubSub.publish('furniture:updated');
        }
        if (typeof SaveSystem !== 'undefined' && SaveSystem.save) {
            SaveSystem.save();
        }
    },
    use(actionId, seconds = 1) {
        let changed = false;
        const removedUnlocks = [];
        const updated = State.furniture.filter(record => {
            const definition = this.furniture.find(entry => entry.id === record.id);
            if (!definition) return false;
            if (definition.unlocks.includes(actionId)) {
                record.durability -= seconds * DURABILITY_USE_RATE;
                if (record.durability < 0) record.durability = 0;
            }
            if (record.durability > 0) return true;
            changed = true;
            removedUnlocks.push(...definition.unlocks);
            return false;
        });
        setState('furniture', updated);
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('furniture:durabilityChanged');
            if (changed) {
                removedUnlocks.forEach(actionId => PubSub.publish('lock:action', actionId));
                PubSub.publish('furniture:updated');
            }
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { FurnitureSystem, Furniture };
}
