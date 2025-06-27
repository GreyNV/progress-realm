// Agents: UpdateSystem handles long term upgrades. The flow is
// UpdateSystem.load -> UpdateSystem.init -> UpdateSystem.start -> tick/apply.
// Completed updates can unlock actions and alter bonuses.
class Update {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.duration = data.duration || 1;
        this.resourceConsumption = data.resourceConsumption || {};
        this.state = data.state || 'locked';
        this.bonus = data.bonus || {};
        this.unlocks = data.unlocks || { actions: [], encounters: [] };
        this.progress = 0;
    }
}

const UpdateSystem = {
    updates: [],
    slots: [],
    slotCount: 1,
    async load() {
        try {
            const res = await fetch('data/updates.json');
            const json = await res.json();
            this.updates = json.map(u => new Update(u));
        } catch (e) {
            console.error('Failed to load updates', e);
            this.updates = [];
        }
    },
    init() {
        this.listEl = document.getElementById('update-list');
        this.slotContainer = document.getElementById('update-slots');
        if (!this.listEl || !this.slotContainer) return;
        this.updates.forEach(u => {
            const li = document.createElement('li');
            li.textContent = u.name;
            li.dataset.updateId = u.id;
            li.dataset.tooltip = u.description;
            if (u.state === 'locked') {
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
        while (this.slots.length < this.slotCount) {
            this.slots.push({ updateId: null, progress: 0, active: false });
        }
        for (let i = 0; i < this.slotCount; i++) {
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
            this.updateSlotUI(i);
        }
    },
    start(index, id) {
        const slot = this.slots[index];
        const update = this.updates.find(u => u.id === id && u.state === 'available');
        if (!update) return;
        slot.updateId = id;
        slot.progress = 0;
        slot.active = true;
        update.state = 'inProgress';
        this.updateListUI();
        this.updateSlotUI(index);
    },
    updateSlotUI(i) {
        const slot = this.slots[i];
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
        const update = this.updates.find(u => u.id === slot.updateId);
        progressEl.max = 1;
        progressEl.value = slot.progress;
        labelEl.textContent = update.name;
        slotEl.dataset.tooltip = update.description;
    },
    updateListUI() {
        this.listEl.querySelectorAll('li').forEach(li => li.remove());
        this.updates.forEach(u => {
            const li = document.createElement('li');
            li.textContent = u.name;
            li.dataset.updateId = u.id;
            li.dataset.tooltip = u.description;
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
    tick(delta) {
        this.slots.forEach((slot, i) => {
            if (!slot.active) return;
            const update = this.updates.find(u => u.id === slot.updateId);
            if (!update) return;
            slot.progress += delta / update.duration;
            this.updateSlotUI(i);
            if (slot.progress >= 1) {
                slot.active = false;
                slot.updateId = null;
                slot.progress = 0;
                update.state = 'done';
                this.applyUpdate(update);
                this.updateListUI();
                this.updateSlotUI(i);
            }
        });
    },
    applyUpdate(update) {
        if (update.bonus && update.bonus.stats) {
            for (const [k, v] of Object.entries(update.bonus.stats)) {
                BonusEngine.statAdditions[k] = (BonusEngine.statAdditions[k] || 0) + v;
            }
        }
        if (update.unlocks && update.unlocks.actions) {
            update.unlocks.actions.forEach(id => {
                if (actions[id]) actions[id].locked = false;
            });
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { UpdateSystem, Update };
}
