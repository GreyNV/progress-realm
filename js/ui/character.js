// CharacterUI renders equipment slots and available equipment items.
// It listens for inventory and equipment changes via PubSub.
const CharacterUI = {
    init() {
        this.leftContainer = document.getElementById('character-slots-left');
        this.rightContainer = document.getElementById('character-slots-right');
        this.itemContainer = document.getElementById('equipment-items');
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('inventory:changed', () => this.updateItems());
            PubSub.subscribe('equipment:changed', (_, eq) => this.updateSlots(eq));
            // rebuild the display when the interface language changes
            PubSub.subscribe('lang:changed', () => {
                this.updateSlots();
                this.updateItems();
            });
        }
        this.updateSlots(State.equipment);
        this.updateItems();
    },
    updateSlots(equipped = State.equipment) {
        if (!this.leftContainer || !this.rightContainer) return;
        this.leftContainer.innerHTML = '';
        this.rightContainer.innerHTML = '';
        const leftSlots = ['head', 'leftHand', 'ring1', 'pants', 'boots'];
        const rightSlots = ['armor', 'rightHand', 'gloves', 'ring2', 'necklace'];
        const buildSlot = (slot, itemId) => {
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
                } else {
                    slotEl.style.backgroundImage = 'none';
                }
                slotEl.dataset.tooltip = capitalize(item ? item.name : itemId);
            }
            slotEl.addEventListener('click', () => {
                if (State.equipment[slot]) {
                    Equipment.unequip(slot);
                }
            });
            return slotEl;
        };
        leftSlots.forEach(slot => {
            this.leftContainer.appendChild(buildSlot(slot, equipped[slot]));
        });
        rightSlots.forEach(slot => {
            this.rightContainer.appendChild(buildSlot(slot, equipped[slot]));
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
            const equipBtn = document.createElement('button');
            equipBtn.textContent = Lang.ui('Equip') || 'Equip';
            equipBtn.addEventListener('click', () => Equipment.equip(item.id));
            itemEl.appendChild(equipBtn);
            this.itemContainer.appendChild(itemEl);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { CharacterUI };
}
