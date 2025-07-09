// Handles stat and resource soft cap calculations
const SoftCapSystem = {
    baseStatCaps: { strength: 50, intelligence: 50, creativity: 50 },
    baseResourceCaps: { energy: 20, focus: 20, health: 10 },
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
                State.resources[r].baseMax = this.resourceCaps[r];
            }
        }
        for (const s in this.statCaps) {
            if (State.stats[s]) {
                State.stats[s].baseMax = this.statCaps[s];
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
    }
};
