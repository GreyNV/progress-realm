// Compatibility shim. The browser runtime installs `HomeUI` from `src/ui`.
const HomeUI = globalThis.HomeUI || {
    listEl: null,
    slotContainer: null,
    furnitureContainer: null,
    furnitureSlots: [],
    init() {
        this.listEl = document.getElementById('home-list');
        this.slotContainer = document.getElementById('home-slot');
        this.furnitureContainer = document.getElementById('furniture-slots');
        if (!this.listEl || !this.slotContainer) return;
        this.renderList();
        this.createSlot();
        this.updateSlot();
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('home:changed', () => this.updateSlot());
            PubSub.subscribe('furniture:updated', () => this.updateSlot());
            PubSub.subscribe('furniture:durabilityChanged', () => this.updateDurability());
            PubSub.subscribe('inventory:changed', () => this.renderList());
        }
    },
    renderList() {
        this.listEl.innerHTML = '';
        HomeSystem.homes.forEach(h => {
            if (h.default) return;
            const li = document.createElement('li');
            li.textContent = h.name;
            li.dataset.homeId = h.id;
            li.dataset.tooltip = `${h.description}\nCost: ${Utils.formatCost(h.cost)}`;
            if (Inventory.canAfford(h.cost)) li.classList.add('affordable');
            li.setAttribute('draggable', 'true');
            li.addEventListener('dragstart', e => {
                li.classList.add('dragging');
                e.dataTransfer.setData('text/plain', h.id);
            });
            li.addEventListener('dragend', () => li.classList.remove('dragging'));
            li.addEventListener('click', () => HomeSystem.setHome(h.id));
            this.listEl.appendChild(li);
        });
    },
    createSlot() {
        this.slotContainer.innerHTML = '';
        const slot = new BaseSlot(false);
        const slotEl = slot.el;
        slotEl.dataset.slot = 0;
        slotEl.addEventListener('dragover', e => e.preventDefault());
        slotEl.addEventListener('drop', e => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            HomeSystem.setHome(id);
        });
        this.slotContainer.appendChild(slotEl);
    },
    updateSlot() {
        if (!this.slotContainer) return;
        const slotEl = this.slotContainer.querySelector('.slot');
        if (!slotEl) return;
        const labelEl = slotEl.querySelector('.label');
        const home = HomeSystem.homes.find(h => h.id === State.homeId);
        if (!home) {
            labelEl.textContent = '';
            slotEl.style.backgroundImage = 'none';
            slotEl.dataset.tooltip = '';
            RARITY_CLASSES.forEach(r => slotEl.classList.remove(`rarity-${r}`));
            if (this.furnitureContainer) this.furnitureContainer.innerHTML = '';
            return;
        }
        labelEl.textContent = home.name;
        if (home.image) {
            slotEl.style.backgroundImage = `url(${home.image})`;
            slotEl.style.backgroundSize = 'cover';
        } else {
            slotEl.style.backgroundImage = 'none';
        }
        slotEl.dataset.tooltip = `${home.description}\nCost: ${Utils.formatCost(home.cost)}`;
        RARITY_CLASSES.forEach(r => slotEl.classList.remove(`rarity-${r}`));
        slotEl.classList.add(`rarity-${home.rarity}`);
        this.updateFurnitureSlots(home.furnitureSlots);
    },
    updateFurnitureSlots(count = 0) {
        if (!this.furnitureContainer) return;
        this.furnitureContainer.innerHTML = '';
        this.furnitureSlots = [];
        for (let i = 0; i < count; i++) {
            const slot = new BaseSlot();
            this.furnitureSlots.push(slot);
            const data = State.furniture[i];
            if (data) {
                const furn = FurnitureSystem.furniture.find(f => f.id === data.id);
                if (furn) {
                    slot.setLabel(furn.name);
                    slot.setImage(furn.image);
                    slot.setTooltip(`${furn.description}\nDurability: ${data.durability}/${furn.durability}`);
                    slot.setProgress(data.durability / furn.durability,
                        `${data.durability}/${furn.durability}`);
                }
            }
            this.furnitureContainer.appendChild(slot.el);
        }
    },

    updateDurability() {
        if (!this.furnitureContainer) return;
        this.furnitureSlots.forEach((slot, i) => {
            const data = State.furniture[i];
            if (!data) {
                slot.setProgress(0, '');
                slot.setTooltip('');
                slot.setLabel('');
                slot.setImage(null);
                return;
            }
            const furn = FurnitureSystem.furniture.find(f => f.id === data.id);
            if (furn) {
                const ratio = Math.max(data.durability, 0) / furn.durability;
                slot.setProgress(ratio,
                    `${data.durability.toFixed(1)}/${furn.durability}`);
                slot.setTooltip(`${furn.description}\nDurability: ${data.durability.toFixed(1)}/${furn.durability}`);
            }
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { HomeUI };
}
