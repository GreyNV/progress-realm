class ResearchItem {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.cost = data.cost || 0;
        this.unlocks = data.unlocks || [];
        this.done = data.done || false;
    }
}

const ResearchSystem = {
    research: [],
    async load() {
        try {
            const res = await fetch('data/research.json');
            const json = await res.json();
            this.research = json.map(r => new ResearchItem(r));
        } catch (e) {
            console.error('Failed to load research', e);
            this.research = [];
        }
    },
    purchase(id) {
        const item = this.research.find(r => r.id === id);
        if (!item) return;
        if (!State.researchCompleted.includes(id)) {
            pushState('researchCompleted', id);
        }
        item.unlocks.forEach(a => PubSub.publish('unlock:action', a));
        ResearchUI.render();
        SaveSystem.save();
    }
};

const ResearchUI = {
    listEl: null,
    init() {
        this.listEl = document.getElementById('research-list');
        if (!this.listEl) return;
        this.render();
    },
    render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';
        ResearchSystem.research.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r.name;
            li.dataset.tooltip = `${r.description}\nCost: ${r.cost}`;
            if (State.researchCompleted.includes(r.id) || r.done) {
                li.classList.add('locked');
            } else {
                li.addEventListener('click', () => ResearchSystem.purchase(r.id));
            }
            this.listEl.appendChild(li);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ResearchSystem, ResearchUI, ResearchItem };
}
