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
            el.textContent = `${name} (Level ${EncounterGenerator.level})`;
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
