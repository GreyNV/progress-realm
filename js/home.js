class Home {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.rarity = data.rarity || 'common';
        this.furnitureSlots = data.furnitureSlots || 0;
        this.cost = data.cost || {};
    }
}

const HomeSystem = {
    homes: [],
    async load() {
        try {
            const res = await fetch('data/homes.json');
            const json = await res.json();
            this.homes = json.map(h => new Home(h));
        } catch (e) {
            console.error('Failed to load homes', e);
            this.homes = [];
        }
    },
    setHome(id) {
        const home = this.homes.find(h => h.id === id);
        if (!home) return;
        if (!Inventory.canAfford(home.cost)) return;
        Inventory.consumeCost(home.cost);
        setState('homeId', id);
        HomeUI.updateSlot();
        SaveSystem.save();
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('home:changed', id);
        }
    }
};

const HomeUI = {
    listEl: null,
    slotContainer: null,
    furnitureContainer: null,
    init() {
        this.listEl = document.getElementById('home-list');
        this.slotContainer = document.getElementById('home-slot');
        this.furnitureContainer = document.getElementById('furniture-slots');
        if (!this.listEl || !this.slotContainer) return;
        this.renderList();
        this.createSlot();
        this.updateSlot();
    },
    renderList() {
        this.listEl.innerHTML = '';
        HomeSystem.homes.forEach(h => {
            const li = document.createElement('li');
            li.textContent = h.name;
            li.dataset.homeId = h.id;
            li.dataset.tooltip = `${h.description}\nCost: ${Utils.formatCost(h.cost)}`;
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
        for (let i = 0; i < count; i++) {
            const slot = new BaseSlot();
            const data = State.furniture[i];
            if (data) {
                const furn = FurnitureSystem.furniture.find(f => f.id === data.id);
                if (furn) {
                    slot.setLabel(furn.name);
                    slot.setImage(furn.image);
                    slot.setTooltip(`${furn.description}\nDurability: ${data.durability}/${furn.durability}`);
                }
            }
            this.furnitureContainer.appendChild(slot.el);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { HomeSystem, HomeUI, Home };
}
