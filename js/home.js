class Home {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.rarity = data.rarity || 'common';
        this.furnitureSlots = data.furnitureSlots || 0;
        this.cost = data.cost || {};
    }
}

const HomeSystem = {
    homes: [],
    async load() {
        try {
            const res = await fetch('data/homes.json');
            const json = await res.json();
            this.homes = json.map(h => new Home(h));
        } catch (e) {
            console.error('Failed to load homes', e);
            this.homes = [];
        }
        const defaultHome = this.homes.find(h => h.default);
        if (!State.homeId && defaultHome) {
            setState('homeId', defaultHome.id);
            SaveSystem.save();
        }
    },
    setHome(id) {
        const home = this.homes.find(h => h.id === id);
        if (!home) return;
        if (!Inventory.canAfford(home.cost)) return;
        Inventory.consumeCost(home.cost);
        setState('homeId', id);
        SaveSystem.save();
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('home:changed', id);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { HomeSystem, Home };
}
