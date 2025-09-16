if (typeof formatNumber === 'undefined' && typeof require !== 'undefined') {
    const utils = require('../utils');
    if (utils && typeof utils.formatNumber === 'function') {
        if (typeof globalThis !== 'undefined') {
            globalThis.formatNumber = utils.formatNumber;
        } else if (typeof window !== 'undefined') {
            window.formatNumber = utils.formatNumber;
        } else if (typeof global !== 'undefined') {
            global.formatNumber = utils.formatNumber;
        }
    }
}

const EncounterUI = {
    init() {
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('encounter:update', () => {
                this.updateName();
                this.updateProgressBar();
            });
        }
        this.updateName();
        this.updateProgressBar();
    },
    updateName() {
        const milestone = EncounterGenerator.milestones
            .slice()
            .reverse()
            .find(m => EncounterGenerator.level >= m.level);
        const name = milestone ? milestone.name : EncounterGenerator.milestones[0].name;
        const el = document.getElementById('encounter-location');
        if (el) {
            const currentLevel = formatNumber(EncounterGenerator.level);
            const maxLevel = formatNumber(State.maxEncounterLevel);
            el.textContent = `${name} (Level ${currentLevel} (Max ${maxLevel}))`;
        }
    },
    updateProgressBar() {
        const bar = document.getElementById('encounter-level-progress');
        if (bar) {
            bar.max = 10;
            bar.value = Math.min(State.encounterStreak || 0, 10);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { EncounterUI };
}
