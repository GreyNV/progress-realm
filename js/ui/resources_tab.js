if (typeof formatNumber === 'undefined' && typeof require !== 'undefined') {
    const utils = require('../utils');
    if (utils && typeof utils.formatNumber === 'function') {
        if (typeof globalThis !== 'undefined') {
            globalThis.formatNumber = utils.formatNumber;
        } else if (typeof window !== 'undefined') {
            window.formatNumber = utils.formatNumber;
        } else if (typeof global !== 'undefined') {
            global.formatNumber = utils.formatNumber;
        }
    }
}

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
            PubSub.subscribe('resources:updated', () => {
                Object.keys(State.resources).forEach(name => this.update(name));
            });
            PubSub.subscribe('stats:updated', () => {
                Object.keys(State.stats).forEach(name => this.update(name));
            });
            PubSub.subscribe('prestige:updated', () => {
                Object.keys(State.prestige).forEach(name => this.update(name));
            });
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
        amt.textContent = this._formatAmount(res.value);
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
        const softcapEl = document.createElement('p');
        softcapEl.className = 'resource-softcap';
        softcapEl.textContent = this._buildSoftcapText(group, name, res);
        detail.appendChild(softcapEl);
        const mods = document.createElement('ul');
        mods.className = 'resource-mods';
        detail.appendChild(mods);
        li.appendChild(detail);
        btn.addEventListener('click', () => {
            detail.classList.toggle('hidden');
        });
        this.entries[name] = { amount: amt, mods: mods, group: group, softcap: softcapEl };
        this._renderMods(name, res);
        return li;
    },
    _renderMods(name, res) {
        const entry = this.entries[name];
        const list = entry.mods;
        list.innerHTML = '';
        (res.maxAdditions || []).forEach(a => {
            const li = document.createElement('li');
            li.textContent = `+${formatNumber(a)}`;
            list.appendChild(li);
        });
        (res.maxMultipliers || []).forEach(m => {
            const li = document.createElement('li');
            li.textContent = `×${formatNumber(m)}`;
            list.appendChild(li);
        });
    },
    _formatAmount(value) {
        if (value === undefined || value === null) {
            return '—';
        }
        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
            return formatNumber(numeric);
        }
        return '∞';
    },
    _resolveCapValue(group, name, res) {
        const softCapSystem = (typeof SoftCapSystem !== 'undefined' && SoftCapSystem) ? SoftCapSystem : null;
        if (group === 'stats' || group === 'prestige') {
            if (softCapSystem && typeof softCapSystem.getStatCap === 'function') {
                const cap = softCapSystem.getStatCap(name);
                if (cap !== undefined && cap !== null) {
                    return cap;
                }
            }
            if (typeof StatSystem !== 'undefined' && StatSystem && typeof StatSystem.max === 'function' && res) {
                return StatSystem.max(res);
            }
            return undefined;
        }
        if (softCapSystem && typeof softCapSystem.getResourceCap === 'function') {
            const cap = softCapSystem.getResourceCap(name);
            if (cap !== undefined && cap !== null) {
                return cap;
            }
        }
        if (typeof ResourceSystem !== 'undefined' && ResourceSystem && typeof ResourceSystem.max === 'function' && res) {
            return ResourceSystem.max(res);
        }
        return undefined;
    },
    _buildSoftcapText(group, name, res) {
        const cap = this._resolveCapValue(group, name, res);
        if (cap === undefined || cap === null) {
            return 'Softcap: —';
        }
        const numericCap = Number(cap);
        if (Number.isFinite(numericCap)) {
            return `Softcap: ${formatNumber(numericCap)}`;
        }
        return 'Softcap: ∞';
    },
    _updateSoftcap(name, group, res) {
        const entry = this.entries[name];
        if (!entry || !entry.softcap) return;
        entry.softcap.textContent = this._buildSoftcapText(group, name, res);
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
        const entry = this.entries[name];
        entry.group = group;
        entry.amount.textContent = this._formatAmount(res.value);
        this._updateSoftcap(name, group, res);
        this._renderMods(name, res);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ResourcesTab };
}

