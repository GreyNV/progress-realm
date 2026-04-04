const CombatUI = {
    _state: null,

    init() {
        this._state = window.__uiModules.combat.initState();
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('combat:update', () => this.update());
            PubSub.subscribe('lang:changed', () => this.update());
        }
        this.update();
    },

    renderStatList(target, stats, isPlayer) {
        return window.__uiModules.combat.renderStatList(target, stats, isPlayer);
    },

    updateBar(fill, current, max) {
        return window.__uiModules.combat.updateBar(fill, current, max);
    },

    update() {
        return window.__uiModules.combat.render(this._state || window.__uiModules.combat.initState());
    }
};

if (typeof module !== 'undefined') {
    module.exports = { CombatUI };
}
