const BonusEngine = {
    statAdditions: { strength: 0, intelligence: 0, creativity: 0 },
    statMultipliers: { strength: 1, intelligence: 1, creativity: 1 },
    statPowers: { strength: 1, intelligence: 1, creativity: 1 },
    resourceAdditions: { energy: 0, focus: 0, health: 0, money: 0 },
    resourceMultipliers: { energy: 1, focus: 1, health: 1, money: 1 },
    resourceDividers: { energy: 1, focus: 1, health: 1, money: 1 },

    applyStat(delta, key) {
        const add = this.statAdditions[key] || 0;
        const mult = this.statMultipliers[key] || 1;
        const pow = this.statPowers[key] || 1;
        return Math.pow((delta + add) * mult, pow);
    },

    applyResource(delta, key) {
        const add = this.resourceAdditions[key] || 0;
        const mult = this.resourceMultipliers[key] || 1;
        const div = this.resourceDividers[key] || 1;
        const result = (delta + add) * mult;
        return result < 0 ? result / div : result;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { BonusEngine };
}
