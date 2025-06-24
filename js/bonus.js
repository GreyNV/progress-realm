const BonusEngine = {
    statAdditions: { strength: 0, intelligence: 0, creativity: 0 },
    statMultipliers: { strength: 1, intelligence: 1, creativity: 1 },
    resourceAdditions: { energy: 0, focus: 0, health: 0, money: 0 },
    resourceMultipliers: { energy: 1, focus: 1, health: 1, money: 1 },

    applyStat(delta, key) {
        const add = this.statAdditions[key] || 0;
        const mult = this.statMultipliers[key] || 1;
        return (delta + add) * mult;
    },

    applyResource(delta, key) {
        const add = this.resourceAdditions[key] || 0;
        const mult = this.resourceMultipliers[key] || 1;
        return (delta + add) * mult;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { BonusEngine };
}
