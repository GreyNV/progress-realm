export function installLegacyUiGlobals(): void {
    const scope = globalThis as any;
    const getUi = () => scope.window?.__uiModules;

    scope.UIHandler = {
        overviewModules: [],
        async init() {
            const ui = getUi();
            const loaded = ui.layout.loadTabs();
            this.overviewModules = loaded.overviewModules;
            scope.TabManager.load(loaded.tabs);
            scope.StatsUI.init();
            scope.ResourcesUI.init();
            this.buildProgressTelemetry();
            this.buildResourceCharts();
            this.buildPrestige();
            this.buildLayerCards();
            this.applyOverviewModules();
        },
        async loadTabs() {
            const loaded = getUi().layout.loadTabs();
            this.overviewModules = loaded.overviewModules;
            scope.TabManager.load(loaded.tabs);
        },
        applyOverviewModules() {
            return getUi().layout.applyOverviewModules(this.overviewModules);
        },
        buildProgressTelemetry() {
            if (typeof scope.ProgressTelemetryUI !== "undefined") {
                scope.ProgressTelemetryUI.build();
            }
        },
        buildPrestige() {
            if (typeof scope.ResourceInspector !== "undefined") {
                scope.ResourceInspector.buildGroup("prestige-list", "prestige", scope.PRESTIGE_KEYS);
            }
        },
        buildResourceCharts() {
            if (typeof scope.ResourceTrendsUI !== "undefined") {
                scope.ResourceTrendsUI.build();
            }
        },
        buildLayerCards() {
            return getUi().layout.buildLayerCards(scope.TabManager, scope.Lang);
        },
        buildWorkspaceSummary(tab: any) {
            return getUi().layout.buildWorkspaceSummary(tab);
        },
        updateWorkspaceHeader(tab: any) {
            return getUi().layout.updateWorkspaceHeader(tab, scope.Lang);
        },
        refreshWorkspace() {
            const tab = scope.TabManager.getCurrentWorkspace();
            if (tab) this.updateWorkspaceHeader(tab);
        }
    };

    scope.EncounterUI = {
        dungeonList: null,
        init() {
            this.dungeonList = document.getElementById("dungeon-list");
            if (typeof scope.PubSub !== "undefined") {
                scope.PubSub.subscribe("encounter:update", () => {
                    this.updateName();
                    this.updateProgressBar();
                    this.updateDungeonCatalog();
                });
                scope.PubSub.subscribe("dungeon:selected", () => this.updateDungeonCatalog());
                scope.PubSub.subscribe("lang:changed", () => this.updateDungeonCatalog());
            }
            this.updateDungeonCatalog();
            this.updateName();
            this.updateProgressBar();
        },
        updateName() {
            return getUi().encounter.updateName();
        },
        updateProgressBar() {
            return getUi().encounter.updateProgressBar();
        },
        updateDungeonCatalog() {
            return getUi().encounter.updateDungeonCatalog(this.dungeonList);
        },
        getDungeonPossibleDrops(dungeon: any) {
            return getUi().encounter.getDungeonPossibleDrops(dungeon);
        },
        getItemLabel(itemId: string) {
            return getUi().encounter.getItemLabel(itemId);
        },
        getDungeonStrongestStat(dungeonId: string) {
            return getUi().encounter.getDungeonStrongestStat(dungeonId);
        },
        getDungeonStatFactors(dungeonId: string) {
            return getUi().encounter.getDungeonStatFactors(dungeonId);
        }
    };

    scope.CombatUI = {
        _state: null,
        init() {
            this._state = getUi().combat.initState();
            if (typeof scope.PubSub !== "undefined") {
                scope.PubSub.subscribe("combat:update", () => this.update());
                scope.PubSub.subscribe("lang:changed", () => this.update());
            }
            this.update();
        },
        renderStatList(target: HTMLElement | null, stats: any, isPlayer: boolean) {
            return getUi().combat.renderStatList(target, stats, isPlayer);
        },
        updateBar(fill: HTMLElement | null, current: number, max: number) {
            return getUi().combat.updateBar(fill, current, max);
        },
        update() {
            return getUi().combat.render(this._state || getUi().combat.initState());
        }
    };

    scope.ModalUI = getUi().modal;
    scope.StoryUI = getUi().story;
    scope.ResourceInspector = getUi().resourceInspector;
    scope.setupTooltips = getUi().setupTooltips;
    scope.StatsUI = getUi().hud.stats;
    scope.PrestigeUI = getUi().hud.prestige;
    scope.ResourcesUI = getUi().hud.resources;
    scope.ProgressTelemetryUI = getUi().hud.telemetry;
    scope.ResourceTrendsUI = getUi().hud.trends;
    scope.MasteryUI = getUi().hud.mastery;
    scope.OverviewUI = getUi().hud.overview;
    scope.WorkspaceDetailUI = getUi().hud.workspaceDetail;
    Object.assign(scope, getUi().hud.helpers);
    scope.InventoryUI = getUi().layers.inventory;
    scope.CharacterUI = getUi().layers.character;
    scope.CharacterBackground = getUi().layers.characterBackground;
    scope.HomeUI = getUi().layers.home;
    scope.FurnitureUI = getUi().layers.furniture;
    scope.ResearchUI = getUi().layers.research;
    scope.RoutineUpgradeUI = getUi().layers.routineUpgrades;
    scope.UpdateUI = getUi().layers.updates;

    const widgets = getUi().widgets;
    scope.buildActionTooltip = widgets.buildActionTooltip.bind(widgets);
    scope.createActionElement = widgets.createActionElement.bind(widgets);
    scope.setupSlots = widgets.setupSlots.bind(widgets);
    scope.setupAdventureSlots = widgets.setupAdventureSlots.bind(widgets);
    scope.setupInventorySlots = widgets.setupInventorySlots.bind(widgets);
    scope.setupDragAndDrop = widgets.setupDragAndDrop.bind(widgets);
    scope.updateTaskList = widgets.updateTaskList.bind(widgets);
    scope.updateSlotUI = widgets.updateSlotUI.bind(widgets);
    scope.updateAdventureSlotUI = widgets.updateAdventureSlotUI.bind(widgets);

    scope.Log = getUi().log;
}
