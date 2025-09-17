// Handles stat and resource soft cap calculations
const SoftCapSystem = {
    baseStatCaps: { strength: 50, intelligence: 50, dexterity: 50 },
    baseResourceCaps: { energy: 20, focus: 20, health: 10 },
    statCaps: {},
    resourceCaps: {},
    statCapMultipliers: {},
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
                const baseCap = StatSystem.max(stat);
                const multiplier = this._statMultiplierFor(key);
                this.statCaps[key] = baseCap * multiplier;
            }
        });
    },
    bumpStatCap(name, multiplier) {
        if (!name) return;
        const numeric = Number(multiplier);
        if (!Number.isFinite(numeric) || numeric <= 0 || numeric === 1) {
            delete this.statCapMultipliers[name];
        } else {
            this.statCapMultipliers[name] = numeric;
        }
        if (!State.stats || !State.stats[name]) {
            delete this.statCaps[name];
            return;
        }
        const stat = State.stats[name];
        const baseCap = StatSystem.max(stat);
        const effectiveMultiplier = this._statMultiplierFor(name);
        this.statCaps[name] = baseCap * effectiveMultiplier;
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
            const baseCap = StatSystem.max(State.stats[name]);
            const multiplier = this._statMultiplierFor(name);
            this.statCaps[name] = baseCap * multiplier;
        }
        return this.statCaps[name];
    },
    _statMultiplierFor(name) {
        const mult = this.statCapMultipliers[name];
        if (!Number.isFinite(mult) || mult <= 0) {
            return 1;
        }
        return mult;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { SoftCapSystem };
}
