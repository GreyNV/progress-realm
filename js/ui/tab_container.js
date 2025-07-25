const TabContainer = {
    init() {
        if (typeof TabManager !== 'undefined') {
            TabManager.init();
        }
        if (typeof SectionComponent !== 'undefined') {
            SectionComponent.initAll();
        }
    },
    translate() {
        if (typeof TabManager !== 'undefined') {
            TabManager.translate();
        }
    },
    unlockTab(id) {
        if (typeof TabManager !== 'undefined') {
            TabManager.unlockTab(id);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = TabContainer;
}
