// InventoryUI handles rendering of the player's inventory grid.
// It should not modify game state directly.
const InventoryUI = {
    init() {
        this.container = document.getElementById('inventory-slots');
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('inventory:changed', () => this.update());
        }
        this.update();
    },
    update() {
        if (!this.container) return;
        const items = Inventory
            .getItems(false)
            .filter(it => it.type === 'consumable' || it.type === 'resource');
        this.container.innerHTML = '';
        const groups = {};
        // Group items by type so each section can be labeled
        items.forEach(item => {
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
        });
        const typeLabels = {
            consumable: 'Consumables',
            resource: 'Resources'
        };
        Object.keys(groups).forEach(type => {
            const heading = document.createElement('h3');
            const labelKey = typeLabels[type] || type;
            heading.textContent = Lang.ui(labelKey) || labelKey;
            this.container.appendChild(heading);
            groups[type].forEach(item => {
                const slot = document.createElement('div');
                slot.className = 'slot';
                const label = document.createElement('span');
                label.className = 'label';
                const countEl = document.createElement('span');
                countEl.className = 'count';
                label.textContent = capitalize(item.name);
                countEl.textContent = item.quantity;
                // Use the item's image if provided; otherwise clear any background
                if (item.image) {
                    slot.style.backgroundImage = `url(${item.image})`;
                } else {
                    slot.style.backgroundImage = 'none';
                }
                slot.classList.add(`rarity-${item.rarity}`);
                const lines = [item.description];
                if (item.effect) lines.push(item.effect);
                slot.dataset.tooltip = lines.join('\n');
                // add a button to consume items directly from the inventory
                if (item.type === 'consumable') {
                    const btn = document.createElement('button');
                    btn.textContent = '🍽️';
                    btn.className = 'consume-btn';
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        Inventory.consume(item.id);
                    });
                    slot.appendChild(btn);
                }
                slot.appendChild(label);
                slot.appendChild(countEl);
                this.container.appendChild(slot);
            });
        });
    }
};

