// Legacy compatibility shim.
// The live browser runtime installs `StorySystem` from `src/app/legacyGlobals.ts`.
// This file remains for repository compatibility and direct test references.

const StorySystem = (typeof window !== 'undefined' && window.StorySystem) || {
    events: [],
    async load() {
        try {
            const registry = typeof window !== 'undefined' ? window.__appContent : null;
            const json = registry && Array.isArray(registry.storyEvents)
                ? registry.storyEvents
                : await (await fetch('data/story_events.json')).json();
            this.events = json;
        } catch (e) {
            console.error('Failed to load story events', e);
            this.events = [];
        }
    },
    init() {},
    trigger() {},
    applyUnlocks() {},
    check() {}
};

class StoryEvent {
    constructor(data) {
        Object.assign(this, data);
    }
}

if (typeof module !== 'undefined') {
    module.exports = { StorySystem, StoryEvent };
}
