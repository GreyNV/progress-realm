// Story event system loaded from data/story_events.json
// Allows adding narrative modals via data instead of hardcoding logic.
class StoryEvent {
    constructor(data) {
        this.id = data.id;
        this.textKey = data.textKey;
        this.image = data.image || '';
        this.flag = data.flag || null;
        this.trigger = data.trigger || { type: 'manual' };
        this.unlocks = data.unlocks || {};
    }
}

const Story = {
    active: false,
    show(text, image, onClose) {
        if (this.active) return;
        this.active = true;
        const modal = document.getElementById('story-modal');
        const textEl = document.getElementById('story-text');
        const imageEl = document.getElementById('story-image');
        textEl.textContent = text;
        imageEl.innerHTML = '';
        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.alt = '';
            img.loading = 'lazy';
            imageEl.appendChild(img);
        }
        modal.classList.remove('hidden');
        const close = () => {
            modal.classList.add('hidden');
            document.getElementById('story-close').removeEventListener('click', close);
            this.active = false;
            Log.add(text);
            if (onClose) onClose();
        };
        document.getElementById('story-close').addEventListener('click', close);
    }
};

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
    },
    trigger(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;
        if (event.flag && State[event.flag]) return;
        this._show(event);
    },
    _show(event) {
        const text = Lang.story(event.textKey) || event.textKey;
        Story.show(text, event.image, () => {
            if (event.flag) State[event.flag] = true;
            this.applyUnlocks(event.unlocks);
            SaveSystem.save();
        });
    },
    applyUnlocks(unlocks) {
        if (!unlocks) return;
        if (unlocks.tabs) {
            unlocks.tabs.forEach(id => TabManager.unlockTab(id));
        }
        if (unlocks.actions) {
            unlocks.actions.forEach(id => {
                if (actions[id]) actions[id].locked = false;
            });
        }
        if (unlocks.encounters) {
            unlocks.encounters.forEach(id => {
                const enc = EncounterGenerator.encounters.find(e => e.id === id);
                if (enc) enc.locked = false;
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
    module.exports = { StorySystem, StoryEvent, Story };
}
