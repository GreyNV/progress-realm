// Modular Progress Realm prototype with drag-and-drop tasks
const VERSION = 1;

const State = {
    version: VERSION,
    stats: {
        strength: 1,
        intelligence: 1,
        charisma: 1,
    },
    resources: {
        energy: 5,
        maxEnergy: 10,
        gold: 0,
        maxGold: 100,
    },
    slots: [
        { taskId: null, progress: 0 },
        { taskId: null, progress: 0 },
        { taskId: null, progress: 0 },
    ],
    time: 1,
    ageYears: 16,
    ageDays: 0,
    maxAge: 75,
};

let tasks = {};

const ResourceManager = {
    spend(cost) {
        if (cost.energy && State.resources.energy < cost.energy) return false;
        if (cost.gold && State.resources.gold < cost.gold) return false;
        if (cost.energy) State.resources.energy -= cost.energy;
        if (cost.gold) State.resources.gold -= cost.gold;
        this.cap();
        return true;
    },
    reward(rew) {
        if (rew.energy) State.resources.energy += rew.energy;
        if (rew.gold) State.resources.gold += rew.gold;
        if (rew.strength) State.stats.strength += rew.strength;
        if (rew.intelligence) State.stats.intelligence += rew.intelligence;
        if (rew.charisma) State.stats.charisma += rew.charisma;
        this.cap();
    },
    cap() {
        State.resources.energy = Math.min(State.resources.energy, State.resources.maxEnergy);
        State.resources.gold = Math.min(State.resources.gold, State.resources.maxGold);
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

const TaskEngine = {
    start(slotIndex, taskId) {
        const slot = State.slots[slotIndex];
        slot.taskId = taskId;
        slot.progress = 0;
        updateSlotUI(slotIndex);
    },
    tick() {
        State.ageDays += State.time;
        while (State.ageDays >= 365) {
            State.ageDays -= 365;
            State.ageYears += 1;
        }
        if (State.ageYears >= State.maxAge) {
            State.ageYears = 16;
            State.ageDays = 0;
        }
        State.slots.forEach((slot, i) => {
            if (!slot.taskId) return;
            const task = tasks[slot.taskId];
            slot.progress += State.time;
            if (slot.progress >= task.duration) {
                if (ResourceManager.spend(task.cost)) {
                    ResourceManager.reward(task.reward);
                    slot.progress -= task.duration;
                    flashSlot(i);
                } else {
                    // not enough resources, switch to rest
                    this.start(i, 'rest');
                }
            }
            updateSlotUI(i);
        });
        updateUI();
        SaveSystem.save();
    }
};

function createTaskElement(task) {
    const li = document.createElement('li');
    li.textContent = task.name;
    li.setAttribute('draggable', 'true');
    li.dataset.taskId = task.id;
    li.dataset.tooltip = task.description;
    li.addEventListener('dragstart', e => {
        li.classList.add('dragging');
        e.dataTransfer.setData('text/plain', task.id);
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    return li;
}

function setupDragAndDrop() {
    document.querySelectorAll('.slot').forEach(slotEl => {
        slotEl.addEventListener('dragover', e => e.preventDefault());
        slotEl.addEventListener('drop', e => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const index = parseInt(slotEl.dataset.slot, 10);
            TaskEngine.start(index, taskId);
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

function flashSlot(i) {
    const slotEl = document.querySelector(`.slot[data-slot="${i}"]`);
    if (slotEl) {
        slotEl.classList.add('complete');
        setTimeout(() => slotEl.classList.remove('complete'), 1000);
    }
}

function updateSlotUI(i) {
    const slot = State.slots[i];
    const slotEl = document.querySelector(`.slot[data-slot="${i}"]`);
    if (!slotEl) return;
    const progressEl = slotEl.querySelector('progress');
    const labelEl = slotEl.querySelector('.label');
    if (!slot.taskId) {
        progressEl.value = 0;
        labelEl.textContent = '';
        return;
    }
    const task = tasks[slot.taskId];
    progressEl.max = task.duration;
    progressEl.value = slot.progress;
    labelEl.textContent = task.name;
}

function updateUI() {
    document.getElementById('stat-strength').textContent = State.stats.strength.toFixed(1);
    document.getElementById('stat-intelligence').textContent = State.stats.intelligence.toFixed(1);
    document.getElementById('stat-charisma').textContent = State.stats.charisma.toFixed(1);

    document.getElementById('res-energy').textContent = Math.floor(State.resources.energy);
    document.getElementById('res-energy-cap').textContent = State.resources.maxEnergy;
    document.getElementById('res-gold').textContent = Math.floor(State.resources.gold);
    document.getElementById('res-gold-cap').textContent = State.resources.maxGold;

    document.getElementById('age-years').textContent = State.ageYears;
    document.getElementById('age-days').textContent = State.ageDays;
    document.getElementById('max-age').textContent = State.maxAge;

    // milestone indicator simple example
    if (State.stats.strength >= 5) {
        document.getElementById('stat-strength').style.color = 'green';
    }
}

async function init() {
    SaveSystem.load();
    try {
        const res = await fetch('data/tasks.json');
        const json = await res.json();
        json.forEach(t => tasks[t.id] = t);
    } catch (e) {
        console.error('Failed to load tasks', e);
    }
    const taskList = document.getElementById('task-list');
    Object.values(tasks).forEach(task => {
        if (task.id !== 'rest') taskList.appendChild(createTaskElement(task));
    });
    setupDragAndDrop();
    setupTooltips();
    updateUI();
    setInterval(() => TaskEngine.tick(), 1000);
}

document.addEventListener('DOMContentLoaded', init);
