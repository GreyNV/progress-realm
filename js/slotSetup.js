// Slot and list UI helpers separated from main.js

function buildActionTooltip(action) {
    const parts = [`<strong>${action.name}</strong> - ${capitalize(getActionTier(action.level))}`];
    if (action.resourceConsumption && Object.keys(action.resourceConsumption).length) {
        const cost = Utils.formatCost(action.resourceConsumption);
        parts.push(`<strong>${Lang.ui('Cost') || 'Cost'}:</strong> ${cost}`);
    }
    const effects = [];
    if (action.baseYield) {
        if (action.baseYield.stats) {
            for (const [stat, val] of Object.entries(action.baseYield.stats)) {
                const name = Lang.stat(stat) || capitalize(stat);
                effects.push(`+${val} ${name}`);
            }
        }
        if (action.baseYield.resources) {
            for (const [res, val] of Object.entries(action.baseYield.resources)) {
                const name = Lang.resource(res) || capitalize(res);
                const sign = val >= 0 ? '+' : '';
                effects.push(`${sign}${val} ${name}`);
            }
        }
    }
    if (effects.length) {
        parts.push(`<strong>${Lang.ui('Effects') || 'Effects'}:</strong> ${effects.join(', ')}`);
    }
    return parts.join('<br>');
}

function createActionElement(action) {
    if (action.hidden) return null;
    const li = document.createElement('li');
    li.textContent = `${action.name} Lv.${action.level}`;
    li.dataset.taskId = action.id;
    li.dataset.tooltip = buildActionTooltip(action);
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
    if (!Array.isArray(State.slots)) setState('slots', []);
    if (State.slotCount === undefined) setState('slotCount', State.slots.length);
    while (State.slots.length < State.slotCount) {
        pushState(['slots'], { actionId: State.defaultActionId, progress: 0, blocked: false, text: '' });
    }
    if (State.slots.length > State.slotCount) {
        setState('slots', State.slots.slice(0, State.slotCount));
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
    if (!Array.isArray(State.adventureSlots)) setState('adventureSlots', []);
    if (State.adventureSlotCount === undefined) setState('adventureSlotCount', State.adventureSlots.length);
    while (State.adventureSlots.length < State.adventureSlotCount) {
        pushState(['adventureSlots'], { text: '', progress: 0, duration: 1, encounter: null, active: false });
    }
    if (State.adventureSlots.length > State.adventureSlotCount) {
        setState('adventureSlots', State.adventureSlots.slice(0, State.adventureSlotCount));
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


function updateTaskList() {
    const list = document.getElementById('task-list');
    Object.values(actions).forEach(action => {
        const li = list.querySelector(`li[data-task-id="${action.id}"]`);
        if (action.hidden) {
            if (li) li.remove();
            if (selectedActionId === action.id) selectedActionId = null;
            return;
        }
        if (!li) {
            const el = createActionElement(action);
            if (el) list.appendChild(el);
            return;
        }
        li.textContent = `${action.name} Lv.${action.level}`;
        li.dataset.tooltip = buildActionTooltip(action);
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
        slot.actionId = State.defaultActionId;
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
    slotEl.dataset.tooltip = buildActionTooltip(action);
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

if (typeof module !== 'undefined') {
    module.exports = {
        buildActionTooltip,
        createActionElement,
        setupSlots,
        setupAdventureSlots,
        setupInventorySlots,
        setupDragAndDrop,
        updateTaskList,
        updateSlotUI,
        updateAdventureSlotUI
    };
}
