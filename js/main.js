// Progress Realm prototype with leveled actions and resource consumption
// Game logic runs independently from UI updates. Logic ticks occur at a fixed
// rate defined here and resources scale per real-time second regardless of the
// UI refresh rate.
//
// Agents: `init()` wires together all subsystems. After initialization the
// following loop runs:
//   setInterval -> ActionEngine.tick -> DeltaEngine.calculate/apply -> save
// UI updates run separately in another interval. Refer to this file when tracing
// the start of the game flow.
const LOGIC_TICK_MS = 100; // milliseconds between logic updates
const UI_UPDATE_MS = 200;  // milliseconds between UI refreshes
const TICKS_PER_SECOND = 1000 / LOGIC_TICK_MS;

// State and helper functions moved to state.js
let actions = {};
let selectedActionId = null;


function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function setupPubSub() {
    PubSub.subscribe('modal:open', id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    });
    PubSub.subscribe('modal:close', id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    PubSub.subscribe('unlock:tab', id => TabManager.unlockTab(id));
    PubSub.subscribe('unlock:action', id => {
        if (actions[id]) {
            actions[id].locked = false;
            updateTaskList();
        }
    });
    PubSub.subscribe('unlock:encounter', id => {
        const enc = EncounterGenerator.encounters.find(e => e.id === id);
        if (enc) enc.locked = false;
    });
    PubSub.subscribe('age:advanced', days => {
        if (typeof FurnitureSystem !== 'undefined' && FurnitureSystem.decay) {
            FurnitureSystem.decay(days);
        }
    });
    PubSub.subscribe('age:maxReached', () => {
        if (!State.prestiging) {
            State.prestiging = true;
            SaveSystem.prestige();
        }
    });
}






function applyPrestigeBonuses() {
    STAT_KEYS.forEach(k => {
        const pKey = PRESTIGE_MAP[k];
        const p = State.prestige[pKey] || 0;
        if (State.stats[k]) {
            State.stats[k].maxMultipliers = [1 + p * 0.02];
        }
        if (typeof BonusEngine !== 'undefined') {
            BonusEngine.statMultipliers[k] = 1 + p * 0.05;
        }
    });
}

const AdventureEngine = {
    activeIndex: null,
    waitResource: null,
    recovering: false,
    startSlot(i = 0) {
        if (this.recovering) {
            const rec = EncounterGenerator.getRecoverEncounter();
            if (rec) {
                const slot = State.adventureSlots[i];
                slot.encounter = rec;
                slot.duration = rec.getDuration();
                slot.progress = 0;
                slot.active = true;
                this.activeIndex = i;
                this.recovering = false;
                updateAdventureSlotUI(i);
                return;
            }
        }

        if (this.waitResource) {
            const res = State.resources[this.waitResource];
            if (res && res.value < ResourceSystem.max(res)) {
                this.activeIndex = null;
                return;
            }
            this.waitResource = null;
        }
        const encounter = EncounterGenerator.randomEncounter();
        const slot = State.adventureSlots[i];
        slot.encounter = encounter;
        slot.duration = encounter ? encounter.getDuration() : 1;
        slot.progress = 0;
        slot.active = true;
        this.activeIndex = i;
        updateAdventureSlotUI(i);
    },
    tick(delta) {
        if (this.activeIndex === null) {
            if (State.healerGoneSeen) this.startSlot(0);
            return;
        }
        const slot = State.adventureSlots[this.activeIndex];
        if (!slot.encounter) return;
        const cost = slot.encounter.getResourceCost();
        const missing = canAfford(cost, delta);
        if (missing) {
            retreat(missing);
            return;
        }
        if (slot.progress >= 1) {
            EncounterGenerator.resolve(slot.encounter);
            slot.active = false;
            slot.encounter = null;
            slot.progress = 0;
            State.encounterStreak += 1;
            EncounterGenerator.updateProgressBar();
            updateAdventureSlotUI(this.activeIndex);
            if (State.encounterStreak >= 10) {
                if (State.autoProgress) {
                    EncounterGenerator.incrementLevel();
                    State.encounterStreak = 0;
                    EncounterGenerator.updateProgressBar();
                } else {
                    State.encounterStreak = 10;
                    EncounterGenerator.updateProgressBar();
                }
            }
            this.startSlot(this.activeIndex);
        } else {
            updateAdventureSlotUI(this.activeIndex);
        }
        checkHealth();
    }
};


function retreat(resourceName, manual = false) {
    const slot = AdventureEngine.activeIndex !== null ?
        State.adventureSlots[AdventureEngine.activeIndex] : null;
    const enc = slot && slot.encounter ? slot.encounter.name : 'an encounter';
    const resLabel = Lang.resource(resourceName) || resourceName;
    const msg = Lang.log('retreat', { encounter: enc, resource: resLabel }) ||
        `You had to retreat after ${enc} because you ran out of ${resLabel}.`;
    Log.add(msg);
    AdventureEngine.waitResource = resourceName;
    if (!manual) AdventureEngine.recovering = true;
    EncounterGenerator.decrementLevel();
    EncounterGenerator.resetProgress();
}

function checkHealth() {
    if (State.resources.health.value < 0.1) {
        retreat('health');
    }
}

function formatDelta(v) {
    const sign = v > 0 ? '+' : '';
    return sign + v.toFixed(1);
}

const TierSystem = {
    tiers: [
        { name: 'bronze', level: 10 },
        { name: 'silver', level: 50 },
        { name: 'gold', level: 200 }
    ],
    scale: 4,
    getTier(level) {
        let tier = 'normal';
        let last = 1;
        for (const t of this.tiers) {
            if (level >= t.level) {
                tier = t.name;
                last = t.level;
            } else {
                return tier;
            }
        }
        let index = this.tiers.length;
        while (level >= last * this.scale) {
            last *= this.scale;
            tier = `tier${index}`;
            index++;
        }
        return tier;
    }
};

function getActionTier(level) {
    return TierSystem.getTier(level);
}


function scalingMultiplier(action) {
    const f = action.scaling;
    let lvl = action.level;
    if (lvl > f.softcapLevel) {
        lvl = f.softcapLevel + (lvl - f.softcapLevel) * f.falloff;
    }
    return f.base + f.multiplier * lvl;
}

function canAfford(cost, delta, mult = 1) {
    for (const k in cost) {
        const amount = cost[k] * mult * State.time * delta;
        const res = State.resources[k];
        if (!res || res.value < amount) return k;
    }
    return null;
}

function applyYield(base, mult, delta) {
    if (base.stats) {
        for (const s in base.stats) {
            StatSystem.add(State.stats[s], base.stats[s] * mult * State.time * delta);
        }
    }
    if (base.resources) {
        for (const r in base.resources) {
            ResourceSystem.add(State.resources[r], base.resources[r] * mult * State.time * delta);
        }
    }
}

function gainExp(action, amount) {
    action.exp += amount;
    while (action.exp >= action.expToNext) {
        action.exp -= action.expToNext;
        const oldTier = getActionTier(action.level);
        action.level += 1;
        action.expToNext = Math.floor(action.expToNext * 1.1 + 5);
        const newTier = getActionTier(action.level);
        if (newTier !== oldTier) {
            State.masteryPoints += 1;
            action.currentTier = newTier;
        }
    }
}

const ActionEngine = {
    start(slotIndex, actionId) {
        const slot = State.slots[slotIndex];
        slot.actionId = actionId;
        slot.progress = 0;
        slot.blocked = false;
        slot.text = actions[actionId] ? actions[actionId].name : '';
        updateSlotUI(slotIndex);
    },
    tick(delta) {
        DeltaEngine.calculate();
        DeltaEngine.apply(delta, State.time);
        State.slots.forEach((slot, i) => {
            if (!slot.actionId) return;
            const action = actions[slot.actionId];
            slot.progress = action.exp / action.expToNext;
            updateSlotUI(i);
        });
        StorySystem.check();
        SoftCapSystem.apply();
        checkHealth();
        SaveSystem.save();
    }
};

function createActionElement(action) {
    if (action.hidden) return null;
    const li = document.createElement('li');
    li.textContent = `${action.name} Lv.${action.level}`;
    li.dataset.taskId = action.id;
    li.dataset.tooltip = `${action.name} - ${capitalize(getActionTier(action.level))}`;
    const tierClass = `tier-${getActionTier(action.level)}`;
    li.classList.add(tierClass);
    if (action.locked) {
        li.classList.add('locked');
    } else {
        li.setAttribute('draggable', 'true');
        li.addEventListener('dragstart', e => {
            li.classList.add('dragging');
            e.dataTransfer.setData('text/plain', action.id);
        });
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
        li.addEventListener('click', () => {
            if (selectedActionId === action.id) {
                selectedActionId = null;
                li.classList.remove('selected');
            } else {
                selectedActionId = action.id;
                document.querySelectorAll('#task-list li').forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
            }
        });
    }
    return li;
}

function setupSlots() {
    const container = document.getElementById('slots');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(State.slots)) State.slots = [];
    if (State.slotCount === undefined) State.slotCount = State.slots.length;
    while (State.slots.length < State.slotCount) {
        State.slots.push({ actionId: null, progress: 0, blocked: false, text: '' });
    }
    if (State.slots.length > State.slotCount) {
        State.slots = State.slots.slice(0, State.slotCount);
    }
    for (let i = 0; i < State.slotCount; i++) {
        const slot = new BaseSlot();
        const slotEl = slot.el;
        slotEl.dataset.slot = i;
        slotEl.dataset.tooltip = 'Drag an action here';
        container.appendChild(slotEl);
        updateSlotUI(i);
    }
}

function setupAdventureSlots() {
    const container = document.getElementById('adventure-slots');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(State.adventureSlots)) State.adventureSlots = [];
    if (State.adventureSlotCount === undefined) State.adventureSlotCount = State.adventureSlots.length;
    while (State.adventureSlots.length < State.adventureSlotCount) {
        State.adventureSlots.push({ text: '', progress: 0, duration: 1, encounter: null, active: false });
    }
    if (State.adventureSlots.length > State.adventureSlotCount) {
        State.adventureSlots = State.adventureSlots.slice(0, State.adventureSlotCount);
    }
    for (let i = 0; i < State.adventureSlotCount; i++) {
        if (State.adventureSlots[i].active === undefined) State.adventureSlots[i].active = false;
        const slot = new BaseSlot();
        const slotEl = slot.el;
        slotEl.dataset.slot = i;
        container.appendChild(slotEl);
        updateAdventureSlotUI(i);
    }
}

function setupInventorySlots() {
    InventoryUI.update();
}

function setupDragAndDrop() {
    document.querySelectorAll('#slots .slot').forEach(slotEl => {
        slotEl.addEventListener('dragover', e => e.preventDefault());
        slotEl.addEventListener('drop', e => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const index = parseInt(slotEl.dataset.slot, 10);
            ActionEngine.start(index, id);
        });
        slotEl.addEventListener('click', () => {
            if (!selectedActionId) return;
            const index = parseInt(slotEl.dataset.slot, 10);
            ActionEngine.start(index, selectedActionId);
        });
    });
}

function setupTooltips() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
    function show(e) {
        const text = e.target.dataset.tooltip;
        if (!text) return;
        tooltip.textContent = text;
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = (e.pageY + 10) + 'px';
        tooltip.style.display = 'block';
    }
    function hide() { tooltip.style.display = 'none'; }
    document.addEventListener('mouseover', show);
    document.addEventListener('mousemove', show);
    document.addEventListener('mouseout', hide);
}

function updateTaskList() {
    Object.values(actions).forEach(action => {
        const li = document.querySelector(`#task-list li[data-task-id="${action.id}"]`);
        if (!li) return;
        li.textContent = `${action.name} Lv.${action.level}`;
        li.dataset.tooltip = `${action.name} - ${capitalize(getActionTier(action.level))}`;
        li.classList.remove('tier-normal', 'tier-bronze', 'tier-silver', 'tier-gold');
        li.classList.add(`tier-${getActionTier(action.level)}`);
    });
}

function updateSlotUI(i) {
    const slot = State.slots[i];
    const slotEl = document.querySelector(`#slots .slot[data-slot="${i}"]`);
    if (!slotEl) return;
    const progressEl = slotEl.querySelector('progress');
    const labelEl = slotEl.querySelector('.label');
    slotEl.classList.toggle('blocked', slot.blocked);
    if (!slot.actionId) {
        progressEl.value = 0;
        progressEl.max = 1;
        labelEl.textContent = slot.text || '';
        slotEl.style.backgroundImage = 'none';
        slotEl.dataset.tooltip = 'Drag an action here';
        return;
    }
    const action = actions[slot.actionId];
    progressEl.max = 1;
    progressEl.value = slot.progress;
    labelEl.textContent = slot.text || `${action.name} Lv.${action.level}`;
    if (action.image) {
        slotEl.style.backgroundImage = `url(${action.image})`;
    } else {
        slotEl.style.backgroundImage = 'none';
    }
    slotEl.dataset.tooltip = `${action.name} - ${capitalize(getActionTier(action.level))}`;
}

function updateAdventureSlotUI(i) {
    const slot = State.adventureSlots[i];
    const slotEl = document.querySelector(`#adventure-slots .slot[data-slot="${i}"]`);
    if (!slotEl) return;
    const progressEl = slotEl.querySelector('progress');
    const labelEl = slotEl.querySelector('.label');
    RARITY_CLASSES.forEach(r => slotEl.classList.remove(`rarity-${r}`));
    progressEl.value = slot.progress || 0;
    progressEl.max = 1;
    if (slot.active && slot.encounter) {
        labelEl.textContent = slot.encounter.name;
        if (slot.encounter.image) {
            slotEl.style.backgroundImage = `url(${slot.encounter.image})`;
            slotEl.style.backgroundSize = 'cover';
        }
        slotEl.classList.add(`rarity-${slot.encounter.rarity}`);
        // Build tooltip with encounter description, drop chances, and loot info
        const parts = [slot.encounter.description];
        if (slot.encounter.items && Object.keys(slot.encounter.items).length) {
            const chance = slot.encounter.getLootChance();
            const total = Object.values(slot.encounter.items).reduce((a, b) => a + b, 0) || 1;
            const lines = Object.entries(slot.encounter.items).map(([id, weight]) => {
                const item = ItemGenerator.itemList.find(i => i.id === id);
                const name = item ? item.name : id;
                const pct = chance * (weight / total) * 100;
                return `${name}: ${pct.toFixed(1)}%`;
            });
            if (lines.length) {
                parts.push((Lang.ui('Drop Chances') || 'Drop chances') + ':');
                parts.push(...lines);
            }
        }
        if (slot.encounter.loot && Object.keys(slot.encounter.loot).length) {
            const mult = slot.encounter.getLootMultiplier();
            const lines = Object.entries(slot.encounter.loot).map(([id, qty]) => {
                const item = ItemGenerator.itemList.find(i => i.id === id);
                const name = item ? item.name : id;
                const total = Math.floor(qty * mult);
                return `${name} x${total}`;
            });
            if (lines.length) {
                parts.push((Lang.ui('Guaranteed Loot') || 'Guaranteed loot') + ':');
                parts.push(...lines);
            }
        }
        slotEl.dataset.tooltip = parts.join('\n');
    } else {
        labelEl.textContent = slot.text || '';
        slotEl.style.backgroundImage = 'none';
        slotEl.dataset.tooltip = '';
    }
}

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
    setupPubSub();
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
        State.time = parseInt(s, 10);
        updateUI();
    });
    try {
        const res = await fetch('data/actions.json');
        const json = await res.json();
        json.forEach(a => {
            a.hidden = a.hidden || false;
            a.locked = a.locked || false;
            actions[a.id] = a;
        });
        if (loadedActions) {
            for (const id in loadedActions) {
                if (actions[id]) {
                    Object.assign(actions[id], loadedActions[id]);
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
    HomeSystem.init();
    FurnitureSystem.init();
    ResearchSystem.init();
    UpdateSystem.init();
    if (typeof CharacterBackground !== 'undefined') {
        CharacterBackground.init();
    }
    updateTaskList();
    setupSlots();
    setupAdventureSlots();
    setupInventorySlots();
    EncounterGenerator.init();
    setupDragAndDrop();
    setupTooltips();
    TabManager.init();
    Lang.translateUI();
    TabManager.translate();
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
            State.hideRarityEnabled = hideToggle.checked;
            InventoryUI.update();
            SaveSystem.save();
        });
    }
    const raritySelect = document.getElementById('hide-rarity-select');
    if (raritySelect) {
        raritySelect.addEventListener('change', () => {
            State.hideBelowRarity = raritySelect.value;
            InventoryUI.update();
            SaveSystem.save();
        });
    }
    const darkToggle = document.getElementById('dark-mode-toggle');
    if (darkToggle) {
        darkToggle.addEventListener('change', () => {
            State.darkMode = darkToggle.checked;
            applyDarkMode();
            SaveSystem.save();
        });
    }
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.value = State.language;
        langSelect.addEventListener('change', async () => {
            State.language = langSelect.value;
            await Lang.load(State.language);
            Lang.applyToActions(actions);
            Lang.applyToItems(ItemGenerator.itemList);
            Lang.applyToEncounters(EncounterGenerator.encounters);
            Lang.applyToLocations(EncounterGenerator.milestones);
            Lang.translateUI();
            TabManager.translate();
            StatsUI.translate();
            PrestigeUI.translate();
            ResourcesUI.translate();
            updateTaskList();
            for (let i = 0; i < State.slotCount; i++) updateSlotUI(i);
            for (let i = 0; i < State.adventureSlotCount; i++) updateAdventureSlotUI(i);
            EncounterGenerator.updateName();
            InventoryUI.update();
            SaveSystem.save();
        });
    }
    const autoBox = document.getElementById('autoprogress-toggle');
    if (autoBox) {
        autoBox.checked = State.autoProgress;
        autoBox.addEventListener('change', () => {
            State.autoProgress = autoBox.checked;
            SaveSystem.save();
        });
    }
    document.getElementById('return-btn').addEventListener('click', () => {
        retreat('resolve', true);
    });
    document.getElementById('reset-btn').addEventListener('click', () => SaveSystem.reset());
    const prestigeBtn = document.getElementById('prestige-btn');
    if (prestigeBtn) {
        prestigeBtn.addEventListener('click', () => SaveSystem.prestige());
    }
    applyDarkMode();
    updateUI();
    // Game logic ticked separately from UI updates so resource generation
    // remains consistent regardless of UI refresh rate.
    setInterval(() => {
        ActionEngine.tick(LOGIC_TICK_MS / 1000);
        AdventureEngine.tick(LOGIC_TICK_MS / 1000);
        UpdateSystem.tick(LOGIC_TICK_MS / 1000);
    }, LOGIC_TICK_MS);
    setInterval(() => {
        updateTaskList();
        updateUI();
    }, UI_UPDATE_MS);
}

// Directly invoke init because scripts load at the end of the page,
// meaning the DOMContentLoaded event has already fired
init();

