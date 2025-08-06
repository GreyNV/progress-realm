const ResourcesTab = {
    container: null,
    entries: {},
    init() {
        this.container = document.getElementById('resource-list');
        if (!this.container) return;
        Object.keys(State.resources).forEach(name => {
            const el = this._createEntry(name, State.resources[name]);
            this.container.appendChild(el);
        });
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('resource:changed', data => this.update(data.name));
        }
    },
    _createEntry(name, res) {
        const li = document.createElement('li');
        li.className = 'resource-item';
        const btn = document.createElement('button');
        btn.className = 'resource-btn';
        const amt = document.createElement('span');
        amt.className = 'resource-amount';
        amt.textContent = `${res.value}/${ResourceSystem.max(res)}`;
        const label = document.createElement('span');
        label.className = 'resource-label';
        label.textContent = Lang.resource(name) || capitalize(name);
        btn.appendChild(amt);
        btn.appendChild(label);
        li.appendChild(btn);
        const detail = document.createElement('div');
        detail.className = 'resource-detail hidden';
        const mods = document.createElement('ul');
        mods.className = 'resource-mods';
        detail.appendChild(mods);
        li.appendChild(detail);
        btn.addEventListener('click', () => {
            detail.classList.toggle('hidden');
        });
        this.entries[name] = { amount: amt, mods: mods };
        this._renderMods(name, res);
        return li;
    },
    _renderMods(name, res) {
        const list = this.entries[name].mods;
        list.innerHTML = '';
        res.maxAdditions.forEach(a => {
            const li = document.createElement('li');
            li.textContent = `+${a}`;
            list.appendChild(li);
        });
        res.maxMultipliers.forEach(m => {
            const li = document.createElement('li');
            li.textContent = `×${m}`;
            list.appendChild(li);
        });
    },
    update(name) {
        const res = State.resources[name];
        if (!res) return;
        if (!this.entries[name]) {
            const el = this._createEntry(name, res);
            this.container.appendChild(el);
            return;
        }
        this.entries[name].amount.textContent = `${res.value}/${ResourceSystem.max(res)}`;
        this._renderMods(name, res);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ResourcesTab };
}

