// Slot and list UI helpers separated from main.js

function buildActionTooltip(action) {
    const parts = [`<strong>${action.name}</strong> - ${capitalize(getActionTier(action.level))}`];
    if (action.resourceCost && Object.keys(action.resourceCost).length) {
        const cost = Utils.formatCost(action.resourceCost);
        parts.push(`<strong>${Lang.ui('Cost') || 'Cost'}:</strong> ${cost}`);
    }
    const effects = [];
    if (action.baseYield) {
        const yields = computeActionYield(action);
        if (yields.stats) {
            for (const [stat, val] of Object.entries(yields.stats)) {
                const name = Lang.stat(stat) || capitalize(stat);
                effects.push(`+${val.toFixed(2)} ${name}`);
            }
        }
        if (yields.resources) {
            for (const [res, val] of Object.entries(yields.resources)) {
                const name = Lang.resource(res) || capitalize(res);
                const sign = val >= 0 ? '+' : '';
                effects.push(`${sign}${val.toFixed(2)} ${name}`);
            }
        }
    }
    if (effects.length) {
        parts.push(`<strong>${Lang.ui('Effects') || 'Effects'}:</strong> ${effects.join(', ')}`);
    }
    return parts.join('<br>');
}

function actionAffordable(action) {
    if (!action.resourceCost) return true;
    for (const r in action.resourceCost) {
        const res = State.resources[r];
        if (!res || res.value < action.resourceCost[r]) return false;
    }
    return true;
}

function actionLabel(action) {
    return `${action.name} Lv.${action.level}`;
}

function assignActionToSlot(actionId) {
    let index = State.slots.findIndex(s => !s.actionId);
    if (index === -1) {
        index = State.slots.findIndex(s => s.actionId === State.defaultActionId);
    }
    if (index === -1) index = 0;
    ActionEngine.start(index, actionId);
}

function createActionElement(action) {
    if (action.hidden) return null;
    const li = document.createElement('li');
    li.classList.add('expandable');
    const fill = document.createElement('div');
    fill.className = 'level-fill';
    const pct = Math.floor((action.exp / action.expToNext) * 100);
    fill.style.width = `${pct}%`;
    li.appendChild(fill);
    const label = document.createElement('span');
    label.className = 'action-label';
    label.textContent = actionLabel(action);
    li.appendChild(label);
    const arrow = document.createElement('span');
    arrow.className = 'expand-arrow';
    arrow.textContent = '▶';
    li.appendChild(arrow);
    const detail = document.createElement('div');
    detail.className = 'expand-details';
    detail.innerHTML = buildActionTooltip(action);
    li.appendChild(detail);
    li.dataset.taskId = action.id;
    const tierClass = `tier-${getActionTier(action.level)}`;
    li.classList.add(tierClass);
    if (!actionAffordable(action)) {
        li.classList.add('unaffordable');
    }
    if (action.locked) {
        li.classList.add('locked');
    } else {
        li.setAttribute('draggable', 'true');
        li.addEventListener('dragstart', e => {
            li.classList.add('dragging');
            e.dataTransfer.setData('text/plain', action.id);
        });
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
        arrow.addEventListener('click', e => {
            e.stopPropagation();
            const expanded = li.classList.toggle('expanded');
            arrow.textContent = expanded ? '▼' : '▶';
        });
        li.addEventListener('click', () => assignActionToSlot(action.id));
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
    });
}


function updateTaskList() {
    const list = document.getElementById('task-list');
    Object.values(actions).forEach(action => {
        const li = list.querySelector(`li[data-task-id="${action.id}"]`);
        if (action.hidden) {
            if (li) li.remove();
            return;
        }
        if (!li) {
            const el = createActionElement(action);
            if (el) list.appendChild(el);
            return;
        }
        const label = li.querySelector('.action-label');
        const fill = li.querySelector('.level-fill');
        if (label) label.textContent = actionLabel(action);
        if (fill) {
            const pct = Math.floor((action.exp / action.expToNext) * 100);
            fill.style.width = `${pct}%`;
        }
        const detail = li.querySelector('.expand-details');
        if (detail) detail.innerHTML = buildActionTooltip(action);
        li.classList.remove('tier-normal', 'tier-bronze', 'tier-silver', 'tier-gold');
        li.classList.add(`tier-${getActionTier(action.level)}`);
        li.classList.toggle('unaffordable', !actionAffordable(action));
    });
}

function updateSlotUI(i) {
    const slot = State.slots[i];
    const slotEl = document.querySelector(`#slots .slot[data-slot="${i}"]`);
    if (!slotEl) return;
    const progressEl = slotEl.querySelector('progress');
    const labelEl = slotEl.querySelector('.label');
    if (typeof AdventureEngine !== 'undefined' && AdventureEngine.active &&
        AdventureEngine.activeIndex === i) {
        const aSlot = State.adventureSlots[i];
        const enc = aSlot.encounter;
        RARITY_CLASSES.forEach(r => slotEl.classList.remove(`rarity-${r}`));
        progressEl.max = 1;
        progressEl.value = aSlot.progress || 0;
        if (enc) {
            labelEl.textContent = enc.name;
            if (enc.image) {
                slotEl.style.backgroundImage = `url(${enc.image})`;
                slotEl.style.backgroundSize = 'cover';
            } else {
                slotEl.style.backgroundImage = 'none';
            }
            slotEl.classList.add(`rarity-${enc.rarity}`);
            slotEl.dataset.tooltip = enc.description || '';
        } else {
            labelEl.textContent = '';
            slotEl.style.backgroundImage = 'none';
            slotEl.dataset.tooltip = '';
        }
        return;
    }
    slotEl.classList.toggle('blocked', slot.blocked);
    if (!slot.actionId) {
        slot.actionId = State.defaultActionId;
    }
    const action = actions[slot.actionId];
    progressEl.max = 1;
    progressEl.value = action.progress || 0;
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
    const actionEl = document.querySelector(`#slots .slot[data-slot="${i}"]`);
    if (actionEl) updateSlotUI(i);
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
        updateAdventureSlotUI,
        assignActionToSlot
    };
}
