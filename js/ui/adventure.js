const AdventureUI = {
    expanded: new Set(),
    init() {
        this.listEl = document.getElementById('adventure-list');
        this.content = document.getElementById('adventure-content');
        if (!this.listEl || !this.content) return;
        this.renderList();
        const returnBtn = document.getElementById('return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                AdventureEngine.cancel(true);
                this.update();
            });
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('adventure:started', () => this.update());
            PubSub.subscribe('adventure:stopped', () => this.update());
        }
        this.update();
    },
    renderList() {
        const prev = new Set(this.expanded);
        this.expanded.clear();
        this.listEl.innerHTML = '';
        Object.values(AdventureManager.adventures).forEach(adv => {
            const li = document.createElement('li');
            li.classList.add('expandable');
            const label = document.createElement('span');
            label.className = 'action-label';
            label.textContent = adv.name;
            li.appendChild(label);
            const arrow = document.createElement('span');
            arrow.className = 'expand-arrow';
            arrow.textContent = '▶';
            li.appendChild(arrow);
            const detail = document.createElement('div');
            detail.className = 'expand-details';
            if (adv.shortDescription) {
                detail.textContent = adv.shortDescription;
            } else {
                const names = (adv.encounterIds || []).map(id => {
                    const enc = EncounterGenerator.encounters.find(e => e.id === id);
                    return enc ? enc.name : id;
                });
                detail.textContent = names.join(', ');
            }
            li.appendChild(detail);
            li.dataset.adventureId = adv.id;
            arrow.addEventListener('click', e => {
                e.stopPropagation();
                const expanded = li.classList.toggle('expanded');
                arrow.textContent = expanded ? '▼' : '▶';
                if (expanded) this.expanded.add(adv.id); else this.expanded.delete(adv.id);
            });
            li.addEventListener('click', () => {
                setState('currentAdventure', adv.id);
                AdventureEngine.start();
                this.update();
            });
            if (prev.has(adv.id)) {
                li.classList.add('expanded');
                arrow.textContent = '▼';
                this.expanded.add(adv.id);
            }
            this.listEl.appendChild(li);
        });
    },
    update() {
        const active = AdventureEngine.active;
        this.listEl.classList.toggle('hidden', active);
        this.content.classList.toggle('hidden', !active);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { AdventureUI };
}
