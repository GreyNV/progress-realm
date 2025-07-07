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

if (typeof module !== 'undefined') {
    module.exports = { PubSub };
}
