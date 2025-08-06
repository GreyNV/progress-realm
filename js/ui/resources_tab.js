const ResourcesTab = {
    container: null,
    entries: {},
    init() {
        this.container = document.getElementById('resource-list');
        if (!this.container) return;
        this.container.innerHTML = '';
        Object.keys(State.stats).forEach(name => {
            this.container.appendChild(this._createEntry('stats', name, State.stats[name]));
        });
        Object.keys(State.resources).forEach(name => {
            this.container.appendChild(this._createEntry('resources', name, State.resources[name]));
        });
        Object.keys(State.prestige).forEach(name => {
            this.container.appendChild(this._createEntry('prestige', name, State.prestige[name]));
        });
        this.container.appendChild(this._createEntry('mastery', 'mastery', State.mastery));
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('resource:changed', data => this.update(data.name));
            PubSub.subscribe('stat:changed', data => this.update(data.name));
            PubSub.subscribe('prestige:changed', data => this.update(data.name));
            PubSub.subscribe('mastery:changed', () => this.update('mastery'));
        }
    },
    _getDesc(group, name) {
        switch (group) {
            case 'stats':
                return Lang.statDesc(name) || State.statDescriptions[name] || '';
            case 'resources':
                return Lang.resourceDesc(name) || State.resourceDescriptions[name] || '';
            case 'prestige':
                return Lang.prestigeDesc(name) || State.prestigeDescriptions[name] || '';
            case 'mastery':
                return Lang.resourceDesc('mastery') || State.masteryDescription || '';
        }
        return '';
    },
    _createEntry(group, name, res) {
        const li = document.createElement('li');
        li.className = 'resource-item';
        const btn = document.createElement('button');
        btn.className = 'resource-btn';
        const label = document.createElement('span');
        label.className = 'resource-label';
        if (group === 'stats') {
            label.textContent = Lang.stat(name) || capitalize(name);
        } else if (group === 'prestige') {
            label.textContent = Lang.resource(name) || Lang.stat(name) || capitalize(name);
        } else if (group === 'mastery') {
            label.textContent = Lang.resource('mastery') || Lang.ui('Mastery Points') || 'mastery';
        } else {
            label.textContent = Lang.resource(name) || capitalize(name);
        }
        const amt = document.createElement('span');
        amt.className = 'resource-amount';
        let max;
        if (group === 'stats' || group === 'prestige') {
            max = StatSystem.max(res);
        } else {
            max = ResourceSystem.max(res);
        }
        amt.textContent = max !== Infinity ? `${res.value}/${max}` : `${res.value}`;
        btn.appendChild(label);
        btn.appendChild(amt);
        li.appendChild(btn);
        const detail = document.createElement('div');
        detail.className = 'resource-detail hidden';
        const descText = this._getDesc(group, name);
        if (descText) {
            const descEl = document.createElement('p');
            descEl.className = 'resource-desc';
            descEl.textContent = descText;
            detail.appendChild(descEl);
        }
        const mods = document.createElement('ul');
        mods.className = 'resource-mods';
        detail.appendChild(mods);
        li.appendChild(detail);
        btn.addEventListener('click', () => {
            detail.classList.toggle('hidden');
        });
        this.entries[name] = { amount: amt, mods: mods, group: group };
        this._renderMods(name, res);
        return li;
    },
    _renderMods(name, res) {
        const entry = this.entries[name];
        const list = entry.mods;
        list.innerHTML = '';
        (res.maxAdditions || []).forEach(a => {
            const li = document.createElement('li');
            li.textContent = `+${a}`;
            list.appendChild(li);
        });
        (res.maxMultipliers || []).forEach(m => {
            const li = document.createElement('li');
            li.textContent = `×${m}`;
            list.appendChild(li);
        });
    },
    update(name) {
        let res = State.resources[name] || State.stats[name] || State.prestige[name];
        let group = 'resources';
        if (State.stats[name]) group = 'stats';
        else if (State.prestige[name]) group = 'prestige';
        else if (name === 'mastery') {
            res = State.mastery;
            group = 'mastery';
        }
        if (!res) return;
        if (!this.entries[name]) {
            const el = this._createEntry(group, name, res);
            this.container.appendChild(el);
            return;
        }
        const max = (group === 'stats' || group === 'prestige') ? StatSystem.max(res) : ResourceSystem.max(res);
        this.entries[name].amount.textContent = max !== Infinity ? `${res.value}/${max}` : `${res.value}`;
        this._renderMods(name, res);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ResourcesTab };
}

