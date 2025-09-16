// Handles stat and resource soft cap calculations
const SoftCapSystem = {
    baseStatCaps: { strength: 50, intelligence: 50, dexterity: 50 },
    baseResourceCaps: { energy: 20, focus: 20, health: 10 },
    statCaps: {},
    resourceCaps: {},
    recalculateCaps() {
        this.statCaps = { ...this.baseStatCaps };
        this.resourceCaps = { ...this.baseResourceCaps };
        this._applyBaseCaps('resources', this.baseResourceCaps);
        this._applyBaseCaps('stats', this.baseStatCaps);
        this.refreshCaps();
    },
    _applyBaseCaps(group, caps) {
        if (!State[group]) return;
        Object.keys(caps).forEach(key => {
            if (State[group][key]) {
                setState([group, key, 'baseMax'], caps[key]);
            }
        });
    },
    refreshCaps() {
        this._refreshResourceCaps();
        this._refreshStatCaps();
    },
    _refreshResourceCaps() {
        if (!State.resources) return;
        Object.keys(State.resources).forEach(key => {
            const res = State.resources[key];
            if (res) {
                this.resourceCaps[key] = ResourceSystem.max(res);
            }
        });
    },
    _refreshStatCaps() {
        if (!State.stats) return;
        Object.keys(State.stats).forEach(key => {
            const stat = State.stats[key];
            if (stat) {
                this.statCaps[key] = StatSystem.max(stat);
            }
        });
    },
    apply() {
        this.refreshCaps();
    },
    getResourceCap(name) {
        if (!name || !State.resources || !State.resources[name]) {
            return this.resourceCaps[name];
        }
        if (this.resourceCaps[name] === undefined) {
            this.resourceCaps[name] = ResourceSystem.max(State.resources[name]);
        }
        return this.resourceCaps[name];
    },
    getStatCap(name) {
        if (!name || !State.stats || !State.stats[name]) {
            return this.statCaps[name];
        }
        if (this.statCaps[name] === undefined) {
            this.statCaps[name] = StatSystem.max(State.stats[name]);
        }
        return this.statCaps[name];
    }
};

if (typeof module !== 'undefined') {
    module.exports = { SoftCapSystem };
}
