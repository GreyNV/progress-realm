// Compatibility shim. The browser runtime installs `FurnitureUI` from `src/ui`.
const FurnitureUI = globalThis.FurnitureUI || {
    listEl: null,
    init() {
        this.listEl = document.getElementById('furniture-list');
        if (!this.listEl) return;
        this.render();
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('furniture:updated', () => this.render());
            // Re-render when inventory changes so affordable items highlight
            PubSub.subscribe('inventory:changed', () => this.render());
        }
    },
    render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';
        const home = HomeSystem.homes.find(h => h.id === State.homeId);
        const limit = home ? home.furnitureSlots : 0;
        const used = State.furniture.length;
        FurnitureSystem.furniture.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f.name;
            const owned = State.furniture.find(x => x.id === f.id);
            let cost = f.cost;
            if (owned) {
                const missing = Math.max(f.durability - owned.durability, 0);
                const ratio = missing / f.durability;
                cost = {};
                for (const [k, val] of Object.entries(f.cost)) {
                    cost[k] = Math.ceil(val * ratio);
                }
                li.dataset.tooltip = `${f.description}\nRefresh: ${Utils.formatCost(cost)}`;
            } else {
                li.dataset.tooltip = `${f.description}\nCost: ${Utils.formatCost(cost)}`;
            }
            const canAfford = Inventory.canAfford(cost);
            const slotsAvailable = owned || used < limit;
            if (canAfford && slotsAvailable) li.classList.add('affordable');
            li.addEventListener('click', () => FurnitureSystem.purchase(f.id));
            li.setAttribute('draggable', 'true');
            li.addEventListener('dragstart', () => li.classList.add('dragging'));
            li.addEventListener('dragend', () => li.classList.remove('dragging'));
            this.listEl.appendChild(li);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { FurnitureUI };
}
