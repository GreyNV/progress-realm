class Home {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.rarity = data.rarity || 'common';
    }
}

const HomeSystem = {
    homes: [],
    listEl: null,
    slotContainer: null,
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
    init() {
        this.listEl = document.getElementById('home-list');
        this.slotContainer = document.getElementById('home-slot');
        if (!this.listEl || !this.slotContainer) return;
        this.listEl.innerHTML = '';
        this.homes.forEach(h => {
            const li = document.createElement('li');
            li.textContent = h.name;
            li.dataset.homeId = h.id;
            li.dataset.tooltip = h.description;
            li.setAttribute('draggable', 'true');
            li.addEventListener('dragstart', e => {
                li.classList.add('dragging');
                e.dataTransfer.setData('text/plain', h.id);
            });
            li.addEventListener('dragend', () => li.classList.remove('dragging'));
            li.addEventListener('click', () => this.setHome(h.id));
            this.listEl.appendChild(li);
        });
        this.slotContainer.innerHTML = '';
        const slotEl = document.createElement('div');
        slotEl.className = 'slot';
        const label = document.createElement('span');
        label.className = 'label';
        slotEl.appendChild(label);
        const wrapper = document.createElement('div');
        wrapper.className = 'progress-wrapper';
        const prog = document.createElement('progress');
        prog.value = 0;
        prog.max = 1;
        wrapper.appendChild(prog);
        slotEl.appendChild(wrapper);
        slotEl.addEventListener('dragover', e => e.preventDefault());
        slotEl.addEventListener('drop', e => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            this.setHome(id);
        });
        this.slotContainer.appendChild(slotEl);
        this.updateSlot();
    },
    setHome(id) {
        const home = this.homes.find(h => h.id === id);
        if (!home) return;
        State.homeId = id;
        this.updateSlot();
        SaveSystem.save();
    },
    updateSlot() {
        if (!this.slotContainer) return;
        const slotEl = this.slotContainer.querySelector('.slot');
        if (!slotEl) return;
        const labelEl = slotEl.querySelector('.label');
        const home = this.homes.find(h => h.id === State.homeId);
        if (!home) {
            labelEl.textContent = '';
            slotEl.style.backgroundImage = 'none';
            slotEl.dataset.tooltip = '';
            return;
        }
        labelEl.textContent = home.name;
        if (home.image) {
            slotEl.style.backgroundImage = `url(${home.image})`;
        } else {
            slotEl.style.backgroundImage = 'none';
        }
        slotEl.dataset.tooltip = home.description;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { HomeSystem, Home };
}
