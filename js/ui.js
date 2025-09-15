// Agents: DOM manipulation layer. Each UI object mirrors part of `State` and
// should be updated by calling its `update()` method every UI tick. No game
// logic should live here.

const StatsUI = {
    list: [],
    init() {
        // Exclude hidden stats such as charisma from the UI.
        this.list = STAT_KEYS.filter(k => k !== 'charisma');
    },
    translate() {
        document.querySelectorAll('#stats-list .stat-label').forEach(el => {
            const key = el.dataset.key;
            el.textContent = Lang.stat(key) || capitalize(key);
        });
    },
    update() {
        this.list.forEach(key => {
            const value = getStatValue(key);
            const li = document.getElementById(`stat-${key}`)?.parentElement;
            if (li && key !== 'strength' && key !== 'intelligence') {
                li.style.display = value > 0 ? '' : 'none';
            }
            document.getElementById(`stat-${key}`).textContent = formatNumber(value);
            const capEl = document.getElementById(`stat-${key}-cap`);
            const cap = SoftCapSystem.statCaps[key] !== undefined
                ? SoftCapSystem.statCaps[key]
                : getStatMax(key);
            if (capEl) capEl.textContent = formatNumber(cap);
            document.getElementById(`stat-${key}-delta`).textContent = formatDelta(statDeltas[key]);
        });
    }
};

const ResourcesUI = {
    list: [],
    init() {
        this.list = RESOURCE_KEYS.slice();
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
