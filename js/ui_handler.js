const UIHandler = {
    overviewModules: [],

    async init() {
        await this.loadTabs();
        StatsUI.init();
        ResourcesUI.init();
        this.buildProgressTelemetry();
        this.buildResourceCharts();
        this.buildPrestige();
        this.buildLayerCards();
        this.applyOverviewModules();
    },

    async loadTabs() {
        const loaded = window.__uiModules.layout.loadTabs();
        this.overviewModules = loaded.overviewModules;
        TabManager.load(loaded.tabs);
    },

    applyOverviewModules() {
        return window.__uiModules.layout.applyOverviewModules(this.overviewModules);
    },

    buildProgressTelemetry() {
        if (typeof ProgressTelemetryUI !== 'undefined') {
            ProgressTelemetryUI.build();
        }
    },

    buildPrestige() {
        if (typeof ResourceInspector !== 'undefined') {
            ResourceInspector.buildGroup('prestige-list', 'prestige', PRESTIGE_KEYS);
        }
    },

    buildResourceCharts() {
        if (typeof ResourceTrendsUI !== 'undefined') {
            ResourceTrendsUI.build();
        }
    },

    buildLayerCards() {
        return window.__uiModules.layout.buildLayerCards(TabManager, Lang);
    },

    buildWorkspaceSummary(tab) {
        return window.__uiModules.layout.buildWorkspaceSummary(tab);
    },

    updateWorkspaceHeader(tab) {
        return window.__uiModules.layout.updateWorkspaceHeader(tab, Lang);
    },

    refreshWorkspace() {
        const tab = TabManager.getCurrentWorkspace();
        if (tab) this.updateWorkspaceHeader(tab);
    }
};
