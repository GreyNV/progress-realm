// CharacterUI renders equipment slots.
// It listens for equipment changes via PubSub.
const CharacterUI = {
    init() {
        this.leftContainer = document.getElementById('character-slots-left');
        this.rightContainer = document.getElementById('character-slots-right');
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('equipment:changed', (_, eq) => this.updateSlots(eq));
            // rebuild the display when the interface language changes
            PubSub.subscribe('lang:changed', () => {
                this.updateSlots();
                this.updateItems();
            });
        }
        this.updateSlots(State.equipment);
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
    }
};

if (typeof module !== 'undefined') {
    module.exports = { CharacterUI };
}
