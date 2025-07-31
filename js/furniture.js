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

        const idx = State.furniture.findIndex(f => f.id === id);
        const home = HomeSystem.homes.find(h => h.id === State.homeId);
        const limit = home ? home.furnitureSlots : 0;

        if (idx === -1) {
            // Purchasing a new furniture item
            if (State.furniture.length >= limit && limit > 0) {
                return; // no available slots
            }
            if (!Inventory.canAfford(item.cost)) return;
            Inventory.consumeCost(item.cost);
            pushState(['furniture'], { id: item.id, durability: item.durability });
            item.unlocks.forEach(a => PubSub.publish('unlock:action', a));
        } else {
            // Refresh durability for an owned item
            const current = State.furniture[idx];
            const missing = item.durability - current.durability;
            if (missing <= 0) return;
            const ratio = missing / item.durability;
            const cost = {};
            for (const [res, qty] of Object.entries(item.cost)) {
                cost[res] = Math.ceil(qty * ratio);
            }
            if (!Inventory.canAfford(cost)) return;
            Inventory.consumeCost(cost);
            setState(['furniture', idx, 'durability'], item.durability);
        }

        if (typeof PubSub !== 'undefined') {
            PubSub.publish('furniture:updated');
            PubSub.publish('furniture:durabilityChanged');
        }
        SaveSystem.save();
    },
    use(actionId, seconds = 1) {
        let changed = false;
        const removedUnlocks = [];
        const destroyed = [];
        const updated = State.furniture.filter(f => {
            const def = this.furniture.find(x => x.id === f.id);
            if (!def) return false;
            if (def.unlocks.includes(actionId)) {
                f.durability -= seconds * DURABILITY_USE_RATE;
                if (f.durability < 0) f.durability = 0;
            }
            if (f.durability > 0) return true;
            changed = true;
            removedUnlocks.push(...def.unlocks);
            destroyed.push({ id: f.id, unlocks: def.unlocks });
            return false;
        });
        setState('furniture', updated);
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('furniture:durabilityChanged');
            if (changed) {
                destroyed.forEach(d => PubSub.publish('furniture:destroyed', d));
                PubSub.publish('furniture:updated');
            }
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { FurnitureSystem, Furniture };
}
