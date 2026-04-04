// Handles stat and resource soft cap calculations
const SoftCapSystem = {
  baseStatCaps: { strength: 50, intelligence: 50, agility: 50, constitution: 50, will: 50 },
    baseResourceCaps: {},
    statCaps: {},
    resourceCaps: {},
    falloff: 0.5,
    recalculateCaps(inventory) {
        this.statCaps = { ...this.baseStatCaps };
        this.resourceCaps = { ...this.baseResourceCaps };
        if (!inventory) return;
        for (const [id, record] of Object.entries(inventory)) {
            const item = ItemGenerator.itemList.find(i => i.id === id);
            if (!item || item.effectType !== 'increaseSoftcap') continue;
            const qty = record.quantity || 0;
            for (const key in item.effectValue) {
                const value = item.effectValue[key] * Math.log(qty + 1);
                if (this.statCaps[key] !== undefined) {
                    this.statCaps[key] += value;
                } else {
                    this.resourceCaps[key] = (this.resourceCaps[key] || (this.baseResourceCaps[key] || 0)) + value;
                }
            }
        }
        for (const r in this.resourceCaps) {
            if (State.resources[r]) {
                setState(['resources', r, 'baseMax'], this.resourceCaps[r]);
            }
        }
        for (const s in this.statCaps) {
            if (State.stats[s]) {
                setState(['stats', s, 'baseMax'], this.statCaps[s]);
                // statCaps should reflect prestige multipliers for UI and
                // softcap calculations
                this.statCaps[s] = StatSystem.max(State.stats[s]);
            }
        }
    },
    apply() {
        for (const s in this.statCaps) {
            const cap = this.statCaps[s];
            const val = getStatValue(s);
            if (val > cap) {
                setStatValue(s, cap + (val - cap) * this.falloff);
            }
        }
        for (const r in this.resourceCaps) {
            const cap = this.resourceCaps[r];
            const val = getResourceValue(r);
            if (val > cap) {
                setResourceValue(r, cap + (val - cap) * this.falloff);
            }
        }
        this.refreshCaps();
    },
    refreshCaps() {
        Object.keys(State.resources || {}).forEach(name => {
            this.resourceCaps[name] = ResourceSystem.max(State.resources[name]);
        });
        Object.keys(State.stats || {}).forEach(name => {
            this.statCaps[name] = StatSystem.max(State.stats[name]);
        });
    },
    getResourceCap(name) {
        if (!name) return undefined;
        if (this.resourceCaps[name] === undefined && State.resources[name]) {
            this.resourceCaps[name] = ResourceSystem.max(State.resources[name]);
        }
        return this.resourceCaps[name];
    },
    getStatCap(name) {
        if (!name) return undefined;
        if (this.statCaps[name] === undefined && State.stats[name]) {
            this.statCaps[name] = StatSystem.max(State.stats[name]);
        }
        return this.statCaps[name];
    },
    bumpStatCap(name, multiplier) {
        if (!name || !State.stats[name]) return;
        const numeric = Number(multiplier);
        const baseMax = this.baseStatCaps[name] !== undefined ? this.baseStatCaps[name] : State.stats[name].baseMax;
        if (Number.isFinite(numeric) && numeric > 0) {
            setState(['stats', name, 'baseMax'], baseMax * numeric);
        } else {
            setState(['stats', name, 'baseMax'], baseMax);
        }
        this.refreshCaps();
    }
};
