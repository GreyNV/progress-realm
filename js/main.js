// Progress Realm prototype with leveled actions and resource consumption
const VERSION = 2;

const State = {
    version: VERSION,
    age: { years: 16, days: 0, max: 75 },
    introSeen: false,
    stats: {
        strength: 0,
        intelligence: 0,
        creativity: 0,
    },
    resources: {
        energy: 10,
        maxEnergy: 10,
        focus: 10,
        maxFocus: 10,
        health: 10,
        maxHealth: 10,
        gold: 0,
        maxGold: 100,
    },
    slotCount: 6,
    slots: Array.from({ length: 6 }, () => ({ actionId: null, progress: 0, blocked: false, text: '' })),
    home: {
        items: ['oldBooks', 'bed', 'backyard'],
        maxSlots: 3,
    },
    unlockedCategories: { home: true, tasks: false },
    recoveryStorySeen: false,
    time: 1,
    masteryPoints: 0,
};

let actions = {};
let selectedActionId = null;

let prevStats = { ...State.stats };
let prevResources = {
    energy: State.resources.energy,
    focus: State.resources.focus,
    health: State.resources.health,
    gold: State.resources.gold,
};
let statDeltas = { strength: 0, intelligence: 0, creativity: 0 };
let resourceDeltas = { energy: 0, focus: 0, health: 0, gold: 0 };

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const StatsUI = {
    list: ['strength', 'intelligence', 'creativity'],
    init() {
        const listEl = document.getElementById('stats-list');
        this.list.forEach(key => {
            const li = document.createElement('li');
            li.innerHTML = `${capitalize(key)}: <span id="stat-${key}">0</span> (<span id="stat-${key}-delta" class="delta">0</span>/s)`;
            listEl.appendChild(li);
        });
    },
    update() {
        this.list.forEach(key => {
            document.getElementById(`stat-${key}`).textContent = State.stats[key].toFixed(1);
            document.getElementById(`stat-${key}-delta`).textContent = formatDelta(statDeltas[key]);
        });
    }
};

const ResourcesUI = {
    list: ['energy', 'focus', 'health'],
    init() {
        const listEl = document.getElementById('resources-list');
        this.list.forEach(key => {
            const li = document.createElement('li');
            li.innerHTML = `${capitalize(key)}: <span id="res-${key}">0</span>/<span id="res-${key}-cap">0</span> (<span id="res-${key}-delta" class="delta">0</span>/s)`;
            listEl.appendChild(li);
        });
    },
    update() {
        this.list.forEach(key => {
            document.getElementById(`res-${key}`).textContent = State.resources[key].toFixed(1);
            document.getElementById(`res-${key}-cap`).textContent = State.resources['max' + capitalize(key)];
            document.getElementById(`res-${key}-delta`).textContent = formatDelta(resourceDeltas[key]);
        });
    }
};

const EconomyUI = {
    list: ['gold'],
    init() {
        const listEl = document.getElementById('economy-list');
        this.list.forEach(key => {
            const li = document.createElement('li');
            li.innerHTML = `${capitalize(key)}: <span id="eco-${key}">0</span>/<span id="eco-${key}-cap">0</span>`;
            listEl.appendChild(li);
        });
    },
    update() {
        this.list.forEach(key => {
            document.getElementById(`eco-${key}`).textContent = State.resources[key].toFixed(1);
            document.getElementById(`eco-${key}-cap`).textContent = State.resources['max' + capitalize(key)];
        });
    }
};

const HomeUI = {
    getItemName(id) {
        const names = { oldBooks: 'Old Books', bed: 'Bed', backyard: 'Backyard' };
        return names[id] || id;
    },
    init() {
        const container = document.getElementById('home-slots');
        State.home.items.forEach((id, i) => {
            const slotEl = container.querySelector(`[data-item-slot="${i}"]`);
            if (slotEl) slotEl.textContent = this.getItemName(id);
        });
    }
};

const MasteryUI = {
    init() {
        const el = document.getElementById('mastery-points');
        if (el) el.textContent = State.masteryPoints;
    },
    update() {
        const el = document.getElementById('mastery-points');
        if (el) el.textContent = State.masteryPoints;
    }
};

const Log = {
    messages: [],
    init() {
        this.el = document.getElementById('log');
    },
    add(msg) {
        this.messages.push(msg);
        if (this.el) {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.textContent = msg;
            this.el.appendChild(div);
            this.el.scrollTop = this.el.scrollHeight;
        }
    }
};

const Story = {
    show(text, image, onClose) {
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
        function close() {
            modal.classList.add('hidden');
            document.getElementById('story-close').removeEventListener('click', close);
            Log.add(text);
            if (onClose) onClose();
        }
        document.getElementById('story-close').addEventListener('click', close);
    }
};

const SoftCapSystem = {
    statCaps: { strength: 50, intelligence: 50, creativity: 50 },
    resourceCaps: { energy: 20, focus: 20, health: 10, gold: 100 },
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
            if (State.resources[r] > cap) {
                State.resources[r] = cap + (State.resources[r] - cap) * this.falloff;
            }
        }
    }
};

const TabManager = {
    tabs: [
        { id: 'routines', name: 'Routines', hidden: false, locked: false },
        { id: 'home', name: 'Home', hidden: false, locked: false },
    ],
    init() {
        const header = document.getElementById('tab-headers');
        this.tabs.forEach(tab => {
            if (tab.hidden) return;
            const btn = document.createElement('button');
            btn.textContent = tab.locked ? `${tab.name} (Locked)` : tab.name;
            btn.dataset.tab = tab.id;
            if (tab.locked) btn.disabled = true;
            header.appendChild(btn);
        });
        header.addEventListener('click', e => {
            if (!e.target.dataset.tab) return;
            this.showTab(e.target.dataset.tab);
        });
        if (this.tabs.length) this.showTab(this.tabs[0].id);
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
                if (Array.isArray(State.slots)) {
                    while (State.slots.length < State.slotCount) {
                        State.slots.push({ actionId: null, progress: 0, blocked: false, text: '' });
                    }
                    State.slots.forEach(s => {
                        if (s.text === undefined) s.text = '';
                    });
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
    tick() {
        State.age.days += State.time;
        if (State.age.days >= this.daysPerYear) {
            State.age.years += Math.floor(State.age.days / this.daysPerYear);
            State.age.days = State.age.days % this.daysPerYear;
        }
    }
};

function updateDeltas() {
    for (const s in State.stats) {
        statDeltas[s] = State.stats[s] - (prevStats[s] || 0);
        prevStats[s] = State.stats[s];
    }
    for (const r of ['energy', 'focus', 'health', 'gold']) {
        resourceDeltas[r] = State.resources[r] - (prevResources[r] || 0);
        prevResources[r] = State.resources[r];
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
    if (!State.recoveryStorySeen && (State.age.years > 16 || (State.age.years === 16 && State.age.days > 30))) {
        Story.show(
            "Our hero finally recovered and discovers that the healer disappeared. He overviewed the place and has to decide what to do next. It was only forest around him and no trace of any road or people.",
            'assets/Intro.png',
            () => {
                State.recoveryStorySeen = true;
                State.unlockedCategories.tasks = true;
                SaveSystem.save();
            }
        );
    }
}

function isActionUnlocked(action) {
    if (!State.unlockedCategories[action.category]) return false;
    if (action.requiresItem && !State.home.items.includes(action.requiresItem)) return false;
    return !action.locked;
}

function scalingMultiplier(action) {
    const f = action.scaling;
    let lvl = action.level;
    if (lvl > f.softcapLevel) {
        lvl = f.softcapLevel + (lvl - f.softcapLevel) * f.falloff;
    }
    return f.base + f.multiplier * lvl;
}

function consume(cost) {
    for (const k in cost) {
        if (!State.resources[k] || State.resources[k] < cost[k]) return false;
    }
    for (const k in cost) {
        State.resources[k] -= cost[k];
    }
    return true;
}

function applyYield(base, mult) {
    if (base.stats) {
        for (const s in base.stats) {
            State.stats[s] = (State.stats[s] || 0) + base.stats[s] * mult * State.time;
        }
    }
    if (base.resources) {
        for (const r in base.resources) {
            const capKey = 'max' + r.charAt(0).toUpperCase() + r.slice(1);
            State.resources[r] = (State.resources[r] || 0) + base.resources[r] * mult * State.time;
            if (State.resources[capKey] !== undefined) {
                State.resources[r] = Math.min(State.resources[r], State.resources[capKey]);
            }
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
        if (slotIndex >= State.slotCount) return;
        const slot = State.slots[slotIndex];
        slot.actionId = actionId;
        slot.progress = 0;
        slot.blocked = false;
        slot.text = actions[actionId] ? actions[actionId].name : '';
        updateSlotUI(slotIndex);
    },
    tick() {
        AgeSystem.tick();
        for (let i = 0; i < State.slotCount; i++) {
            const slot = State.slots[i];
            if (!slot.actionId) return;
            const action = actions[slot.actionId];
            const canRun = consume(action.resourceConsumption);
            slot.blocked = !canRun;
            if (!canRun) {
                slot.progress = 0;
            } else {
                const mult = scalingMultiplier(action);
                applyYield(action.baseYield, mult);
                gainExp(action, action.baseYield.exp * mult * State.time);
                slot.progress = action.exp / action.expToNext;
            }
            updateSlotUI(i);
        }
        checkStoryEvents();
        SoftCapSystem.apply();
        updateDeltas();
        updateTaskList();
        updateUI();
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
    if (!isActionUnlocked(action)) {
        li.classList.add('locked');
    } else {
        li.setAttribute('draggable', 'true');
        li.addEventListener('dragstart', e => {
            li.classList.add('dragging');
            e.dataTransfer.setData('text/plain', action.id);
        });
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
        li.addEventListener('click', () => {
            selectedActionId = action.id;
            document.querySelectorAll('#task-list li').forEach(el => el.classList.remove('selected'));
            li.classList.add('selected');
        });
    }
    return li;
}

function setupDragAndDrop() {
    document.querySelectorAll('.slot').forEach(slotEl => {
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
        li.classList.toggle('locked', !isActionUnlocked(action));
    });
}

function updateSlotUI(i) {
    const slot = State.slots[i];
    const slotEl = document.querySelector(`.slot[data-slot="${i}"]`);
    if (!slotEl) return;
    slotEl.classList.toggle('hidden', i >= State.slotCount);
    const progressEl = slotEl.querySelector('progress');
    const labelEl = slotEl.querySelector('.label');
    slotEl.classList.toggle('blocked', slot.blocked);
    if (!slot.actionId) {
        progressEl.value = 0;
        progressEl.max = 1;
        labelEl.textContent = slot.text || '';
        return;
    }
    const action = actions[slot.actionId];
    progressEl.max = 1;
    progressEl.value = slot.progress;
    labelEl.textContent = slot.text || `${action.name} Lv.${action.level}`;
}

function updateUI() {
    StatsUI.update();
    ResourcesUI.update();
    EconomyUI.update();
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
    StatsUI.init();
    ResourcesUI.init();
    EconomyUI.init();
    MasteryUI.init();
    updateTaskList();
    setupDragAndDrop();
    setupTooltips();
    TabManager.init();
    HomeUI.init();
    State.slots.forEach((_, i) => updateSlotUI(i));
    document.getElementById('reset-btn').addEventListener('click', () => SaveSystem.reset());
    updateUI();
    setInterval(() => ActionEngine.tick(), 1000);
}

document.addEventListener('DOMContentLoaded', init);
