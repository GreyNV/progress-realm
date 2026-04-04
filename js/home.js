// Legacy compatibility module for Node-based tests.
// The live browser runtime uses the typed dwelling system from `src/systems`.

class Home {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.rarity = data.rarity || 'common';
        this.default = data.default || false;
        this.furnitureSlots = data.furnitureSlots || 0;
        this.cost = data.cost || {};
        this.adventureBonuses = data.adventureBonuses || {};
    }
}

const HomeSystem = (typeof window !== 'undefined' && window.HomeSystem) || {
    homes: [],
    async load() {},
    setHome(id) {
        const home = this.homes.find(entry => entry.id === id);
        if (!home) return;

        const owned = Array.isArray(State.homesOwned) && State.homesOwned.includes(id);
        if (!owned) {
            if (!Inventory.canAfford(home.cost)) return;
            Inventory.consumeCost(home.cost);
            if (!Array.isArray(State.homesOwned)) {
                setState('homesOwned', []);
            }
            pushState('homesOwned', id);
        }

        setState('homeId', id);
        if (typeof SaveSystem !== 'undefined' && SaveSystem.save) {
            SaveSystem.save();
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('home:changed', id);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { HomeSystem, Home };
}
