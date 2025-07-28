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
        const currentHome = this.homes.find(h => h.id === State.homeId);
        // Ensure a valid home is always selected. If none is set or the
        // current id doesn't exist in the loaded list, fall back to the
        // default option.
        if (!currentHome && defaultHome) {
            setState('homeId', defaultHome.id);
            if (!Array.isArray(State.homesOwned)) {
                setState('homesOwned', []);
            }
            if (!State.homesOwned.includes(defaultHome.id)) {
                pushState('homesOwned', defaultHome.id);
            }
            SaveSystem.save();
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('home:changed', State.homeId);
        }
    },
    setHome(id) {
        const home = this.homes.find(h => h.id === id);
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
        SaveSystem.save();
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('home:changed', id);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { HomeSystem, Home };
}
