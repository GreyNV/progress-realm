// CharacterUI renders equipment slots and available equipment items.
// It listens for inventory and equipment changes via PubSub.
const CharacterUI = {
    init() {
        this.slotContainer = document.getElementById('equipment-slots');
        this.itemContainer = document.getElementById('equipment-items');
        this.heading = document.getElementById('equipment-heading');
        if (this.heading) {
            this.heading.textContent = Lang.ui('Equipment') || 'Equipment';
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('inventory:changed', () => this.updateItems());
            PubSub.subscribe('equipment:changed', (_, eq) => this.updateSlots(eq));
        }
        this.updateSlots(State.equipment);
        this.updateItems();
    },
    updateSlots(equipped = State.equipment) {
        if (!this.slotContainer) return;
        this.slotContainer.innerHTML = '';
        Object.entries(equipped).forEach(([slot, itemId]) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'slot';
            slotEl.dataset.slot = slot;
            const label = document.createElement('span');
            label.className = 'label';
            label.textContent = Lang.ui(slot) || capitalize(slot);
            slotEl.appendChild(label);
            if (itemId) {
                const item = ItemGenerator.itemList.find(i => i.id === itemId);
                if (item && item.image) {
                    slotEl.style.backgroundImage = `url(${item.image})`;
                }
                slotEl.dataset.tooltip = capitalize(item ? item.name : itemId);
            }
            slotEl.addEventListener('click', () => {
                if (State.equipment[slot]) {
                    Equipment.unequip(slot);
                }
            });
            this.slotContainer.appendChild(slotEl);
        });
    },
    updateItems() {
        if (!this.itemContainer) return;
        this.itemContainer.innerHTML = '';
        const items = Inventory.getItems(true).filter(it => it.type === 'equipment');
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'slot';
            if (item.image) {
                itemEl.style.backgroundImage = `url(${item.image})`;
            }
            itemEl.classList.add(`rarity-${item.rarity}`);
            const label = document.createElement('span');
            label.className = 'label';
            label.textContent = capitalize(item.name);
            itemEl.appendChild(label);
            itemEl.addEventListener('click', () => {
                const emptySlot = Object.entries(State.equipment).find(([, v]) => !v);
                if (emptySlot) {
                    Equipment.equip(item.id, emptySlot[0]);
                }
            });
            this.itemContainer.appendChild(itemEl);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { CharacterUI };
}
