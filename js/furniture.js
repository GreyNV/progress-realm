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

function formatCost(cost = {}) {
    return Object.entries(cost)
        .map(([id, qty]) => {
            const item = ItemGenerator.itemList.find(i => i.id === id);
            const name = item ? item.name : id;
            return `${qty}x ${name}`;
        })
        .join(', ');
}

const FurnitureSystem = {
    furniture: [],
    listEl: null,
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
    init() {
        this.listEl = document.getElementById('furniture-list');
        if (!this.listEl) return;
        this.render();
    },
    render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';
        this.furniture.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f.name;
            li.dataset.tooltip = `${f.description}\nCost: ${formatCost(f.cost)}`;
            li.addEventListener('click', () => this.purchase(f.id));
            this.listEl.appendChild(li);
        });
    },
    purchase(id) {
        const item = this.furniture.find(f => f.id === id);
        if (!item) return;
        if (!Inventory.canAfford(item.cost)) return;
        Inventory.consumeCost(item.cost);
        State.furniture.push({ id: item.id, durability: item.durability });
        HomeSystem.updateSlot();
        item.unlocks.forEach(a => PubSub.publish('unlock:action', a));
        this.render();
        SaveSystem.save();
    },
    decay(days = 1) {
        let changed = false;
        State.furniture = State.furniture.filter(f => {
            f.durability -= days * DURABILITY_DECAY_RATE;
            if (f.durability > 0) return true;
            changed = true;
            return false;
        });
        if (changed) HomeSystem.updateSlot();
    }
};

if (typeof module !== 'undefined') {
    module.exports = { FurnitureSystem, Furniture };
}
