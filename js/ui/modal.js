// Compatibility shim. The browser runtime installs `ModalUI` from `src/ui`.
const ModalUI = globalThis.ModalUI || {
    init() {
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('ui:modalOpen', id => this.open(id));
            PubSub.subscribe('modal:open', id => this.open(id));
            PubSub.subscribe('ui:modalClose', id => this.close(id));
            PubSub.subscribe('modal:close', id => this.close(id));
        }
    },
    open(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    },
    close(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ModalUI };
}
