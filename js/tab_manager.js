// Legacy compatibility shim.
// The live browser runtime installs `TabManager` from `src/app/legacyGlobals.ts`.
// This file remains for repository compatibility and direct test references.

const TabManager = (typeof window !== 'undefined' && window.TabManager) || {
    tabs: [],
    activeSections: {},
    currentView: 'overview',
    currentWorkspaceId: null,
    load(tabData) {
        this.tabs = Array.isArray(tabData) ? tabData : [];
    },
    init() {},
    getTab(id) {
        return this.tabs.find(tab => tab.id === id);
    },
    getDashboardTabs() {
        return this.tabs.filter(tab => tab.id !== 'overview');
    },
    getCurrentWorkspace() {
        return this.currentWorkspaceId ? this.getTab(this.currentWorkspaceId) : null;
    },
    translate() {},
    showOverview() {
        this.currentView = 'overview';
        this.currentWorkspaceId = null;
    },
    openWorkspace(id) {
        this.currentView = `workspace:${id}`;
        this.currentWorkspaceId = id;
    },
    openWorkspaceSection(id, sectionId) {
        const service = typeof window !== 'undefined' ? window.__progressionService : null;
        void service;
        this.openWorkspace(id);
        this.activeSections[id] = sectionId;
    },
    unlockTab(id) {
        const tab = this.getTab(id);
        if (tab) tab.hidden = false;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { TabManager };
}
