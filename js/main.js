// Progress Realm main orchestrator
const LOGIC_TICK_MS = 100;
const TICKS_PER_SECOND = 1000 / LOGIC_TICK_MS;

let actions = {};

function updateUI() {
    StatsUI.update();
    ResourcesUI.update();
    MasteryUI.update();
    PrestigeUI.update();
    document.getElementById('age-years').textContent = State.age.years;
    document.getElementById('age-days').textContent = Math.floor(State.age.days);
    document.getElementById('max-age').textContent = State.age.max;
    document.getElementById('speed-value').textContent = State.time + 'x';
}

async function init() {
    initPubSub();
    await loadBaseData();
    const loadedActions = SaveSystem.load();
    await StorySystem.load();
    applyPrestigeBonuses();
    await Lang.load(State.language);
    Log.init();
    StorySystem.trigger("intro");
    document.getElementById('speed-controls').addEventListener('click', e => {
        const s = e.target.dataset.speed;
        if (!s) return;
        setState('time', parseInt(s, 10));
        updateUI();
    });
    try {
        const res = await fetch('data/actions.json');
        const json = await res.json();
        json.forEach(a => {
            a.hidden = a.hidden || false;
            a.locked = a.locked || false;
            if (a.resourceConsumption) {
                a.resourceCost = a.resourceConsumption;
                delete a.resourceConsumption;
            }
            a.progress = 0;
            actions[a.id] = a;
        });
        if (loadedActions) {
            for (const id in loadedActions) {
                if (actions[id]) {
                    Object.assign(actions[id], loadedActions[id]);
                    if (loadedActions[id].progress !== undefined) {
                        actions[id].progress = loadedActions[id].progress;
                    }
                }
            }
        }
        Object.values(actions).forEach(a => {
            a.currentTier = getActionTier(a.level);
        });
    } catch (e) {
        console.error('Failed to load actions', e);
    }
    const list = document.getElementById('task-list');
    Object.values(actions).forEach(a => {
        const el = createActionElement(a);
        if (el) list.appendChild(el);
    });
    await EncounterGenerator.load();
    await ItemGenerator.load();
    await HomeSystem.load();
    await FurnitureSystem.load();
    await ResearchSystem.load();
    await UpdateSystem.load();
    Lang.applyToActions(actions);
    Lang.applyToItems(ItemGenerator.itemList);
    Lang.applyToEncounters(EncounterGenerator.encounters);
    Lang.applyToLocations(EncounterGenerator.milestones);
    SoftCapSystem.recalculateCaps(State.inventory);
    await UIHandler.init();
    MasteryUI.init();
    PrestigeUI.init();
    InventoryUI.init();
    if (typeof CharacterUI !== 'undefined') {
        CharacterUI.init();
    }
    HomeUI.init();
    FurnitureUI.init();
    ResearchUI.init();
    UpdateUI.init();
    if (typeof CharacterBackground !== 'undefined') {
        CharacterBackground.init();
    }
    updateTaskList();
    setupSlots();
    setupAdventureSlots();
    setupInventorySlots();
    EncounterGenerator.init();
    EncounterUI.init();
    AdventureUI.init();
    StoryUI.init();
    ModalUI.init();
    setupDragAndDrop();
    setupTooltips();
    TabContainer.init();
    Lang.translateUI();
    TabContainer.translate();
    const toggleBtn = document.getElementById('toggle-left');
    StorySystem.init();
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleLeftPanel);
    }
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }
    const settingsClose = document.getElementById('settings-close');
    if (settingsClose) {
        settingsClose.addEventListener('click', closeSettings);
    }
    const filterBtn = document.getElementById('inventory-filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', openInventoryFilter);
    }
    const filterClose = document.getElementById('inventory-filter-close');
    if (filterClose) {
        filterClose.addEventListener('click', closeInventoryFilter);
    }
    const hideToggle = document.getElementById('hide-rarity-toggle');
    if (hideToggle) {
        hideToggle.addEventListener('change', () => {
            setState('hideRarityEnabled', hideToggle.checked);
            InventoryUI.update();
            SaveSystem.save();
        });
    }
    const raritySelect = document.getElementById('hide-rarity-select');
    if (raritySelect) {
        raritySelect.addEventListener('change', () => {
            setState('hideBelowRarity', raritySelect.value);
            InventoryUI.update();
            SaveSystem.save();
        });
    }
    const darkToggle = document.getElementById('dark-mode-toggle');
    if (darkToggle) {
        darkToggle.addEventListener('change', () => {
            setState('darkMode', darkToggle.checked);
            applyDarkMode();
            SaveSystem.save();
        });
    }
    document.querySelectorAll('#right .right-tabs button').forEach(btn => {
        btn.addEventListener('click', () => showRightPanel(btn.dataset.panel));
    });
    showRightPanel('log');
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.value = State.language;
        langSelect.addEventListener('change', async () => {
            setState('language', langSelect.value);
            await Lang.load(State.language);
            Lang.applyToActions(actions);
            Lang.applyToItems(ItemGenerator.itemList);
            Lang.applyToEncounters(EncounterGenerator.encounters);
            Lang.applyToLocations(EncounterGenerator.milestones);
            Lang.translateUI();
            TabContainer.translate();
            StatsUI.translate();
            PrestigeUI.translate();
            ResourcesUI.translate();
            updateTaskList();
            for (let i = 0; i < State.slotCount; i++) updateSlotUI(i);
            for (let i = 0; i < State.adventureSlotCount; i++) updateAdventureSlotUI(i);
            EncounterGenerator.updateName();
            InventoryUI.update();
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('lang:changed');
            }
            SaveSystem.save();
        });
    }
    const autoBox = document.getElementById('autoprogress-toggle');
    if (autoBox) {
        autoBox.checked = State.autoProgress;
        autoBox.addEventListener('change', () => {
            setState('autoProgress', autoBox.checked);
            SaveSystem.save();
        });
    }
    document.getElementById('reset-btn').addEventListener('click', () => SaveSystem.reset());
    const prestigeBtn = document.getElementById('prestige-btn');
    if (prestigeBtn) {
        prestigeBtn.addEventListener('click', () => SaveSystem.prestige());
    }
    applyDarkMode();
    updateUI();
    if (typeof PubSub !== 'undefined') {
        PubSub.subscribe('resources:updated', data => {
            updateUI();
            updateTaskList();
        });
        PubSub.subscribe('stats:updated', updateUI);
        PubSub.subscribe('mastery:changed', updateUI);
        PubSub.subscribe('age:advanced', updateUI);
        PubSub.subscribe('action:levelUp', updateTaskList);
        PubSub.subscribe('action:exp', updateTaskList);
        PubSub.subscribe('lang:changed', updateTaskList);
    }
    setInterval(() => {
        ActionEngine.tick(LOGIC_TICK_MS / 1000);
        AdventureEngine.tick(LOGIC_TICK_MS / 1000);
        UpdateSystem.tick(LOGIC_TICK_MS / 1000);
    }, LOGIC_TICK_MS);
}

init();
