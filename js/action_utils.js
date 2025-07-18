// Utility helpers for action calculations
// Exported for reuse by engines and other modules

const TierSystem = {
    tiers: [
        { name: 'bronze', level: 10 },
        { name: 'silver', level: 50 },
        { name: 'gold', level: 200 }
    ],
    scale: 4,
    getTier(level) {
        let tier = 'normal';
        let last = 1;
        for (const t of this.tiers) {
            if (level >= t.level) {
                tier = t.name;
                last = t.level;
            } else {
                return tier;
            }
        }
        let index = this.tiers.length;
        while (level >= last * this.scale) {
            last *= this.scale;
            tier = `tier${index}`;
            index++;
        }
        return tier;
    }
};

function getActionTier(level) {
    return TierSystem.getTier(level);
}

function scalingMultiplier(action) {
    const f = action.scaling;
    let lvl = action.level;
    if (lvl > f.softcapLevel) {
        lvl = f.softcapLevel + (lvl - f.softcapLevel) * f.falloff;
    }
    return f.base + f.multiplier * lvl;
}

function canAfford(cost, delta, mult = 1) {
    for (const k in cost) {
        const amount = cost[k] * mult * State.time * delta;
        const res = State.resources[k];
        if (!res || res.value < amount) return k;
    }
    return null;
}

function applyYield(base, mult, delta) {
    if (base.stats) {
        for (const s in base.stats) {
            StatSystem.add(State.stats[s], base.stats[s] * mult * State.time * delta);
        }
    }
    if (base.resources) {
        for (const r in base.resources) {
            ResourceSystem.add(State.resources[r], base.resources[r] * mult * State.time * delta);
        }
    }
}

function gainExp(action, amount) {
    action.exp += amount;
    const beforeLevel = action.level;
    const beforeMastery = State.masteryPoints;
    while (action.exp >= action.expToNext) {
        action.exp -= action.expToNext;
        const oldTier = getActionTier(action.level);
        action.level += 1;
        action.expToNext = Math.floor(action.expToNext * 1.1 + 5);
        const newTier = getActionTier(action.level);
        if (newTier !== oldTier) {
            State.masteryPoints += 1;
            action.currentTier = newTier;
        }
    }
    if (typeof PubSub !== 'undefined') {
        if (action.level !== beforeLevel) {
            PubSub.publish('action:levelUp', { id: action.id, level: action.level });
        }
        if (State.masteryPoints !== beforeMastery) {
            PubSub.publish('mastery:changed', State.masteryPoints);
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        TierSystem,
        getActionTier,
        scalingMultiplier,
        canAfford,
        applyYield,
        gainExp
    };
}
