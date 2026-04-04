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
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getActionTier(level);
    return TierSystem.getTier(level);
}

function scalingMultiplier(action) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.scalingMultiplier(action);
    const f = action.scaling;
    let lvl = action.level;
    if (lvl > f.softcapLevel) {
        lvl = f.softcapLevel + (lvl - f.softcapLevel) * f.falloff;
    }
    return Math.pow(f.base + f.multiplier * lvl, 1.08);
}

function getPrestigeValueForStat(statKey) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getPrestigeValueForStat(statKey);
    const prestigeKey = PRESTIGE_MAP[statKey];
    return prestigeKey ? (State.prestige[prestigeKey] || 0) : 0;
}

function resolveStatFactorValue(factor, field) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.resolveStatFactorValue(factor, field);
    if (typeof factor === 'number') {
        return factor;
    }
    if (!factor || typeof factor !== 'object') {
        return 0;
    }
    return Number(factor[field] || 0);
}

function getWeightedStatContribution(factors = {}, field) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getWeightedStatContribution(factors, field);
    return Object.entries(factors).reduce((total, [statKey, factor]) => {
        const weight = resolveStatFactorValue(factor, field);
        const level = getStatLevel(statKey);
        const prestige = getPrestigeValueForStat(statKey);
        return total + (level * weight) + (prestige * weight * 0.35);
    }, 0);
}

function getActionSpeedMultiplier(action) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getActionSpeedMultiplier(action);
    const factors = action.statFactors || {};
    return 1 + getWeightedStatContribution(factors, 'speed');
}

function getActionOutputMultiplier(action) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getActionOutputMultiplier(action);
    const factors = action.statFactors || {};
    return 1 + getWeightedStatContribution(factors, 'output');
}

function getActionStatOnlyMultiplier(action) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getActionStatOnlyMultiplier(action);
    return getActionSpeedMultiplier(action) * getActionOutputMultiplier(action);
}

function getEncounterSpeedMultiplier(encounter) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getEncounterSpeedMultiplier(encounter);
    const factors = encounter.statFactors || {};
    if (!Object.keys(factors).length && encounter.category) {
        factors[encounter.category] = { speed: 0.06, output: 0.04 };
    }
    return 1 + getWeightedStatContribution(factors, 'speed');
}

function getEncounterOutputMultiplier(encounter) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getEncounterOutputMultiplier(encounter);
    const factors = encounter.statFactors || {};
    if (!Object.keys(factors).length && encounter.category) {
        factors[encounter.category] = { speed: 0.06, output: 0.04 };
    }
    return 1 + getWeightedStatContribution(factors, 'output');
}

function getEncounterStatOnlyMultiplier(encounter) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.getEncounterStatOnlyMultiplier(encounter);
    return getEncounterSpeedMultiplier(encounter) * getEncounterOutputMultiplier(encounter);
}

function canAfford(cost, delta, mult = 1) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.canAfford(cost, delta, mult);
    for (const k in cost) {
        const amount = cost[k] * mult * State.time * delta;
        const res = State.resources[k];
        if (!res || res.value < amount) return k;
    }
    return null;
}

function applyYield(base, mult, delta) {
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.applyYield(base, mult, delta);
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
    const migrated = typeof window !== 'undefined' && window.__gameSystems && window.__gameSystems.formulas;
    if (migrated) return migrated.gainExp(action, amount);
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
        getActionSpeedMultiplier,
        getActionOutputMultiplier,
        getActionStatOnlyMultiplier,
        getEncounterSpeedMultiplier,
        getEncounterOutputMultiplier,
        getEncounterStatOnlyMultiplier,
        canAfford,
        applyYield,
        gainExp
    };
}
