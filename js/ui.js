// Agents: DOM manipulation layer. Each UI object mirrors part of `State` and
// should be updated by calling its `update()` method every UI tick. No game
// logic should live here.

const StatsUI = {
    list: [],
    init() {
        // Exclude hidden stats such as charisma and creativity from the UI.
        // Creativity will be unlocked in a later update.
        this.list = STAT_KEYS.filter(k => k !== 'charisma' && k !== 'creativity');
        const listEl = document.getElementById('stats-list');
        this.list.forEach(key => {
            const li = document.createElement('li');
            const label = document.createElement('span');
            label.className = 'stat-label';
            label.dataset.key = key;
            label.textContent = Lang.stat(key) || capitalize(key);
            li.appendChild(label);
            li.insertAdjacentHTML('beforeend', `: <span id="stat-${key}">0</span>/<span id="stat-${key}-cap">0</span> (<span id="stat-${key}-delta" class="delta">0</span>/s)`);
            listEl.appendChild(li);
        });
    },
    translate() {
        document.querySelectorAll('#stats-list .stat-label').forEach(el => {
            const key = el.dataset.key;
            el.textContent = Lang.stat(key) || capitalize(key);
        });
    },
    update() {
        this.list.forEach(key => {
            document.getElementById(`stat-${key}`).textContent = getStatValue(key).toFixed(1);
            const capEl = document.getElementById(`stat-${key}-cap`);
            const cap = SoftCapSystem.statCaps[key] !== undefined
                ? SoftCapSystem.statCaps[key]
                : getStatMax(key);
            if (capEl) capEl.textContent = cap.toFixed(1);
            document.getElementById(`stat-${key}-delta`).textContent = formatDelta(statDeltas[key]);
        });
    }
};

const PrestigeUI = {
    list: [],
    init() {
        this.list = PRESTIGE_KEYS.filter(k => k !== 'creativity');
        this.container = document.getElementById('prestige-block');
        this.update();
    },
    update() {
        if (!this.container) return;
        let show = false;
        this.list.forEach(key => {
            const val = State.prestige[key] || 0;
            const stat = Object.keys(PRESTIGE_MAP).find(k => PRESTIGE_MAP[k] === key);
            const gain = stat ? Math.floor(Math.log10(State.stats[stat].value + 1)) : 0;
            const el = document.getElementById(`prestige-${key}`);
            const gainEl = document.getElementById(`prestige-${key}-gain`);
            if (el) el.textContent = val;
            if (gainEl) gainEl.textContent = `(+${gain})`;
            if (val > 0) show = true;
        });
        this.container.style.display = show ? 'block' : 'none';
    }
};

const ResourcesUI = {
    list: [],
    init() {
        this.list = RESOURCE_KEYS.slice();
        const listEl = document.getElementById("resources-list");
        this.list.forEach(key => {
            const li = document.createElement("li");
            const label = document.createElement('span');
            label.className = 'resource-label';
            label.dataset.key = key;
            label.textContent = Lang.resource(key) || capitalize(key);
            li.appendChild(label);
            const bar = document.createElement('div');
            bar.className = `resource-bar ${key}-bar`;
            const fill = document.createElement('div');
            fill.className = 'resource-bar-fill';
            fill.id = `res-${key}-fill`;
            bar.appendChild(fill);
            li.appendChild(bar);
            li.insertAdjacentHTML('beforeend', ` (<span id="res-${key}-delta" class="delta">0</span>/s)`);
            listEl.appendChild(li);
        });
    },
    translate() {
        document.querySelectorAll('#resources-list .resource-label').forEach(el => {
            const key = el.dataset.key;
            el.textContent = Lang.resource(key) || capitalize(key);
        });
    },
    update() {
        this.list.forEach(key => {
            const value = getResourceValue(key);
            const cap = SoftCapSystem.resourceCaps[key] !== undefined
                ? SoftCapSystem.resourceCaps[key]
                : getResourceMax(key);
            const fill = document.getElementById(`res-${key}-fill`);
            if (fill) {
                const percent = cap > 0 ? Math.min(value / cap, 1) * 100 : 0;
                fill.style.width = `${percent}%`;
            }
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
            div.innerHTML = msg;
            this.el.appendChild(div);
            if (this.container) {
                this.container.scrollTop = this.container.scrollHeight;
            }
        }
    }
};
