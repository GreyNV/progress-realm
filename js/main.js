// Progress Realm prototype with leveled actions and resource consumption
const VERSION = 2;
// Game logic runs independently from UI updates. Logic ticks occur at a fixed
// rate defined here and resources scale per real-time second regardless of the
// UI refresh rate.
const LOGIC_TICK_MS = 100; // milliseconds between logic updates
const UI_UPDATE_MS = 200;  // milliseconds between UI refreshes
const TICKS_PER_SECOND = 1000 / LOGIC_TICK_MS;

const ResourceSystem = {
    create(value, baseMax) {
        return { value: value, baseMax: baseMax, maxAdditions: [], maxMultipliers: [] };
    },
    max(res) {
        let m = res.baseMax;
        res.maxAdditions.forEach(a => { m += a; });
        res.maxMultipliers.forEach(x => { m *= x; });
        return m;
    },
    add(res, amt) {
        res.value = Math.min(res.value + amt, this.max(res));
    },
    consume(res, amt) {
        if (res.value < amt) return false;
        res.value -= amt;
        return true;
    }
};

function getResourceValue(name) {
    return State.resources[name].value;
}

function getResourceMax(name) {
    return ResourceSystem.max(State.resources[name]);
}

function setResourceValue(name, val) {
    const r = State.resources[name];
    r.value = Math.min(val, getResourceMax(name));
}
function ensureResource(name, value, max) {
    if (!State.resources[name] || typeof State.resources[name].value !== "number") {
        State.resources[name] = ResourceSystem.create(value, max);
    }
}

const State = {
    version: VERSION,
    age: { years: 16, days: 0, max: 75 },
    introSeen: false,
    healerGoneSeen: false,
    stats: {
        strength: 0,
        intelligence: 0,
        creativity: 0,
    },
    resources: {
        energy: ResourceSystem.create(10, 10),
        focus: ResourceSystem.create(10, 10),
        health: ResourceSystem.create(1, 10),
        money: ResourceSystem.create(0, 100)
    },
    // number of available action slots
    slotCount: 6,
    slots: [],
    adventureSlotCount: 1,
    adventureSlots: [],
    inventorySlotCount: 8,
    inventory: {},
    time: 1,
    masteryPoints: 0,
    encounterLevel: 0,
    encounterStreak: 0,
};

for (let i = 0; i < State.slotCount; i++) {
    State.slots.push({ actionId: null, progress: 0, blocked: false, text: '' });
}

for (let i = 0; i < State.adventureSlotCount; i++) {
    State.adventureSlots.push({ text: '', progress: 0, duration: 1, encounter: null, active: false });
}

let actions = {};
let selectedActionId = null;

const STAT_KEYS = ["strength", "intelligence", "creativity"];
const RESOURCE_KEYS = ["energy", "focus", "health", "money"];

let statDeltas = { strength: 0, intelligence: 0, creativity: 0 };
let resourceDeltas = { energy: 0, focus: 0, health: 0, money: 0 };

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


const Story = {
    active: false,
    show(text, image, onClose) {
        if (this.active) return;
        this.active = true;
        const modal = document.getElementById('story-modal');
        const textEl = document.getElementById('story-text');
        const imageEl = document.getElementById('story-image');
        textEl.textContent = text;
        imageEl.innerHTML = '';
        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.alt = '';
            imageEl.appendChild(img);
        }
        modal.classList.remove('hidden');
        const close = () => {
            modal.classList.add('hidden');
            document.getElementById('story-close').removeEventListener('click', close);
            this.active = false;
            Log.add(text);
            if (onClose) onClose();
        };
        document.getElementById('story-close').addEventListener('click', close);
    }
};

const SoftCapSystem = {
    statCaps: { strength: 50, intelligence: 50, creativity: 50 },
    resourceCaps: { energy: 20, focus: 20, health: 10, money: 100 },
    falloff: 0.5,
    apply() {
        for (const s in this.statCaps) {
            const cap = this.statCaps[s];
            if (State.stats[s] > cap) {
                State.stats[s] = cap + (State.stats[s] - cap) * this.falloff;
            }
        }
        for (const r in this.resourceCaps) {
            const cap = this.resourceCaps[r];
            const val = getResourceValue(r);
            if (val > cap) {
                setResourceValue(r, cap + (val - cap) * this.falloff);
            }
        }
    }
};

const TabManager = {
    tabs: [
        { id: 'routines', name: 'Routines', hidden: false, locked: false },
        { id: 'adventure', name: 'Adventure', hidden: true, locked: false },
        { id: 'inventory', name: 'Inventory', hidden: false, locked: false },
        { id: 'automation', name: 'Automation', hidden: false, locked: false },
    ],
    init() {
        this.header = document.getElementById('tab-headers');
        if (State.healerGoneSeen) {
            const adv = this.tabs.find(t => t.id === 'adventure');
            if (adv) adv.hidden = false;
        }
        this.tabs.forEach(tab => {
            if (tab.hidden) return;
            this._createButton(tab);
        });
        this.header.addEventListener('click', e => {
            if (!e.target.dataset.tab) return;
            this.showTab(e.target.dataset.tab);
        });
        const first = this.tabs.find(t => !t.hidden);
        if (first) this.showTab(first.id);
    },
    _createButton(tab) {
        const btn = document.createElement('button');
        btn.textContent = tab.locked ? `${tab.name} (Locked)` : tab.name;
        btn.dataset.tab = tab.id;
        if (tab.locked) btn.disabled = true;
        this.header.appendChild(btn);
    },
    unlockTab(id) {
        const tab = this.tabs.find(t => t.id === id);
        if (!tab || !tab.hidden) return;
        tab.hidden = false;
        this._createButton(tab);
    },
    showTab(id) {
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.toggle('hidden', el.dataset.tab !== id);
        });
        document.querySelectorAll('#tab-headers button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === id);
        });
    }
};

const SaveSystem = {
    save() {
        const actionData = {};
        Object.values(actions).forEach(a => {
            actionData[a.id] = {
                level: a.level,
                exp: a.exp,
                expToNext: a.expToNext,
                currentTier: a.currentTier
            };
        });
        const data = { version: VERSION, state: State, actions: actionData };
        localStorage.setItem('progressRealmSave', JSON.stringify(data));
    },
    load() {
        const raw = localStorage.getItem('progressRealmSave');
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            if (data.version !== VERSION) return null;
            if (data.state) {
                Object.assign(State, data.state);
                ensureResource("energy", 10, 10);
                ensureResource("focus", 10, 10);
                ensureResource("health", 1, 10);
                ensureResource("money", 0, 100);
                if (Array.isArray(State.slots)) {
                    State.slots.forEach(s => {
                        if (s.text === undefined) s.text = '';
                    });
                } else {
                    State.slots = [];
                }
                if (State.slotCount === undefined) {
                    State.slotCount = Array.isArray(State.slots) ? State.slots.length : 0;
                }
                if (State.encounterLevel === undefined) {
                    State.encounterLevel = 0;
                }
                if (State.encounterStreak === undefined) {
                    State.encounterStreak = 0;
                }
                if (State.adventureSlotCount === undefined || State.adventureSlotCount > 1) {
                    State.adventureSlotCount = 1;
                }
                if (Array.isArray(State.adventureSlots)) {
                    State.adventureSlots.forEach(s => {
                        if (s.active === undefined) s.active = false;
                    });
                }
                if (State.inventorySlotCount === undefined) {
                    State.inventorySlotCount = 8;
                }
                if (!State.inventory) {
                    State.inventory = {};
                }
                return data.actions || null;
            } else {
                Object.assign(State, data); // legacy save
                return null;
            }
        } catch (e) {
            console.error('Load failed', e);
            return null;
        }
    },
    reset() {
        localStorage.removeItem('progressRealmSave');
        window.location.reload();
    }
};

const AgeSystem = {
    daysPerYear: 365,
    tick(delta) {
        State.age.days += State.time * delta;
        if (State.age.days >= this.daysPerYear) {
            State.age.years += Math.floor(State.age.days / this.daysPerYear);
            State.age.days = State.age.days % this.daysPerYear;
        }
    }
};

const AdventureEngine = {
    activeIndex: null,
    waitResource: null,
    startSlot(i = 0) {
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
        slot.progress += delta / slot.duration;
        if (slot.progress >= 1) {
            EncounterGenerator.resolve(slot.encounter);
            slot.active = false;
            slot.encounter = null;
            slot.progress = 0;
            State.encounterStreak += 1;
            updateAdventureSlotUI(this.activeIndex);
            if (State.encounterStreak >= 10) {
                EncounterGenerator.incrementLevel();
                State.encounterStreak = 0;
            }
            this.startSlot(this.activeIndex);
        } else {
            updateAdventureSlotUI(this.activeIndex);
        }
        checkHealth();
    }
};

function updateDeltas() {
    // reset deltas
    STAT_KEYS.forEach(k => { statDeltas[k] = 0; });
    RESOURCE_KEYS.forEach(k => { resourceDeltas[k] = 0; });

    // contributions from active actions
    State.slots.forEach(slot => {
        if (!slot.actionId || slot.blocked) return;
        const action = actions[slot.actionId];
        const mult = scalingMultiplier(action);

        if (action.baseYield.stats) {
            for (const s in action.baseYield.stats) {
                statDeltas[s] = (statDeltas[s] || 0) +
                    action.baseYield.stats[s] * mult;
            }
        }

        if (action.baseYield.resources) {
            for (const r in action.baseYield.resources) {
                const rate = action.baseYield.resources[r] * mult;
                resourceDeltas[r] = (resourceDeltas[r] || 0) + rate;
            }
        }

        if (action.resourceConsumption) {
            for (const r in action.resourceConsumption) {
                const rate = action.resourceConsumption[r] * mult;
                resourceDeltas[r] = (resourceDeltas[r] || 0) - rate;
            }
        }
    });

    // contributions from active encounters
    State.adventureSlots.forEach(slot => {
        if (!slot.active || !slot.encounter) return;
        const cost = slot.encounter.getResourceCost();
        for (const r in cost) {
            const rate = cost[r];
            resourceDeltas[r] = (resourceDeltas[r] || 0) - rate;
        }
    });
}

// Apply the computed per-second deltas to stats and resources based on the
// elapsed time fraction. Negative resource deltas consume resources using the
// ResourceSystem so values never drop below zero.
function applyDeltas(deltaSeconds) {
    STAT_KEYS.forEach(k => {
        State.stats[k] = (State.stats[k] || 0) + statDeltas[k] * deltaSeconds;
    });
    RESOURCE_KEYS.forEach(k => {
        const change = resourceDeltas[k] * deltaSeconds;
        if (change >= 0) {
            ResourceSystem.add(State.resources[k], change);
        } else {
            ResourceSystem.consume(State.resources[k], -change);
        }
    });
}

function retreat(resourceName) {
    const slot = AdventureEngine.activeIndex !== null ?
        State.adventureSlots[AdventureEngine.activeIndex] : null;
    const enc = slot && slot.encounter ? slot.encounter.name : 'an encounter';
    Log.add(`You had to retreat after ${enc} because you ran out of ${resourceName}.`);
    AdventureEngine.waitResource = resourceName;
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

function checkStoryEvents() {
    // Trigger when the hero recovers and notices the healer is gone
    if (!State.introSeen || State.healerGoneSeen) return;
    const currentDays = State.age.years * AgeSystem.daysPerYear + State.age.days;
    const triggerDays = 16 * AgeSystem.daysPerYear + 30;
    if (currentDays > triggerDays) {
        Story.show(
            "The cot is cold. The fire long dead. The healer is gone — no note, no trace, just the fading scent of herbs. You rise, steadier now. The shelves are bare. Outside, a narrow road cuts through the trees. In the distance, a thin plume of smoke rises. The pendant at your neck feels heavier — as if urging you forward.",
            'assets/HealerGone.png',
            () => {
                State.healerGoneSeen = true;
                TabManager.unlockTab('adventure');
                TabManager.showTab('adventure');
                SaveSystem.save();
            }
        );
    }
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
            State.stats[s] = (State.stats[s] || 0) + base.stats[s] * mult * State.time * delta;
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
        AgeSystem.tick(delta);
        updateDeltas();
        applyDeltas(delta);
        State.slots.forEach((slot, i) => {
            if (!slot.actionId) return;
            const action = actions[slot.actionId];
            const mult = scalingMultiplier(action);
            gainExp(action, action.baseYield.exp * mult * delta);
            slot.progress = action.exp / action.expToNext;
            updateSlotUI(i);
        });
        checkStoryEvents();
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
        const slotEl = document.createElement('div');
        slotEl.className = 'slot';
        slotEl.dataset.slot = i;
        slotEl.dataset.tooltip = 'Drag an action here';

        const label = document.createElement('span');
        label.className = 'label';
        slotEl.appendChild(label);

        const wrapper = document.createElement('div');
        wrapper.className = 'progress-wrapper';
        const prog = document.createElement('progress');
        prog.value = 0;
        prog.max = 100;
        wrapper.appendChild(prog);
        slotEl.appendChild(wrapper);

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
        const slotEl = document.createElement('div');
        slotEl.className = 'slot';
        slotEl.dataset.slot = i;

        const label = document.createElement('span');
        label.className = 'label';
        slotEl.appendChild(label);

        const wrapper = document.createElement('div');
        wrapper.className = 'progress-wrapper';
        const prog = document.createElement('progress');
        prog.value = 0;
        prog.max = 1;
        wrapper.appendChild(prog);
        slotEl.appendChild(wrapper);

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
}

function updateAdventureSlotUI(i) {
    const slot = State.adventureSlots[i];
    const slotEl = document.querySelector(`#adventure-slots .slot[data-slot="${i}"]`);
    if (!slotEl) return;
    const progressEl = slotEl.querySelector('progress');
    const labelEl = slotEl.querySelector('.label');
    progressEl.value = slot.progress || 0;
    progressEl.max = 1;
    if (slot.active && slot.encounter) {
        labelEl.textContent = slot.encounter.name;
        if (slot.encounter.image) {
            slotEl.style.backgroundImage = `url(${slot.encounter.image})`;
            slotEl.style.backgroundSize = 'cover';
        }
    } else {
        labelEl.textContent = slot.text || '';
        slotEl.style.backgroundImage = 'none';
    }
}

function updateUI() {
    StatsUI.update();
    ResourcesUI.update();
    MasteryUI.update();
    document.getElementById('age-years').textContent = State.age.years;
    document.getElementById('age-days').textContent = Math.floor(State.age.days);
    document.getElementById('max-age').textContent = State.age.max;
    document.getElementById('speed-value').textContent = State.time + 'x';
}

async function init() {
    const loadedActions = SaveSystem.load();
    Log.init();
    if (!State.introSeen) {
        Story.show(
            "You awaken in a healer's hut, the sole survivor of a caravan ambush. Months have passed in recovery and now, with strength slowly returning, your true journey begins. The healer, an old woman with eyes like weathered stone, presses a worn pendant into your hand — the only item found with you. Its unfamiliar symbol stirs something deep and cold in your chest, but no memory surfaces.",
            'assets/Intro.png',
            () => {
                State.introSeen = true;
                SaveSystem.save();
            }
        );
    }
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
    StatsUI.init();
    ResourcesUI.init();
    MasteryUI.init();
    InventoryUI.init();
    updateTaskList();
    setupSlots();
    setupAdventureSlots();
    setupInventorySlots();
    EncounterGenerator.init();
    setupDragAndDrop();
    setupTooltips();
    TabManager.init();
    document.getElementById('return-btn').addEventListener('click', () => {
        retreat('resolve');
    });
    document.getElementById('reset-btn').addEventListener('click', () => SaveSystem.reset());
    updateUI();
    // Game logic ticked separately from UI updates so resource generation
    // remains consistent regardless of UI refresh rate.
    setInterval(() => {
        ActionEngine.tick(LOGIC_TICK_MS / 1000);
        AdventureEngine.tick(LOGIC_TICK_MS / 1000);
    }, LOGIC_TICK_MS);
    setInterval(() => {
        updateTaskList();
        updateUI();
    }, UI_UPDATE_MS);
}

document.addEventListener('DOMContentLoaded', init);
