const LOGIC_TICK_MS = 100;
const AUTOSAVE_INTERVAL_MS = 5000;

function getScope(): any {
    return globalThis as any;
}

function safeSave(): void {
    const scope = getScope();
    try {
        scope.SaveSystem?.save?.();
    } catch (error) {
        console.error("Autosave failed", error);
    }
}

function ensureGlobalActionBindings(): void {
    const scope = getScope();
    if (!Object.getOwnPropertyDescriptor(scope, "actions")?.get) {
        let actionStore = scope.actions || {};
        Object.defineProperty(scope, "actions", {
            configurable: true,
            get() {
                return actionStore;
            },
            set(value) {
                actionStore = value || {};
            }
        });
    }
    if (!Object.getOwnPropertyDescriptor(scope, "selectedActionId")?.get) {
        let selected = scope.selectedActionId || null;
        Object.defineProperty(scope, "selectedActionId", {
            configurable: true,
            get() {
                return selected;
            },
            set(value) {
                selected = value;
            }
        });
    }
}

async function loadActions(): Promise<Record<string, any>> {
    const scope = getScope();
    const registry = scope.window?.__appContent;
    const json = registry && Array.isArray(registry.actions)
        ? registry.actions
        : await (await fetch("data/actions.json")).json();
    let loadedActions = null;
    try {
        loadedActions = scope.SaveSystem.load();
    } catch (error) {
        console.error("Save load failed during action bootstrap", error);
        loadedActions = null;
    }
    const actionMap: Record<string, any> = {};
    json.forEach((action: any) => {
        action.hidden = action.hidden || false;
        action.locked = action.locked || false;
        actionMap[action.id] = action;
    });
    if (loadedActions) {
        for (const id in loadedActions) {
            if (actionMap[id]) {
                Object.assign(actionMap[id], loadedActions[id]);
            }
        }
    }
    Object.values(actionMap).forEach((action: any) => {
        if (action.id === scope.State.defaultActionId) {
            action.hidden = true;
        }
    });
    scope.actions = actionMap;
    return actionMap;
}

function updateUi() {
    const scope = getScope();
    scope.StatsUI.update();
    scope.ResourcesUI.update();
    scope.PrestigeUI.update();
    scope.OverviewUI.update();
    const ageYears = document.getElementById("age-years");
    const ageDays = document.getElementById("age-days");
    const maxAge = document.getElementById("max-age");
    const speedValue = document.getElementById("speed-value");
    if (ageYears) ageYears.textContent = String(scope.State.age.years);
    if (ageDays) ageDays.textContent = String(Math.floor(scope.State.age.days));
    if (maxAge) maxAge.textContent = String(scope.State.age.max);
    if (speedValue) speedValue.textContent = `${scope.State.time}x`;
}

async function handleLanguageChange(): Promise<void> {
    const scope = getScope();
    scope.setState("language", (document.getElementById("language-select") as HTMLSelectElement).value);
    await scope.Lang.load(scope.State.language);
    scope.Lang.applyToActions(scope.actions);
    scope.Lang.applyToItems(scope.ItemGenerator.itemList);
    scope.Lang.applyToEncounters(scope.EncounterGenerator.encounters);
    scope.Lang.applyToLocations(scope.EncounterGenerator.milestones);
    scope.Lang.translateUI();
    scope.TabManager.translate();
    scope.StatsUI.translate();
    scope.PrestigeUI.translate();
    scope.ResourcesUI.translate();
    if (typeof scope.ResourceTrendsUI !== "undefined") {
        scope.ResourceTrendsUI.translate();
    }
    scope.UIHandler.buildLayerCards();
    scope.UIHandler.buildProgressTelemetry();
    scope.updateTaskList();
    for (let i = 0; i < scope.State.slotCount; i += 1) scope.updateSlotUI(i);
    for (let i = 0; i < scope.State.adventureSlotCount; i += 1) scope.updateAdventureSlotUI(i);
    scope.EncounterGenerator.updateName();
    scope.InventoryUI.update();
    scope.OverviewUI.update();
    scope.PubSub?.publish("lang:changed");
    scope.SaveSystem.save();
}

function bindEvents(): void {
    const scope = getScope();
    const speedControls = document.getElementById("speed-controls");
    speedControls?.addEventListener("click", (event: Event) => {
        const target = event.target as HTMLElement;
        const speed = target?.dataset.speed;
        if (!speed) return;
        scope.setState("time", parseInt(speed, 10));
        updateUi();
    });

    document.querySelectorAll("#run-summary-card [data-workspace]").forEach((button) => {
        button.addEventListener("click", () => scope.TabManager.openWorkspace((button as HTMLElement).dataset.workspace));
    });
    document.querySelectorAll("[data-workspace][data-section]").forEach((button) => {
        button.addEventListener("click", () => {
            const element = button as HTMLElement;
            scope.TabManager.openWorkspaceSection(element.dataset.workspace, element.dataset.section);
        });
    });

    const recommendedActionButton = document.getElementById("hero-recommended-action");
    recommendedActionButton?.addEventListener("click", () => {
        const recommendation = typeof scope.getRecommendedAction === "function" ? scope.getRecommendedAction() : null;
        if (!recommendation || !recommendation.action) return;
        if (recommendation.canAssignDirectly) {
            scope.ActionEngine.start(recommendation.targetSlot, recommendation.action.id);
            scope.OverviewUI.update();
            scope.updateTaskList();
            return;
        }
        scope.TabManager.openWorkspace("routines");
    });

    document.getElementById("settings-btn")?.addEventListener("click", scope.openSettings);
    document.getElementById("settings-close")?.addEventListener("click", scope.closeSettings);
    document.getElementById("inventory-filter-btn")?.addEventListener("click", scope.openInventoryFilter);
    document.getElementById("inventory-filter-close")?.addEventListener("click", scope.closeInventoryFilter);

    const hideToggle = document.getElementById("hide-rarity-toggle") as HTMLInputElement | null;
    hideToggle?.addEventListener("change", () => {
        scope.setState("hideRarityEnabled", hideToggle.checked);
        scope.InventoryUI.update();
        scope.SaveSystem.save();
    });

    const raritySelect = document.getElementById("hide-rarity-select") as HTMLSelectElement | null;
    raritySelect?.addEventListener("change", () => {
        scope.setState("hideBelowRarity", raritySelect.value);
        scope.InventoryUI.update();
        scope.SaveSystem.save();
    });

    const darkToggle = document.getElementById("dark-mode-toggle") as HTMLInputElement | null;
    darkToggle?.addEventListener("change", () => {
        scope.setState("darkMode", darkToggle.checked);
        scope.applyDarkMode();
        scope.SaveSystem.save();
    });

    const langSelect = document.getElementById("language-select") as HTMLSelectElement | null;
    if (langSelect) {
        langSelect.value = scope.State.language;
        langSelect.addEventListener("change", () => {
            void handleLanguageChange();
        });
    }

    const autoBox = document.getElementById("autoprogress-toggle") as HTMLInputElement | null;
    if (autoBox) {
        autoBox.checked = scope.State.autoProgress;
        autoBox.addEventListener("change", () => {
            scope.setState("autoProgress", autoBox.checked);
            scope.SaveSystem.save();
        });
    }

    const encounterLogToggle = document.getElementById("encounter-log-toggle") as HTMLInputElement | null;
    if (encounterLogToggle) {
        encounterLogToggle.checked = scope.State.showEncounterLog;
        encounterLogToggle.addEventListener("change", () => {
            scope.setState("showEncounterLog", encounterLogToggle.checked);
            scope.SaveSystem.save();
        });
    }

    document.getElementById("return-btn")?.addEventListener("click", () => scope.retreat("resolve", true));
    document.getElementById("save-btn")?.addEventListener("click", () => scope.SaveSystem.save());
    document.getElementById("load-btn")?.addEventListener("click", () => {
        safeSave();
        globalThis.location.reload();
    });
    document.getElementById("reset-btn")?.addEventListener("click", () => scope.SaveSystem.reset());
    document.getElementById("prestige-btn")?.addEventListener("click", () => scope.SaveSystem.prestige());
}

function subscribeUi(): void {
    const scope = getScope();
    scope.PubSub?.subscribe("resources:updated", updateUi);
    scope.PubSub?.subscribe("stats:updated", updateUi);
    scope.PubSub?.subscribe("age:advanced", updateUi);
    scope.PubSub?.subscribe("routines:changed", updateUi);
    scope.PubSub?.subscribe("routines:changed", scope.updateTaskList);
    scope.PubSub?.subscribe("routine-upgrades:changed", updateUi);
    scope.PubSub?.subscribe("routine-upgrades:changed", scope.updateTaskList);
    scope.PubSub?.subscribe("lang:changed", scope.updateTaskList);
}

function startLoop(): void {
    const scope = getScope();
    setInterval(() => {
        scope.ActionEngine.tick(LOGIC_TICK_MS / 1000);
        scope.AdventureEngine.tick(LOGIC_TICK_MS / 1000);
        scope.UpdateSystem.tick(LOGIC_TICK_MS / 1000);
    }, LOGIC_TICK_MS);
}

export function registerPersistenceHooks(): void {
    const hiddenSave = () => {
        if (document.visibilityState === "hidden") {
            safeSave();
        }
    };

    globalThis.addEventListener?.("pagehide", safeSave);
    globalThis.addEventListener?.("beforeunload", safeSave);
    document.addEventListener?.("visibilitychange", hiddenSave);
}

export function startAutoSaveLoop(): void {
    setInterval(() => {
        safeSave();
    }, AUTOSAVE_INTERVAL_MS);
}

export const appOrchestrator = {
    LOGIC_TICK_MS,
    AUTOSAVE_MS: AUTOSAVE_INTERVAL_MS,
    ensureGlobals() {
        ensureGlobalActionBindings();
    },
    updateUI: updateUi,
    async init() {
        const scope = getScope();
        ensureGlobalActionBindings();
        scope.initPubSub();
        await scope.loadBaseData();
        await scope.StorySystem.load();
        scope.applyPrestigeBonuses();
        await scope.Lang.load(scope.State.language);
        scope.Log.init();
        scope.StorySystem.trigger("intro");
        await loadActions();
        const list = document.getElementById("task-list");
        if (list) {
            Object.values(scope.actions).forEach((action: any) => {
                const el = scope.createActionElement(action);
                if (el) list.appendChild(el);
            });
        }
        await scope.EncounterGenerator.load();
        await scope.ItemGenerator.load();
        await scope.RoutineUpgradeSystem?.load?.();
        await scope.HomeSystem.load();
        await scope.FurnitureSystem.load();
        await scope.ResearchSystem.load();
        await scope.UpdateSystem.load();
        scope.Lang.applyToActions(scope.actions);
        scope.Lang.applyToItems(scope.ItemGenerator.itemList);
        scope.Lang.applyToEncounters(scope.EncounterGenerator.encounters);
        scope.Lang.applyToLocations(scope.EncounterGenerator.milestones);
        scope.SoftCapSystem.recalculateCaps(scope.State.inventory);
        await scope.UIHandler.init();
        scope.PrestigeUI.init();
        scope.OverviewUI.init();
        scope.InventoryUI.init();
        scope.CharacterUI.init();
        scope.HomeUI.init();
        scope.FurnitureUI.init();
        scope.ResearchUI.init();
        scope.RoutineUpgradeUI?.init?.();
        scope.UpdateUI.init();
        scope.CombatUI.init();
        scope.CharacterBackground?.init?.();
        scope.updateTaskList();
        scope.setupSlots();
        scope.setupAdventureSlots();
        scope.setupInventorySlots();
        scope.EncounterGenerator.init();
        scope.EncounterUI.init();
        scope.StoryUI.init();
        scope.ModalUI.init();
        scope.setupDragAndDrop();
        scope.setupTooltips();
        scope.TabManager.init();
        scope.Lang.translateUI();
        scope.TabManager.translate();
        scope.StorySystem.init();
        bindEvents();
        registerPersistenceHooks();
        scope.applyDarkMode();
        updateUi();
        subscribeUi();
        startLoop();
        startAutoSaveLoop();
        safeSave();
    }
};
