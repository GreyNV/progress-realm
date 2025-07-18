// Story event system loaded from data/story_events.json
// Allows adding narrative modals via data instead of hardcoding logic.
class StoryEvent {
    constructor(data) {
        this.id = data.id;
        this.textKey = data.textKey;
        // Fallback English text if no translation is available
        this.text = data.text || null;
        this.image = data.image || '';
        this.flag = data.flag || null;
        this.trigger = data.trigger || { type: 'manual' };
        this.unlocks = data.unlocks || {};
    }
}


const StorySystem = {
    events: [],
    async load() {
        try {
            const res = await fetch('data/story_events.json');
            const json = await res.json();
            this.events = json.map(e => new StoryEvent(e));
        } catch (e) {
            console.error('Failed to load story events', e);
            this.events = [];
        }
    },
    init() {
        this.check();
        if (typeof PubSub !== 'undefined') {
            const ageFn = () => this.check();
            const encFn = () => this.check();
            PubSub.subscribe('age:advanced', ageFn);
            PubSub.subscribe('encounter:complete', encFn);
            this._ageFn = ageFn;
            this._encFn = encFn;
        }
    },
    trigger(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;
        if (event.flag && State[event.flag]) return;
        this._show(event);
    },
    _show(event) {
        const text = Lang.story(event.textKey) || event.text || event.textKey;
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('story:show', {
                text,
                image: event.image,
                onClose: () => {
                    if (event.flag) State[event.flag] = true;
                    this.applyUnlocks(event.unlocks);
                    SaveSystem.save();
                }
            });
        }
    },
    applyUnlocks(unlocks) {
        if (!unlocks) return;
        if (unlocks.tabs) {
            unlocks.tabs.forEach(id => {
                TabManager.unlockTab(id);
                if (typeof PubSub !== 'undefined') {
                    PubSub.publish('unlock:tab', id);
                }
            });
        }
        if (unlocks.actions) {
            unlocks.actions.forEach(id => {
                if (actions[id]) {
                    actions[id].locked = false;
                    if (typeof PubSub !== 'undefined') {
                        PubSub.publish('unlock:action', id);
                    }
                }
            });
        }
        if (unlocks.encounters) {
            unlocks.encounters.forEach(id => {
                const enc = EncounterGenerator.encounters.find(e => e.id === id);
                if (enc) {
                    enc.locked = false;
                    if (typeof PubSub !== 'undefined') {
                        PubSub.publish('unlock:encounter', id);
                    }
                }
            });
        }
    },
    check() {
        const days = State.age.years * AgeSystem.daysPerYear + State.age.days;
        this.events.forEach(ev => {
            if (ev.flag && State[ev.flag]) return;
            const t = ev.trigger;
            if (t.type === 'startup') {
                this.trigger(ev.id);
            } else if (t.type === 'age' && days >= t.days) {
                this.trigger(ev.id);
            }
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { StorySystem, StoryEvent };
}
