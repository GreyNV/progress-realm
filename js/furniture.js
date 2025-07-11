// Durability lost per second while the furniture's action is active
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
    }
}

const FurnitureSystem = {
    furniture: [],
    async load() {
        try {
            const res = await fetch('data/furniture.json');
            const json = await res.json();
            this.furniture = json.map(f => new Furniture(f));
        } catch (e) {
            console.error('Failed to load furniture', e);
            this.furniture = [];
        }
    },
    purchase(id) {
        const item = this.furniture.find(f => f.id === id);
        if (!item) return;
        if (!Inventory.canAfford(item.cost)) return;
        Inventory.consumeCost(item.cost);
        pushState(['furniture'], { id: item.id, durability: item.durability });
        item.unlocks.forEach(a => PubSub.publish('unlock:action', a));
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('furniture:updated');
        }
        SaveSystem.save();
    },
    use(actionId, seconds = 1) {
        let changed = false;
        const removedUnlocks = [];
        const updated = State.furniture.filter(f => {
            const def = this.furniture.find(x => x.id === f.id);
            if (!def) return false;
            if (def.unlocks.includes(actionId)) {
                f.durability -= seconds * DURABILITY_USE_RATE;
            }
            if (f.durability > 0) return true;
            changed = true;
            removedUnlocks.push(...def.unlocks);
            return false;
        });
        setState('furniture', updated);
        if (changed && typeof PubSub !== 'undefined') {
            removedUnlocks.forEach(a => PubSub.publish('lock:action', a));
            PubSub.publish('furniture:updated');
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { FurnitureSystem, Furniture };
}
