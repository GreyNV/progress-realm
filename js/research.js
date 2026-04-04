// Legacy compatibility module for Node-based tests.
// The live browser runtime uses the typed research system from `src/systems`.

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

const ResearchSystem = (typeof window !== 'undefined' && window.ResearchSystem) || {
    research: [],
    async load() {},
    purchase(id) {
        const item = this.research.find(entry => entry.id === id);
        if (!item) return;
        if (!State.researchCompleted.includes(id)) {
            pushState('researchCompleted', id);
        }
        if (typeof PubSub !== 'undefined') {
            item.unlocks.forEach(actionId => PubSub.publish('unlock:action', actionId));
            PubSub.publish('research:updated');
        }
        if (typeof SaveSystem !== 'undefined' && SaveSystem.save) {
            SaveSystem.save();
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ResearchSystem, ResearchItem };
}
