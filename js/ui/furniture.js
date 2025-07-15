const FurnitureUI = {
    listEl: null,
    init() {
        this.listEl = document.getElementById('furniture-list');
        if (!this.listEl) return;
        this.render();
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('furniture:updated', () => this.render());
        }
    },
    render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';
        FurnitureSystem.furniture.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f.name;
            li.dataset.tooltip = `${f.description}\nCost: ${Utils.formatCost(f.cost)}`;
            if (Inventory.canAfford(f.cost)) li.classList.add('affordable');
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
