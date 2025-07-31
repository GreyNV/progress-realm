const FurnitureUI = {
    listEl: null,
    expandedFurniture: new Set(),
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
        const prevExpanded = new Set(this.expandedFurniture);
        this.listEl.innerHTML = '';
        FurnitureSystem.furniture.forEach(f => {
            const li = document.createElement('li');
            li.classList.add('expandable');
            const label = document.createElement('span');
            label.textContent = f.name;
            li.appendChild(label);
            const arrow = document.createElement('span');
            arrow.className = 'expand-arrow';
            arrow.textContent = '▶';
            li.appendChild(arrow);
            const detail = document.createElement('div');
            detail.className = 'expand-details';
            detail.innerHTML = `${f.description}<br>Cost: ${Utils.formatCost(f.cost)}`;
            li.appendChild(detail);
            if (Inventory.canAfford(f.cost)) li.classList.add('affordable');
            li.addEventListener('click', () => FurnitureSystem.purchase(f.id));
            li.setAttribute('draggable', 'true');
            li.addEventListener('dragstart', () => li.classList.add('dragging'));
            li.addEventListener('dragend', () => li.classList.remove('dragging'));
            if (prevExpanded.has(f.id)) {
                li.classList.add('expanded');
                arrow.textContent = '▼';
                this.expandedFurniture.add(f.id);
            }
            arrow.addEventListener('click', e => {
                e.stopPropagation();
                const expanded = li.classList.toggle('expanded');
                arrow.textContent = expanded ? '▼' : '▶';
                if (expanded) this.expandedFurniture.add(f.id); else this.expandedFurniture.delete(f.id);
            });
            this.listEl.appendChild(li);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { FurnitureUI };
}
