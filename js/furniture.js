class Furniture {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.cost = data.cost || 0;
        this.unlocks = data.unlocks || [];
    }
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
            li.dataset.tooltip = `${f.description}\nCost: ${f.cost}`;
            li.addEventListener('click', () => this.purchase(f.id));
            this.listEl.appendChild(li);
        });
    },
    purchase(id) {
        const item = this.furniture.find(f => f.id === id);
        if (!item) return;
        State.furniture.push(id);
        item.unlocks.forEach(a => PubSub.publish('unlock:action', a));
        this.render();
        SaveSystem.save();
    }
};

if (typeof module !== 'undefined') {
    module.exports = { FurnitureSystem, Furniture };
}
