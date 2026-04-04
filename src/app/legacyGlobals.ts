import {
    applyDarkMode,
    closeInventoryFilter,
    closeSettings,
    openInventoryFilter,
    openSettings,
    toggleLeftPanel
} from "./uiActions";

function getScope(): any {
    return globalThis as any;
}

function getMergedStatRecord(primary: any = {}, legacy: any = {}) {
    const primaryLevel = Number(primary.level ?? primary.value ?? 0);
    const legacyLevel = Number(legacy.level ?? legacy.value ?? 0);
    const primaryExp = Number(primary.exp ?? 0);
    const legacyExp = Number(legacy.exp ?? 0);
    const primaryNext = Number(primary.expToNext ?? primary.baseXpRequirement ?? primary.baseMax ?? 20);
    const legacyNext = Number(legacy.expToNext ?? legacy.baseXpRequirement ?? legacy.baseMax ?? 20);
    return {
        ...primary,
        value: primaryLevel + legacyLevel,
        level: primaryLevel + legacyLevel,
        exp: primaryExp + legacyExp,
        expToNext: Math.max(primaryNext, legacyNext),
        baseXpRequirement: Number(primary.baseXpRequirement ?? primary.baseMax ?? legacy.baseXpRequirement ?? legacy.baseMax ?? 20),
        baseMax: Number(primary.baseMax ?? legacy.baseMax ?? 20)
    };
}

function normalizeLegacyStatState(state: any) {
    if (!state || typeof state !== "object") {
        return;
    }
    const stats = state.stats || {};
    if (stats.dexterity && !stats.agility) {
        stats.agility = { ...stats.dexterity };
    }
    if (stats.endurance && !stats.constitution) {
        stats.constitution = { ...stats.endurance };
    }
    if (stats.awareness && !stats.will) {
        stats.will = { ...stats.awareness };
    }
    if (stats.craftsmanship) {
        stats.intelligence = getMergedStatRecord(stats.intelligence, stats.craftsmanship);
    }
    delete stats.dexterity;
    delete stats.endurance;
    delete stats.awareness;
    delete stats.craftsmanship;
    state.stats = stats;

    if (state.routineUpgrades?.layout_tools) {
        const currentNotebook = Number(state.routineUpgrades.field_notebook || 0);
        const migratedTools = Number(state.routineUpgrades.layout_tools || 0);
        state.routineUpgrades.field_notebook = currentNotebook + migratedTools;
        delete state.routineUpgrades.layout_tools;
    }

    const remapRecord = (record: Record<string, any> | undefined) => {
        if (!record || typeof record !== "object") {
            return;
        }
        if (record.dexterity !== undefined && record.agility === undefined) {
            record.agility = record.dexterity;
        }
        if (record.endurance !== undefined && record.constitution === undefined) {
            record.constitution = record.endurance;
        }
        if (record.awareness !== undefined && record.will === undefined) {
            record.will = record.awareness;
        }
        if (record.craftsmanship !== undefined) {
            record.intelligence = Number(record.intelligence || 0) + Number(record.craftsmanship || 0);
        }
        delete record.dexterity;
        delete record.endurance;
        delete record.awareness;
        delete record.craftsmanship;
    };

    (Object.values(state.actionAssignments || {}) as Array<Record<string, any> | undefined>).forEach(remapRecord);
    (Object.values(state.actionRuntime || {}) as any[]).forEach((entry: any) => remapRecord(entry?.statXp));
}

function restoreMasteryProgress(scope: any, key: string, previousMastery: any, baseRequirement: number) {
    scope.ensureMastery(key, scope.State.prestige?.[key] || 0, baseRequirement);
    const mastery = scope.State.mastery?.[key];
    if (!mastery) {
        return;
    }
    const carriedExp = Math.max(0, Number(previousMastery?.exp || 0));
    mastery.baseXpRequirement = baseRequirement || mastery.baseXpRequirement || 20;
    mastery.expToNext = Math.max(1, Number(mastery.expToNext || mastery.baseXpRequirement || 20));
    mastery.exp = carriedExp;
    while (mastery.exp >= mastery.expToNext) {
        mastery.exp -= mastery.expToNext;
        mastery.level = (mastery.level || 0) + 1;
        scope.State.prestige[key] = mastery.level;
        mastery.expToNext = Math.floor((mastery.baseXpRequirement || 20) * Math.pow(1.5, mastery.level || 0));
    }
}

export function installLegacyAppGlobals(): void {
    const scope = getScope();

    scope.toggleLeftPanel = toggleLeftPanel;
    scope.applyDarkMode = applyDarkMode;
    scope.openSettings = openSettings;
    scope.closeSettings = closeSettings;
    scope.openInventoryFilter = openInventoryFilter;
    scope.closeInventoryFilter = closeInventoryFilter;

    scope.Lang = {
        current: "en",
        data: {},
        async load(lang: string) {
            if (lang === "en") {
                this.current = "en";
                this.data = {};
                return;
            }
            try {
                const registry = scope.window?.__appContent;
                this.data = registry && typeof registry.getLanguage === "function"
                    ? await registry.getLanguage(lang)
                    : await (await fetch(`data/lang/${lang}.json`)).json();
                this.current = lang;
            } catch (error) {
                console.error("Lang load failed", error);
                this.data = {};
                this.current = "en";
            }
        },
        ui(key: string) {
            return (this.data.ui && this.data.ui[key]) || null;
        },
        stat(key: string) {
            return (this.data.stats && this.data.stats[key]) || null;
        },
        statDesc(key: string) {
            return (this.data.statDescriptions && this.data.statDescriptions[key]) || null;
        },
        resource(key: string) {
            return (this.data.resources && this.data.resources[key]) || null;
        },
        resourceDesc(key: string) {
            return (this.data.resourceDescriptions && this.data.resourceDescriptions[key]) || null;
        },
        prestigeDesc(key: string) {
            return (this.data.prestigeDescriptions && this.data.prestigeDescriptions[key]) || null;
        },
        effect(key: string) {
            return this.data.effects ? this.data.effects[key] || null : null;
        },
        story(key: string) {
            return (this.data.story && this.data.story[key]) || null;
        },
        log(key: string, params: Record<string, unknown> = {}) {
            if (!this.data.log) {
                return null;
            }
            const text = this.data.log[key];
            if (!text) {
                return null;
            }
            return text.replace(/\{(\w+)\}/g, (match: string, param: string) =>
                params[param] !== undefined ? String(params[param]) : match
            );
        },
        translateUI() {
            document.querySelectorAll("[data-i18n]").forEach((element) => {
                const html = element as HTMLElement;
                let text = this.ui(html.dataset.i18n || "");
                if (!text) {
                    text = html.dataset.i18n || "";
                }
                if (html.childNodes.length > 1 && html.childNodes[0].nodeType === Node.TEXT_NODE) {
                    html.childNodes[0].textContent = text;
                } else {
                    html.textContent = text;
                }
            });
        },
        applyToActions(actions: Record<string, any>) {
            if (!this.data.actions) {
                return;
            }
            Object.values(actions).forEach((action: any) => {
                const translated = this.data.actions[action.id];
                if (!translated) {
                    return;
                }
                if (translated.name) {
                    action.name = translated.name;
                }
                if (translated.description) {
                    action.description = translated.description;
                }
            });
        },
        applyToItems(items: any[]) {
            if (!this.data.items) {
                return;
            }
            items.forEach((item) => {
                const translated = this.data.items[item.id];
                if (!translated) {
                    return;
                }
                if (translated.name) {
                    item.name = translated.name;
                }
                if (translated.description) {
                    item.description = translated.description;
                }
            });
        },
        applyToEncounters(encounters: any[]) {
            if (!this.data.encounters) {
                return;
            }
            encounters.forEach((encounter) => {
                const translated = this.data.encounters[encounter.id];
                if (!translated) {
                    return;
                }
                if (translated.name) {
                    encounter.name = translated.name;
                }
                if (translated.description) {
                    encounter.description = translated.description;
                }
            });
        },
        applyToLocations(milestones: any[]) {
            if (!this.data.locations) {
                return;
            }
            milestones.forEach((milestone) => {
                const translated = this.data.locations[milestone.name];
                if (translated) {
                    milestone.name = translated;
                }
            });
        }
    };

    scope.TabManager = {
        tabs: [],
        activeSections: {},
        currentView: "overview",
        currentWorkspaceId: null,
        _sectionButtons: {},
        load(tabData: any[]) {
            this.tabs = Array.isArray(tabData) ? tabData : [];
        },
        init() {
            this.overviewView = document.getElementById("overview-view");
            this.workspaceView = document.getElementById("workspace-view");
            this.backButton = document.getElementById("back-to-overview");
            this.overviewButton = document.getElementById("overview-btn");
            this.syncUnlockState();
            this.initSections();
            this.backButton?.addEventListener("click", () => this.showOverview());
            this.overviewButton?.addEventListener("click", () => this.showOverview());
            this.showOverview();
        },
        syncUnlockState() {
            const registry = scope.window?.__appContent;
            const service = scope.window?.__progressionService;
            this.tabs.forEach((tab: any) => {
                if (tab.id === "overview" || tab.id === "routines") {
                    tab.hidden = false;
                    return;
                }
                if (service && registry) {
                    tab.hidden = !service.isTabUnlocked(tab.id, scope.State, registry);
                }
            });
        },
        initSections() {
            this.tabs.forEach((tab: any) => {
                if (!tab.sections) {
                    return;
                }
                const content = document.querySelector(`.tab-content[data-tab="${tab.id}"]`);
                if (!content) {
                    return;
                }
                const header = content.querySelector(".section-headers");
                if (!header) {
                    return;
                }
                header.innerHTML = "";
                this._sectionButtons[tab.id] = {};
                tab.sections.forEach((section: any) => {
                    if (section.hidden) {
                        return;
                    }
                    const button = document.createElement("button");
                    button.dataset.tab = tab.id;
                    button.dataset.section = section.id;
                    button.dataset.i18n = section.name;
                    button.disabled = !!section.locked;
                    header.appendChild(button);
                    this._sectionButtons[tab.id][section.id] = button;
                    this.updateSectionButton(section, button);
                });
                header.addEventListener("click", (event: Event) => {
                    const target = event.target as HTMLElement | null;
                    if (!target?.dataset.section) {
                        return;
                    }
                    this.showSection(tab.id, target.dataset.section);
                });
                const first = tab.sections.find((section: any) => !section.hidden);
                if (first) {
                    this.showSection(tab.id, first.id);
                }
            });
        },
        getTab(id: string) {
            return this.tabs.find((tab: any) => tab.id === id);
        },
        getDashboardTabs() {
            return this.tabs.filter((tab: any) => tab.id !== "overview" && tab.overviewVisible !== false && !tab.hidden && !tab.locked);
        },
        getCurrentWorkspace() {
            return this.currentWorkspaceId ? this.getTab(this.currentWorkspaceId) : null;
        },
        isTabVisible(id: string) {
            const tab = this.getTab(id);
            return !!tab && !tab.hidden && !tab.locked;
        },
        updateSectionButton(section: any, button: HTMLButtonElement) {
            const name = scope.Lang.ui(section.name) || section.name;
            const locked = scope.Lang.ui("Locked") || "Locked";
            button.textContent = section.locked ? `${name} (${locked})` : name;
        },
        translate() {
            Object.entries(this._sectionButtons).forEach(([tabId, buttons]: [string, any]) => {
                Object.entries(buttons).forEach(([sectionId, button]: [string, any]) => {
                    const tab = this.getTab(tabId);
                    const section = tab?.sections ? tab.sections.find((item: any) => item.id === sectionId) : null;
                    if (section) {
                        this.updateSectionButton(section, button);
                    }
                });
            });
            if (this.currentWorkspaceId) {
                scope.UIHandler.refreshWorkspace();
            }
        },
        unlockTab(id: string) {
            const tab = this.getTab(id);
            if (!tab) {
                return;
            }
            tab.hidden = false;
            this.refreshOverview();
        },
        showOverview() {
            this.currentView = "overview";
            this.currentWorkspaceId = null;
            this.overviewView?.classList.remove("hidden");
            this.workspaceView?.classList.add("hidden");
            document.querySelectorAll(".tab-content").forEach((element) => element.classList.add("hidden"));
            document.body.dataset.view = "overview";
            this.refreshOverview();
        },
        openWorkspace(id: string) {
            if (!this.isTabVisible(id)) {
                return;
            }
            const tab = this.getTab(id);
            if (!tab) {
                return;
            }
            this.currentView = `workspace:${id}`;
            this.currentWorkspaceId = id;
            this.overviewView?.classList.add("hidden");
            this.workspaceView?.classList.remove("hidden");
            document.querySelectorAll(".tab-content").forEach((element) => {
                element.classList.toggle("hidden", (element as HTMLElement).dataset.tab !== id);
            });
            document.body.dataset.view = "workspace";
            scope.UIHandler.updateWorkspaceHeader(tab);
            if (tab.sections) {
                const active = this.activeSections[id] || tab.sections.find((section: any) => !section.hidden)?.id;
                if (active) {
                    this.showSection(id, active);
                }
            }
        },
        openWorkspaceSection(id: string, sectionId: string) {
            this.openWorkspace(id);
            if (!sectionId) {
                return;
            }
            const tab = this.getTab(id);
            if (!tab?.sections) {
                return;
            }
            const section = tab.sections.find((item: any) => item.id === sectionId && !item.hidden);
            if (section) {
                this.showSection(id, sectionId);
            }
        },
        showSection(tabId: string, sectionId: string) {
            this.activeSections[tabId] = sectionId;
            const content = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
            if (!content) {
                return;
            }
            content.querySelectorAll(".tab-section").forEach((section) => {
                section.classList.toggle("hidden", (section as HTMLElement).dataset.section !== sectionId);
            });
            const buttons = this._sectionButtons[tabId] || {};
            Object.entries(buttons).forEach(([id, button]: [string, any]) => {
                button.classList.toggle("active", id === sectionId);
            });
        },
        refreshOverview() {
            this.syncUnlockState();
            scope.UIHandler.buildLayerCards();
            scope.OverviewUI.update();
        }
    };

    scope.StorySystem = {
        events: [],
        _ageFn: null,
        _encFn: null,
        async load() {
            try {
                const registry = scope.window?.__appContent;
                const json = registry && Array.isArray(registry.storyEvents)
                    ? registry.storyEvents
                    : await (await fetch("data/story_events.json")).json();
                this.events = json.map((event: any) => ({
                    id: event.id,
                    textKey: event.textKey,
                    text: event.text || null,
                    image: event.image || "",
                    flag: event.flag || null,
                    trigger: event.trigger || { type: "manual" },
                    unlocks: event.unlocks || {}
                }));
            } catch (error) {
                console.error("Failed to load story events", error);
                this.events = [];
            }
        },
        init() {
            this.check();
            if (!scope.PubSub) {
                return;
            }
            const ageFn = () => this.check();
            const encounterFn = () => this.check();
            scope.PubSub.subscribe("age:advanced", ageFn);
            scope.PubSub.subscribe("encounter:complete", encounterFn);
            this._ageFn = ageFn;
            this._encFn = encounterFn;
        },
        trigger(id: string) {
            const event = this.events.find((entry: any) => entry.id === id);
            if (!event) {
                return;
            }
            if (event.flag && scope.State[event.flag]) {
                return;
            }
            this._show(event);
        },
        _show(event: any) {
            const text = scope.Lang.story(event.textKey) || event.text || event.textKey;
            scope.PubSub?.publish("story:show", {
                text,
                image: event.image,
                onClose: () => {
                    if (event.flag) {
                        scope.State[event.flag] = true;
                    }
                    this.applyUnlocks(event.unlocks);
                    scope.SaveSystem.save();
                }
            });
        },
        applyUnlocks(unlocks: any) {
            if (!unlocks) {
                return;
            }
            if (unlocks.tabs) {
                unlocks.tabs.forEach((id: string) => {
                    scope.TabManager.unlockTab(id);
                    scope.PubSub?.publish("unlock:tab", id);
                });
            }
            if (unlocks.actions) {
                unlocks.actions.forEach((id: string) => {
                    if (scope.actions?.[id]) {
                        scope.actions[id].locked = false;
                        scope.PubSub?.publish("unlock:action", id);
                    }
                });
            }
            if (unlocks.encounters) {
                unlocks.encounters.forEach((id: string) => {
                    const encounter = scope.EncounterGenerator?.encounters.find((entry: any) => entry.id === id);
                    if (encounter) {
                        encounter.locked = false;
                        scope.PubSub?.publish("unlock:encounter", id);
                    }
                });
            }
        },
        check() {
            const days = scope.State.age.years * scope.AgeSystem.daysPerYear + scope.State.age.days;
            this.events.forEach((event: any) => {
                if (event.flag && scope.State[event.flag]) {
                    return;
                }
                const trigger = event.trigger;
                if (trigger.type === "startup") {
                    this.trigger(event.id);
                } else if (trigger.type === "age" && days >= trigger.days) {
                    this.trigger(event.id);
                }
            });
        }
    };

    scope.SaveSystem = {
        save() {
            const actionData: Record<string, any> = {};
            Object.values(scope.actions || {}).forEach((action: any) => {
                actionData[action.id] = {
                    locked: action.locked,
                    hidden: action.hidden
                };
            });
            const migration = scope.window?.__saveMigrationService;
            const data = migration?.createEnvelope
                ? migration.createEnvelope(scope.State, actionData)
                : { version: scope.VERSION, state: scope.State, actions: actionData };
            localStorage.setItem("progressRealmSave", JSON.stringify(data));
        },
        load() {
            const raw = localStorage.getItem("progressRealmSave");
            if (!raw) {
                return null;
            }
            try {
                const migration = scope.window?.__saveMigrationService;
                const data = migration?.migrate ? migration.migrate(raw) : JSON.parse(raw);
                if (!data || data.version !== scope.VERSION) {
                    try {
                        const suffix = new Date().toISOString().replace(/[:.]/g, "-");
                        localStorage.setItem(`progressRealmSave.invalid.${suffix}`, raw);
                        localStorage.removeItem("progressRealmSave");
                    } catch (storageError) {
                        console.error("Failed to quarantine invalid save", storageError);
                    }
                    return null;
                }
                if (!data.state) {
                    Object.assign(scope.State, data);
                    return null;
                }
                normalizeLegacyStatState(data.state);
                scope.mergeState(data.state);
                scope.RESOURCE_KEYS.forEach((key: string) => {
                    const definition = scope.State.resources[key] || { value: 0, baseMax: 0 };
                    scope.ensureResource(key, definition.value, definition.baseMax);
                });
                scope.STAT_KEYS.forEach((key: string) => {
                    const definition = scope.State.stats[key] || { value: 0, baseMax: 0 };
                    scope.ensureStat(key, definition.value, definition.baseMax);
                });
                if (Array.isArray(scope.State.slots)) {
                    scope.State.slots.forEach((slot: any) => {
                        if (!slot.actionId) slot.actionId = scope.State.defaultActionId;
                        if (slot.text === undefined) slot.text = "";
                        if (slot.queuedActionId === undefined) slot.queuedActionId = null;
                        if (slot.queue === undefined) slot.queue = null;
                    });
                } else {
                    scope.setState("slots", []);
                }
                if (scope.State.slotCount === undefined) {
                    scope.setState("slotCount", Array.isArray(scope.State.slots) ? scope.State.slots.length : 0);
                }
                if (scope.State.encounterLevel === undefined) {
                    scope.setState("encounterLevel", 1);
                }
                if (scope.State.encounterStreak === undefined) {
                    scope.setState("encounterStreak", 0);
                }
                if (!scope.State.currentDungeon) {
                    scope.setState("currentDungeon", "frontier");
                }
                if (scope.State.adventureSlotCount === undefined || scope.State.adventureSlotCount > 1) {
                    scope.setState("adventureSlotCount", 1);
                }
                if (Array.isArray(scope.State.adventureSlots)) {
                    scope.State.adventureSlots.forEach((slot: any) => {
                        if (slot.active === undefined) slot.active = false;
                        if (slot.queue === undefined) slot.queue = null;
                        if (slot.encounter && typeof slot.encounter.getLootChance !== "function") {
                            slot.encounter = new scope.Encounter(slot.encounter);
                        }
                        if (slot.queue?.encounter && typeof slot.queue.encounter.getLootChance !== "function") {
                            slot.queue.encounter = new scope.Encounter(slot.queue.encounter);
                        }
                    });
                }
                if (scope.State.inventorySlotCount === undefined) {
                    scope.setState("inventorySlotCount", 8);
                }
                if (!scope.State.inventory) {
                    scope.setState("inventory", {});
                }
                if (!scope.State.equipment || typeof scope.State.equipment !== "object") {
                    scope.setState("equipment", scope.createDefaultEquipment());
                } else {
                    const defaults = scope.createDefaultEquipment();
                    Object.keys(defaults).forEach((slot) => {
                        if (scope.State.equipment[slot] === undefined) {
                            scope.setState(["equipment", slot], defaults[slot]);
                        }
                    });
                }
                if (scope.State.banditsAmbushSeen === undefined) {
                    scope.setState("banditsAmbushSeen", false);
                }
                if (scope.State.autoProgress === undefined) {
                    scope.setState("autoProgress", true);
                }
                if (scope.State.darkMode === undefined) {
                    scope.setState("darkMode", true);
                }
                if (scope.State.hideRarityEnabled === undefined) {
                    scope.setState("hideRarityEnabled", false);
                }
                if (!scope.State.hideBelowRarity) {
                    scope.setState("hideBelowRarity", "rare");
                }
                if (scope.State.queuedEncounterId === undefined) {
                    scope.setState("queuedEncounterId", null);
                }
                if (!scope.State.combat || typeof scope.State.combat !== "object") {
                    scope.setState("combat", scope.createDefaultCombatState());
                } else {
                    const defaults = scope.createDefaultCombatState();
                    Object.keys(defaults).forEach((key) => {
                        if (scope.State.combat[key] === undefined) {
                            scope.setState(["combat", key], defaults[key]);
                        }
                    });
                }
                if (scope.State.homeId === undefined) {
                    scope.setState("homeId", null);
                }
                if (!Array.isArray(scope.State.furniture)) {
                    scope.setState("furniture", []);
                }
                if (!Array.isArray(scope.State.researchCompleted)) {
                    scope.setState("researchCompleted", []);
                }
                if (!scope.State.actionAssignments || typeof scope.State.actionAssignments !== "object") {
                    scope.setState("actionAssignments", {});
                }
                if (!scope.State.actionRuntime || typeof scope.State.actionRuntime !== "object") {
                    scope.setState("actionRuntime", {});
                }
                if (!scope.State.routineUpgrades || typeof scope.State.routineUpgrades !== "object") {
                    scope.setState("routineUpgrades", {});
                }
                if (!scope.State.encounterCompletions || typeof scope.State.encounterCompletions !== "object") {
                    scope.setState("encounterCompletions", {});
                }
                if (!scope.State.adventureCompletions || typeof scope.State.adventureCompletions !== "object") {
                    scope.setState("adventureCompletions", {});
                }
                if (!Array.isArray(scope.State.homesOwned)) {
                    scope.setState("homesOwned", []);
                }
                if (!scope.State.language) {
                    scope.setState("language", "en");
                }
                if (scope.State.showEncounterLog === undefined) {
                    scope.setState("showEncounterLog", true);
                }
                if (!scope.State.mastery || typeof scope.State.mastery !== "object") {
                    scope.setState("mastery", {});
                }
                scope.PRESTIGE_KEYS.forEach((key: string) => {
                    const mappedStat = Object.keys(scope.PRESTIGE_MAP).find((statKey) => scope.PRESTIGE_MAP[statKey] === key);
                    const baseRequirement = mappedStat && scope.State.stats?.[mappedStat]
                        ? Number(scope.State.stats[mappedStat].baseXpRequirement || scope.State.stats[mappedStat].baseMax || 20)
                        : 20;
                    restoreMasteryProgress(scope, key, scope.State.mastery?.[key], baseRequirement);
                });
                return data.actions || null;
            } catch (error) {
                console.error("Load failed", error);
                try {
                    const suffix = new Date().toISOString().replace(/[:.]/g, "-");
                    localStorage.setItem(`progressRealmSave.corrupt.${suffix}`, raw);
                    localStorage.removeItem("progressRealmSave");
                } catch (storageError) {
                    console.error("Failed to quarantine corrupt save", storageError);
                }
                return null;
            }
        },
        reset() {
            localStorage.removeItem("progressRealmSave");
            scope.window.location.reload();
        },
        async prestige() {
            const prestigeGain: Record<string, number> = {};
            scope.STAT_KEYS.forEach((key: string) => {
                const value = scope.State.stats[key] ? (scope.State.stats[key].level || scope.State.stats[key].value || 0) : 0;
                const prestigeKey = scope.PRESTIGE_MAP[key];
                prestigeGain[prestigeKey] = Math.floor(value / 10);
            });
            const previousPrestige = { ...scope.State.prestige };
            const previousMastery = { ...(scope.State.mastery || {}) };
            await scope.loadBaseData();
            scope.PRESTIGE_KEYS.forEach((key: string) => {
                scope.setState(["prestige", key], (previousPrestige[key] || 0) + (prestigeGain[key] || 0));
            });
            scope.PRESTIGE_KEYS.forEach((key: string) => {
                const mappedStat = Object.keys(scope.PRESTIGE_MAP).find((statKey) => scope.PRESTIGE_MAP[statKey] === key);
                const baseRequirement = mappedStat && scope.State.stats?.[mappedStat]
                    ? Number(scope.State.stats[mappedStat].baseXpRequirement || scope.State.stats[mappedStat].baseMax || 20)
                    : 20;
                restoreMasteryProgress(scope, key, previousMastery[key], baseRequirement);
            });
            scope.applyPrestigeBonuses();
            scope.setState(["age", "years"], 16);
            scope.setState(["age", "days"], 0);
            scope.setState("inventory", {});
            scope.setState("equipment", scope.createDefaultEquipment());
            scope.setState("homeId", null);
            scope.setState("furniture", []);
            scope.setState("adventureSlots", scope.State.adventureSlots.map(() => ({
                text: "",
                progress: 0,
                duration: 1,
                encounter: null,
                active: false,
                queue: null
            })));
            scope.setState("queuedEncounterId", null);
            scope.setState("combat", scope.createDefaultCombatState());
            scope.State.slots.forEach((_: unknown, index: number) => {
                scope.setState(["slots", index, "queuedActionId"], null);
                scope.setState(["slots", index, "queue"], null);
            });
            scope.setState("encounterLevel", 1);
            scope.setState("encounterStreak", 0);
            scope.setState("currentDungeon", "frontier");
            scope.setState("actionAssignments", {});
            scope.setState("actionRuntime", {});
            scope.setState("routineUpgrades", {});
            scope.setState("encounterCompletions", {});
            scope.setState("adventureCompletions", {});
            scope.setState("prestiging", false);
            this.save();
            scope.window.location.reload();
        }
    };
}
