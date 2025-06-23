
const StatsUI = {
    list: ['strength', 'intelligence', 'creativity'],
    init() {
        const listEl = document.getElementById('stats-list');
        this.list.forEach(key => {
            const li = document.createElement('li');
            li.innerHTML = `${capitalize(key)}: <span id="stat-${key}">0</span>/<span id="stat-${key}-cap">0</span> (<span id="stat-${key}-delta" class="delta">0</span>/s)`;
            listEl.appendChild(li);
        });
    },
    update() {
        this.list.forEach(key => {
            document.getElementById(`stat-${key}`).textContent = State.stats[key].toFixed(1);
            const capEl = document.getElementById(`stat-${key}-cap`);
            if (capEl) capEl.textContent = SoftCapSystem.statCaps[key].toFixed(1);
            document.getElementById(`stat-${key}-delta`).textContent = formatDelta(statDeltas[key]);
        });
    }
};

const ResourcesUI = {
    list: ["energy", "focus", "health", "money"],
    init() {
        const listEl = document.getElementById("resources-list");
        this.list.forEach(key => {
            const li = document.createElement("li");
            li.innerHTML = `${capitalize(key)}: <span id="res-${key}">0</span>/<span id="res-${key}-cap">0</span> (<span id="res-${key}-delta" class="delta">0</span>/s)`;
            listEl.appendChild(li);
        });
    },
    update() {
        this.list.forEach(key => {
            document.getElementById(`res-${key}`).textContent = getResourceValue(key).toFixed(1);
            const capEl = document.getElementById(`res-${key}-cap`);
            if (capEl) capEl.textContent = SoftCapSystem.resourceCaps[key].toFixed(1);
            document.getElementById(`res-${key}-delta`).textContent = formatDelta(resourceDeltas[key]);
        });
    }
};

const MasteryUI = {
    init() {
        const el = document.getElementById('mastery-points');
        if (el) el.textContent = State.masteryPoints;
    },
    update() {
        const el = document.getElementById('mastery-points');
        if (el) el.textContent = State.masteryPoints;
    }
};

const InventoryUI = {
    init() {
        this.container = document.getElementById('inventory-slots');
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
            } else {
                slot.style.backgroundImage = 'none';
                label.textContent = '';
                countEl.textContent = '';
            }
            slot.appendChild(label);
            slot.appendChild(countEl);
            this.container.appendChild(slot);
        }
    }
};

const Log = {
    messages: [],
    init() {
        this.container = document.getElementById('log-container');
        this.el = document.getElementById('log');
    },
    add(msg) {
        this.messages.push(msg);
        if (this.el) {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.textContent = msg;
            this.el.appendChild(div);
            if (this.container) {
                this.container.scrollTop = this.container.scrollHeight;
            }
        }
    }
};
