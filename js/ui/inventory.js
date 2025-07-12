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
        const items = Inventory.getItems();
        const count = items.length;
        this.container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            const label = document.createElement('span');
            label.className = 'label';
            const countEl = document.createElement('span');
            countEl.className = 'count';
            if (items[i]) {
                const item = items[i];
                label.textContent = capitalize(item.name);
                countEl.textContent = item.quantity;
                if (item.image) {
                    slot.style.backgroundImage = `url(${item.image})`;
                }
                slot.classList.add(`rarity-${item.rarity}`);
                const lines = [item.description];
                if (item.effect) lines.push(item.effect);
                slot.dataset.tooltip = lines.join('\n');
            } else {
                slot.style.backgroundImage = 'none';
                label.textContent = '';
                countEl.textContent = '';
                slot.dataset.tooltip = '';
            }
            slot.appendChild(label);
            slot.appendChild(countEl);
            this.container.appendChild(slot);
        }
    }
};

