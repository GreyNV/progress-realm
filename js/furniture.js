const DURABILITY_DECAY_RATE = 0.1; // proportion of durability lost per day

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
        HomeUI.updateSlot();
        item.unlocks.forEach(a => PubSub.publish('unlock:action', a));
        FurnitureUI.render();
        SaveSystem.save();
    },
    decay(days = 1) {
        let changed = false;
        const updated = State.furniture.filter(f => {
            f.durability -= days * DURABILITY_DECAY_RATE;
            if (f.durability > 0) return true;
            changed = true;
            return false;
        });
        setState('furniture', updated);
        if (changed) HomeUI.updateSlot();
    }
};

const FurnitureUI = {
    listEl: null,
    init() {
        this.listEl = document.getElementById('furniture-list');
        if (!this.listEl) return;
        this.render();
    },
    render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';
        FurnitureSystem.furniture.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f.name;
            li.dataset.tooltip = `${f.description}\nCost: ${Utils.formatCost(f.cost)}`;
            li.addEventListener('click', () => FurnitureSystem.purchase(f.id));
            this.listEl.appendChild(li);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { FurnitureSystem, FurnitureUI, Furniture };
}
