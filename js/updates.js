// Agents: UpdateSystem handles long term upgrades. The flow is
// UpdateSystem.load -> UpdateSystem.init -> UpdateSystem.start -> tick/apply.
// Completed updates can unlock actions and alter bonuses.
class Update {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || null;
        this.duration = data.duration || 1;
        this.resourceConsumption = data.resourceConsumption || {};
        this.state = data.state || 'locked';
        this.bonus = data.bonus || {};
        this.unlocks = data.unlocks || { actions: [], encounters: [] };
        this.progress = 0;
    }
}

const UpdateSystem = {
    updates: [],
    slots: [],
    slotCount: 1,
    async load() {
        try {
            const res = await fetch('data/updates.json');
            const json = await res.json();
            this.updates = json.map(u => new Update(u));
        } catch (e) {
            console.error('Failed to load updates', e);
            this.updates = [];
        }
    },
    init() {
        while (this.slots.length < this.slotCount) {
            this.slots.push({ updateId: null, progress: 0, active: false });
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('updates:changed');
        }
    },
    start(index, id) {
        const slot = this.slots[index];
        const update = this.updates.find(u => u.id === id && u.state === 'available');
        if (!update) return;
        if (!Inventory.canAfford(update.resourceConsumption)) return;
        Inventory.consumeCost(update.resourceConsumption);
        slot.updateId = id;
        slot.progress = 0;
        slot.active = true;
        update.state = 'inProgress';
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('updates:changed');
        }
    },
    updateListUI() {},
    updateSlotUI() {},
    tick(delta) {
        this.slots.forEach((slot, i) => {
            if (!slot.active) return;
            const update = this.updates.find(u => u.id === slot.updateId);
            if (!update) return;
            slot.progress += delta / update.duration;
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('updates:changed');
            }
            if (slot.progress >= 1) {
                slot.active = false;
                slot.updateId = null;
                slot.progress = 0;
                update.state = 'done';
                this.applyUpdate(update);
                if (typeof PubSub !== 'undefined') {
                    PubSub.publish('updates:changed');
                }
            }
        });
    },
    applyUpdate(update) {
        if (update.bonus && update.bonus.stats) {
            for (const [k, v] of Object.entries(update.bonus.stats)) {
                BonusEngine.statAdditions[k] = (BonusEngine.statAdditions[k] || 0) + v;
            }
        }
        if (update.unlocks && update.unlocks.actions) {
            update.unlocks.actions.forEach(id => {
                if (actions[id]) {
                    actions[id].locked = false;
                    if (typeof PubSub !== 'undefined') {
                        PubSub.publish('unlock:action', id);
                    }
                }
            });
        }
        if (update.unlocks && update.unlocks.tabs) {
            update.unlocks.tabs.forEach(id => {
                TabManager.unlockTab(id);
                if (typeof PubSub !== 'undefined') {
                    PubSub.publish('unlock:tab', id);
                }
            });
        }
        if (update.unlocks && update.unlocks.storyEvents) {
            update.unlocks.storyEvents.forEach(id => StorySystem.trigger(id));
        }
        if (update.replaceEncounters) {
            for (const [oldId, newId] of Object.entries(update.replaceEncounters)) {
                const oldEnc = EncounterGenerator.encounters.find(e => e.id === oldId);
                const newEnc = EncounterGenerator.encounters.find(e => e.id === newId);
                if (oldEnc) {
                    oldEnc.locked = true;
                    if (typeof PubSub !== 'undefined') {
                        PubSub.publish('lock:encounter', oldId);
                    }
                }
                if (newEnc) {
                    newEnc.locked = false;
                    if (typeof PubSub !== 'undefined') {
                        PubSub.publish('unlock:encounter', newId);
                    }
                }
            }
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { UpdateSystem, Update };
}
