// Progress Realm prototype with leveled actions and resource consumption
const VERSION = 2;

const State = {
    version: VERSION,
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
    },
    slots: [
        { actionId: null, progress: 0, blocked: false },
        { actionId: null, progress: 0, blocked: false },
        { actionId: null, progress: 0, blocked: false },
    ],
    time: 1,
};

let actions = {};

const TabManager = {
    tabs: [
        { id: 'routines', name: 'Routines', hidden: false, locked: false },
        { id: 'automation', name: 'Automation', hidden: false, locked: false },
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
        localStorage.setItem('progressRealmSave', JSON.stringify(State));
    },
    load() {
        const raw = localStorage.getItem('progressRealmSave');
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (data.version !== VERSION) return;
            Object.assign(State, data);
        } catch (e) {
            console.error('Load failed', e);
        }
    }
};

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
        action.level += 1;
        action.expToNext = Math.floor(action.expToNext * 1.1 + 5);
    }
}

const ActionEngine = {
    start(slotIndex, actionId) {
        const slot = State.slots[slotIndex];
        slot.actionId = actionId;
        slot.progress = 0;
        slot.blocked = false;
        updateSlotUI(slotIndex);
    },
    tick() {
        State.slots.forEach((slot, i) => {
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
        });
        updateUI();
        SaveSystem.save();
    }
};

function createActionElement(action) {
    if (action.hidden) return null;
    const li = document.createElement('li');
    li.textContent = action.name;
    li.dataset.taskId = action.id;
    li.dataset.tooltip = action.name;
    if (action.locked) {
        li.classList.add('locked');
    } else {
        li.setAttribute('draggable', 'true');
        li.addEventListener('dragstart', e => {
            li.classList.add('dragging');
            e.dataTransfer.setData('text/plain', action.id);
        });
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
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

function updateSlotUI(i) {
    const slot = State.slots[i];
    const slotEl = document.querySelector(`.slot[data-slot="${i}"]`);
    if (!slotEl) return;
    const progressEl = slotEl.querySelector('progress');
    const labelEl = slotEl.querySelector('.label');
    slotEl.classList.toggle('blocked', slot.blocked);
    if (!slot.actionId) {
        progressEl.value = 0;
        progressEl.max = 1;
        labelEl.textContent = '';
        return;
    }
    const action = actions[slot.actionId];
    progressEl.max = 1;
    progressEl.value = slot.progress;
    labelEl.textContent = `${action.name} Lv.${action.level}`;
}

function updateUI() {
    document.getElementById('stat-strength').textContent = State.stats.strength.toFixed(1);
    document.getElementById('stat-intelligence').textContent = State.stats.intelligence.toFixed(1);
    document.getElementById('stat-creativity').textContent = State.stats.creativity.toFixed(1);

    document.getElementById('res-energy').textContent = State.resources.energy.toFixed(1);
    document.getElementById('res-energy-cap').textContent = State.resources.maxEnergy;
    document.getElementById('res-focus').textContent = State.resources.focus.toFixed(1);
    document.getElementById('res-focus-cap').textContent = State.resources.maxFocus;
}

async function init() {
    SaveSystem.load();
    const intro = document.getElementById('intro-modal');
    document.getElementById('intro-close').addEventListener('click', () => {
        intro.classList.add('hidden');
    });
    try {
        const res = await fetch('data/actions.json');
        const json = await res.json();
        json.forEach(a => {
            a.hidden = a.hidden || false;
            a.locked = a.locked || false;
            actions[a.id] = a;
        });
    } catch (e) {
        console.error('Failed to load actions', e);
    }
    const list = document.getElementById('task-list');
    Object.values(actions).forEach(a => {
        const el = createActionElement(a);
        if (el) list.appendChild(el);
    });
    setupDragAndDrop();
    setupTooltips();
    TabManager.init();
    updateUI();
    setInterval(() => ActionEngine.tick(), 1000);
}

document.addEventListener('DOMContentLoaded', init);
