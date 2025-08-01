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
        PubSub.publish('ui:modalOpen', id);
    });
    PubSub.subscribe('modal:close', id => {
        PubSub.publish('ui:modalClose', id);
    });
    PubSub.subscribe('unlock:tab', id => TabContainer.unlockTab(id));
    PubSub.subscribe('unlock:action', id => {
        if (actions[id]) {
            actions[id].locked = false;
            actions[id].hidden = false;
            updateTaskList();
        }
    });
    PubSub.subscribe('lock:action', id => {
        if (actions[id]) {
            actions[id].hidden = true;
            actions[id].locked = true;
            updateTaskList();
            State.slots.forEach((slot, i) => {
                if (slot.actionId === id) {
                    slot.actionId = State.defaultActionId;
                    slot.progress = 0;
                    slot.text = '';
                    if (typeof updateSlotUI === 'function') {
                        updateSlotUI(i);
                    }
                }
            });
        }
    });
    PubSub.subscribe('furniture:destroyed', data => {
        if (data && Array.isArray(data.unlocks)) {
            data.unlocks.forEach(id => PubSub.publish('lock:action', id));
        }
    });
    PubSub.subscribe('unlock:encounter', id => {
        const enc = EncounterGenerator.encounters.find(e => e.id === id);
        if (enc) enc.locked = false;
    });
    PubSub.subscribe('lock:encounter', id => {
        const enc = EncounterGenerator.encounters.find(e => e.id === id);
        if (enc) enc.locked = true;
    });
    PubSub.subscribe('age:maxReached', () => {
        if (!State.prestiging) {
            setState('prestiging', true);
            SaveSystem.prestige();
        }
    });
}

if (typeof module !== 'undefined') {
    module.exports = { PubSub, initPubSub };
}
