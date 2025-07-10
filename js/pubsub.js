// Simple publish/subscribe event bus
// Allows decoupled modules to communicate without direct references
const PubSub = {
    _events: {},

    /**
     * Subscribe to an event.
     * @param {string} name - event name
     * @param {Function} handler - callback
     */
    subscribe(name, handler) {
        if (!this._events[name]) this._events[name] = [];
        this._events[name].push(handler);
    },

    /**
     * Publish an event with optional data.
     * @param {string} name - event name
     * @param {*} data - payload
     */
    publish(name, data) {
        const handlers = this._events[name];
        if (!handlers) return;
        handlers.slice().forEach(h => {
            try {
                h(data);
            } catch (e) {
                console.error('PubSub handler error', e);
            }
        });
    },

    /**
     * Remove a subscription.
     * @param {string} name - event name
     * @param {Function} handler - callback to remove
     */
    unsubscribe(name, handler) {
        const handlers = this._events[name];
        if (!handlers) return;
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
    }
};

/**
 * Wire up common UI event subscriptions.
 * Separated from main.js for easier maintenance.
 */
function initPubSub() {
    PubSub.subscribe('modal:open', id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    });
    PubSub.subscribe('modal:close', id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    PubSub.subscribe('unlock:tab', id => TabManager.unlockTab(id));
    PubSub.subscribe('unlock:action', id => {
        if (actions[id]) {
            actions[id].locked = false;
            updateTaskList();
        }
    });
    PubSub.subscribe('unlock:encounter', id => {
        const enc = EncounterGenerator.encounters.find(e => e.id === id);
        if (enc) enc.locked = false;
    });
    PubSub.subscribe('age:advanced', days => {
        if (typeof FurnitureSystem !== 'undefined' && FurnitureSystem.decay) {
            FurnitureSystem.decay(days);
        }
    });
    PubSub.subscribe('age:maxReached', () => {
        if (!State.prestiging) {
            State.prestiging = true;
            SaveSystem.prestige();
        }
    });
}

if (typeof module !== 'undefined') {
    module.exports = { PubSub, initPubSub };
}
