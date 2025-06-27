const BonusEngine = {
    statAdditions: {},
    statMultipliers: {},
    statPowers: {},
    resourceAdditions: {},
    resourceMultipliers: {},
    resourceDividers: {},

    initialize(statKeys = [], resourceKeys = []) {
        this.statAdditions = {};
        this.statMultipliers = {};
        this.statPowers = {};
        statKeys.forEach(k => {
            this.statAdditions[k] = 0;
            this.statMultipliers[k] = 1;
            this.statPowers[k] = 1;
        });
        this.resourceAdditions = {};
        this.resourceMultipliers = {};
        this.resourceDividers = {};
        resourceKeys.forEach(k => {
            this.resourceAdditions[k] = 0;
            this.resourceMultipliers[k] = 1;
            this.resourceDividers[k] = 1;
        });
    },

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
