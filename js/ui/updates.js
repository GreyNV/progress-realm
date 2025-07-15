const UpdateUI = {
    listEl: null,
    slotContainer: null,
    init() {
        this.listEl = document.getElementById('chip-list');
        this.slotContainer = document.getElementById('chip-slots');
        if (!this.listEl || !this.slotContainer) return;
        this.renderList();
        this.createSlots();
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('updates:changed', () => {
                this.renderList();
                this.updateSlots();
            });
        }
    },
    renderList() {
        this.listEl.innerHTML = '';
        UpdateSystem.updates.forEach(u => {
            const li = document.createElement('li');
            li.textContent = u.name;
            li.dataset.updateId = u.id;
            li.dataset.tooltip = `${u.description}\nCost: ${Utils.formatCost(u.resourceConsumption)}`;
            if (Inventory.canAfford(u.resourceConsumption)) li.classList.add('affordable');
            if (u.state !== 'available') {
                li.classList.add('locked');
            } else {
                li.setAttribute('draggable', 'true');
                li.addEventListener('dragstart', e => {
                    li.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', u.id);
                });
                li.addEventListener('dragend', () => li.classList.remove('dragging'));
            }
            this.listEl.appendChild(li);
        });
    },
    createSlots() {
        while (UpdateSystem.slots.length < UpdateSystem.slotCount) {
            UpdateSystem.slots.push({ updateId: null, progress: 0, active: false });
        }
        for (let i = 0; i < UpdateSystem.slotCount; i++) {
            const slotEl = document.createElement('div');
            slotEl.className = 'slot';
            slotEl.dataset.slot = i;
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
                const index = parseInt(slotEl.dataset.slot, 10);
                UpdateSystem.start(index, id);
            });
            this.slotContainer.appendChild(slotEl);
            this.updateSlot(i);
        }
    },
    updateSlots() {
        for (let i = 0; i < UpdateSystem.slotCount; i++) {
            this.updateSlot(i);
        }
    },
    updateSlot(i) {
        const slot = UpdateSystem.slots[i];
        const slotEl = this.slotContainer.querySelector(`.slot[data-slot="${i}"]`);
        if (!slotEl) return;
        const progressEl = slotEl.querySelector('progress');
        const labelEl = slotEl.querySelector('.label');
        if (!slot.updateId) {
            progressEl.value = 0;
            progressEl.max = 1;
            labelEl.textContent = '';
            slotEl.dataset.tooltip = '';
            return;
        }
        const update = UpdateSystem.updates.find(u => u.id === slot.updateId);
        progressEl.max = 1;
        progressEl.value = slot.progress;
        labelEl.textContent = update.name;
        slotEl.dataset.tooltip = update.description;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { UpdateUI };
}
