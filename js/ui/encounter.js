const EncounterUI = {
    dungeonList: null,

    init() {
        this.dungeonList = document.getElementById('dungeon-list');
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('encounter:update', () => {
                this.updateName();
                this.updateProgressBar();
                this.updateDungeonCatalog();
            });
            PubSub.subscribe('dungeon:selected', () => this.updateDungeonCatalog());
            PubSub.subscribe('lang:changed', () => this.updateDungeonCatalog());
        }
        this.updateDungeonCatalog();
        this.updateName();
        this.updateProgressBar();
    },

    updateName() {
        return window.__uiModules.encounter.updateName();
    },

    updateProgressBar() {
        return window.__uiModules.encounter.updateProgressBar();
    },

    updateDungeonCatalog() {
        return window.__uiModules.encounter.updateDungeonCatalog(this.dungeonList);
    },

    getDungeonSignatureDrops(dungeon) {
        return window.__uiModules.encounter.getDungeonSignatureDrops(dungeon);
    },

    getItemLabel(itemId) {
        return window.__uiModules.encounter.getItemLabel(itemId);
    },

    getDungeonStrongestStat(dungeonId) {
        return window.__uiModules.encounter.getDungeonStrongestStat(dungeonId);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { EncounterUI };
}
