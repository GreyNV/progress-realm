// Compatibility shim. The browser runtime installs `ResourceInspector` from `src/ui`.
const ResourceInspector = globalThis.ResourceInspector || {
    buildGroup(containerId, group, keys) {
        const list = document.getElementById(containerId);
        if (!list) return;
        list.innerHTML = '';
        keys.forEach(key => {
            const entry = this.createEntry(group, key);
            if (entry) {
                list.appendChild(entry);
            }
        });
    },

    createEntry(group, key) {
        const li = document.createElement('li');
        li.className = 'inspector-entry';
        li.dataset.group = group;
        li.dataset.key = key;

        const button = document.createElement('button');
        button.className = 'inspector-toggle';
        button.type = 'button';

        const label = document.createElement('span');
        label.className = `${group}-label inspector-label`;
        label.dataset.key = key;
        label.id = `${group}-${key}-label`;
        label.textContent = this.getLabel(group, key);
        button.appendChild(label);

        const valueWrap = document.createElement('span');
        valueWrap.className = 'inspector-value';
        valueWrap.appendChild(this.buildValueContent(group, key));
        button.appendChild(valueWrap);

        li.appendChild(button);

        const detail = document.createElement('div');
        detail.className = 'inspector-detail hidden';

        const description = document.createElement('p');
        description.className = 'inspector-desc';
        description.id = `${group}-${key}-desc`;
        detail.appendChild(description);

        const softcap = document.createElement('p');
        softcap.className = 'inspector-softcap';
        softcap.id = `${group}-${key}-softcap`;
        detail.appendChild(softcap);

        const modifiers = document.createElement('ul');
        modifiers.className = 'inspector-mods';
        modifiers.id = `${group}-${key}-mods`;
        detail.appendChild(modifiers);

        li.appendChild(detail);
        button.addEventListener('click', () => {
            li.classList.toggle('expanded');
            detail.classList.toggle('hidden');
        });

        this.updateEntry(group, key);
        return li;
    },

    buildValueContent(group, key) {
        if (group === 'stats') {
            const wrapper = document.createElement('span');
            wrapper.className = 'stat-inline';
            wrapper.insertAdjacentHTML(
                'beforeend',
                `<span id="stat-${key}-level">x1.00</span> ` +
                `| <span id="stat-${key}-exp">0</span>/<span id="stat-${key}-cap">0</span> XP ` +
                `(<span id="stat-${key}-delta" class="delta">0</span>/s)`
            );
            return wrapper;
        }

        if (group === 'resources') {
            const wrapper = document.createElement('span');
            wrapper.className = 'resource-inline';
            wrapper.textContent = Lang.ui('No resource economy') || 'No resource economy';
            return wrapper;
        }

        if (group === 'prestige') {
            const wrapper = document.createElement('span');
            wrapper.insertAdjacentHTML(
                'beforeend',
                `<span id="prestige-${key}">0</span> ` +
                `<span id="prestige-${key}-gain" class="delta">(+0)</span>`
            );
            return wrapper;
        }

        const fallback = document.createElement('span');
        fallback.textContent = '0';
        return fallback;
    },

    getLabel(group, key) {
        if (group === 'stats') {
            return Lang.stat(key) || capitalize(key);
        }
        if (group === 'prestige') {
            return Lang.resource(key) || Lang.stat(key) || capitalize(key);
        }
        return Lang.resource(key) || capitalize(key);
    },

    getDescription(group, key) {
        if (group === 'stats') {
            return Lang.statDesc(key) || State.statDescriptions[key] || '';
        }
        if (group === 'prestige') {
            return Lang.prestigeDesc(key) || State.prestigeDescriptions[key] || '';
        }
        return Lang.resourceDesc(key) || State.resourceDescriptions[key] || '';
    },

    getSoftcap(group, key) {
        if (group === 'prestige') {
            return Infinity;
        }
        if (group === 'stats') {
            return getStatMax(key);
        }
        if (typeof SoftCapSystem !== 'undefined' && typeof SoftCapSystem.getResourceCap === 'function') {
            return SoftCapSystem.getResourceCap(key);
        }
        return getResourceMax(key);
    },

    buildModifierItems(node, record) {
        if (!node) return;
        node.innerHTML = '';
        if (!record) return;

        const additions = Array.isArray(record.maxAdditions) ? record.maxAdditions.filter(value => value) : [];
        const multipliers = Array.isArray(record.maxMultipliers) ? record.maxMultipliers.filter(value => value && value !== 1) : [];

        if (!additions.length && !multipliers.length) {
            const empty = document.createElement('li');
            empty.textContent = Lang.ui('No active modifiers') || 'No active modifiers';
            node.appendChild(empty);
            return;
        }

        additions.forEach(value => {
            const item = document.createElement('li');
            item.textContent = `+${Number(value).toFixed(1)}`;
            node.appendChild(item);
        });
        multipliers.forEach(value => {
            const item = document.createElement('li');
            item.textContent = `x${Number(value).toFixed(2)}`;
            node.appendChild(item);
        });
    },

    updateEntry(group, key) {
        const description = document.getElementById(`${group}-${key}-desc`);
        const softcap = document.getElementById(`${group}-${key}-softcap`);
        const modifiers = document.getElementById(`${group}-${key}-mods`);
        const label = document.getElementById(`${group}-${key}-label`);
        const record = group === 'stats' ? State.stats[key] : State.resources[key];

        if (label) {
            label.textContent = this.getLabel(group, key);
        }
        if (description) {
            description.textContent = this.getDescription(group, key);
        }
        if (softcap) {
            const cap = this.getSoftcap(group, key);
            if (group === 'stats') {
                softcap.textContent = `${Lang.ui('Next Level') || 'Next Level'}: ${Number(cap).toFixed(1)} XP`;
            } else {
                const value = Number.isFinite(cap) ? cap.toFixed(1) : '∞';
                softcap.textContent = `${Lang.ui('Softcap') || 'Softcap'}: ${value}`;
            }
        }
        if (modifiers) {
            this.buildModifierItems(modifiers, record);
        }
    },

    translateGroup(group, keys) {
        keys.forEach(key => this.updateEntry(group, key));
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ResourceInspector };
}
