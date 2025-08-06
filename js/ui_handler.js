const UIHandler = {
    async init() {
        await this.loadTabs();
        StatsUI.init();
        ResourcesUI.init();
        this.buildStats();
        this.buildResources();
        if (typeof CharacterUI !== 'undefined') {
            CharacterUI.init();
        }
        if (typeof PubSub !== 'undefined') {
            // rebuild lists when the interface language changes
            PubSub.subscribe('lang:changed', () => {
                this.buildStats();
                this.buildResources();
            });
        }
    },
    async loadTabs() {
        try {
            const res = await fetch('data/ui.json');
            const json = await res.json();
            if (json.tabs && Array.isArray(json.tabs)) {
                TabManager.load(json.tabs);
            }
        } catch (e) {
            console.error('Failed to load UI layout', e);
            TabManager.load([]);
        }
    },
    buildStats() {
        const listEl = document.getElementById('stats-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        StatsUI.list.forEach(key => {
            const li = document.createElement('li');
            const label = document.createElement('span');
            label.className = 'stat-label';
            label.dataset.key = key;
            label.textContent = Lang.stat(key) || capitalize(key);
            li.appendChild(label);
            li.insertAdjacentHTML('beforeend',
                `: <span id="stat-${key}">0</span>/<span id="stat-${key}-cap">0</span>` +
                ` (<span id="stat-${key}-delta" class="delta">0</span>/s)`);
            listEl.appendChild(li);
        });
    },
    buildResources() {
        const listEl = document.getElementById('resources-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        ResourcesUI.list.forEach(key => {
            const li = document.createElement('li');
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
            li.insertAdjacentHTML('beforeend',
                ` (<span id="res-${key}-delta" class="delta">0</span>/s)`);
            listEl.appendChild(li);
        });
    }
};
