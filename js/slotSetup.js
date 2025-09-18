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
                effects.push(`+${formatNumber(val)} ${name}`);
            }
        }
        if (yields.resources) {
            for (const [res, val] of Object.entries(yields.resources)) {
                const name = Lang.resource(res) || capitalize(res);
                const sign = val >= 0 ? '+' : '';
                effects.push(`${sign}${formatNumber(val)} ${name}`);
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

function formatTagValue(value) {
    const numeric = Number(value);
    if (typeof formatNumber === 'function' && Number.isFinite(numeric)) {
        return formatNumber(numeric);
    }
    if (value === Infinity || numeric === Infinity) {
        return '∞';
    }
    if (value === -Infinity || numeric === -Infinity) {
        return '-∞';
    }
    return `${value}`;
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
        pushState(['slots'], {
            actionId: State.defaultActionId,
            progress: 0,
            blocked: false,
            text: '',
            queue: null
        });
    }
    if (State.slots.length > State.slotCount) {
        setState('slots', State.slots.slice(0, State.slotCount));
    }
    for (let i = 0; i < State.slotCount; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'slot-wrapper';
        const slot = new BaseSlot();
        const slotEl = slot.el;
        slotEl.dataset.slot = i;
        slotEl.dataset.tooltip = 'Drag an action here';
        wrapper.appendChild(slotEl);
        const qSlot = new BaseSlot();
        const qEl = qSlot.el;
        qEl.dataset.queue = i;
        qEl.classList.add('queue-slot');
        wrapper.appendChild(qEl);
        container.appendChild(wrapper);
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
    document.querySelectorAll('#slots .slot[data-slot]').forEach(slotEl => {
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
    const queueEl = document.querySelector(`#slots .slot[data-queue="${i}"]`);
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
    const tagsEl = slotEl.querySelector('.resource-tags');
    if (tagsEl) {
        // Build tags for all costs, consumptions and yields
        tagsEl.innerHTML = '';
        const tags = [];
        if (action.resourceCost) {
            for (const r in action.resourceCost) {
                const amt = action.resourceCost[r];
                const name = typeof Lang !== 'undefined' && Lang.resource ? (Lang.resource(r) || r) : r;
                tags.push({ sign: '-', amount: amt, name, type: 'resource', key: r });
            }
        }
        if (action.resourceConsumption) {
            for (const r in action.resourceConsumption) {
                const amt = action.resourceConsumption[r];
                const name = typeof Lang !== 'undefined' && Lang.resource ? (Lang.resource(r) || r) : r;
                tags.push({ sign: '-', amount: amt, name, type: 'resource', key: r });
            }
        }
        const yields = typeof computeActionYield === 'function' ? (computeActionYield(action) || {}) : (action.baseYield || {});
        if (yields.resources) {
            for (const r in yields.resources) {
                const val = yields.resources[r];
                const sign = val >= 0 ? '+' : '-';
                const name = typeof Lang !== 'undefined' && Lang.resource ? (Lang.resource(r) || r) : r;
                tags.push({ sign, amount: Math.abs(val), name, type: 'resource', key: r });
            }
        }
        if (yields.stats) {
            for (const s in yields.stats) {
                const val = yields.stats[s];
                const sign = val >= 0 ? '+' : '-';
                const name = typeof Lang !== 'undefined' && Lang.stat ? (Lang.stat(s) || s) : s;
                tags.push({ sign, amount: Math.abs(val), name, type: 'stat', key: s });
            }
        }
        for (const t of tags) {
            const tag = document.createElement('div');
            tag.className = 'resource-tag';
            const left = document.createElement('span');
            left.textContent = `${t.sign}${formatTagValue(t.amount)} ${t.name}`;
            let current = 0;
            if (t.type === 'resource') {
                const res = State.resources && State.resources[t.key];
                if (res) {
                    current = res.value;
                }
            } else {
                const stat = State.stats && State.stats[t.key];
                if (stat) {
                    current = stat.value;
                }
            }
            const valuesEl = document.createElement('span');
            valuesEl.className = 'resource-tag-values';
            const currentEl = document.createElement('span');
            currentEl.className = 'resource-tag-current';
            currentEl.textContent = formatTagValue(current);
            valuesEl.appendChild(currentEl);
            tag.appendChild(left);
            tag.appendChild(valuesEl);
            tagsEl.appendChild(tag);
        }
    }
    if (queueEl) {
        const queueData = slot.queue;
        const qp = queueEl.querySelector('progress');
        const qLabel = queueEl.querySelector('.label');
        const clearQueue = () => {
            queueEl.classList.add('hidden');
            if (qp) {
                qp.value = 0;
                qp.max = 1;
            }
            if (qLabel) qLabel.textContent = '';
            queueEl.style.backgroundImage = 'none';
            queueEl.style.backgroundSize = '';
            queueEl.dataset.tooltip = '';
            if (typeof RARITY_CLASSES !== 'undefined' && Array.isArray(RARITY_CLASSES)) {
                RARITY_CLASSES.forEach(r => queueEl.classList.remove(`rarity-${r}`));
            }
        };
        if (queueData && (queueData.id || queueData.encounter)) {
            queueEl.classList.remove('hidden');
            if (typeof RARITY_CLASSES !== 'undefined' && Array.isArray(RARITY_CLASSES)) {
                RARITY_CLASSES.forEach(r => queueEl.classList.remove(`rarity-${r}`));
            }
            if (qp) {
                qp.max = 1;
                qp.value = typeof queueData.progress === 'number' ? queueData.progress : 0;
            }
            let tooltip = '';
            if (queueData.id) {
                const qAction = actions[queueData.id];
                if (qLabel) qLabel.textContent = qAction ? qAction.name : '';
                if (qAction && qAction.image) {
                    queueEl.style.backgroundImage = `url(${qAction.image})`;
                    queueEl.style.backgroundSize = 'cover';
                } else {
                    queueEl.style.backgroundImage = 'none';
                    queueEl.style.backgroundSize = '';
                }
                tooltip = qAction ? buildActionTooltip(qAction) : '';
            } else if (queueData.encounter) {
                const enc = queueData.encounter;
                if (qLabel) qLabel.textContent = enc && enc.name ? enc.name : '';
                if (enc && enc.image) {
                    queueEl.style.backgroundImage = `url(${enc.image})`;
                    queueEl.style.backgroundSize = 'cover';
                } else {
                    queueEl.style.backgroundImage = 'none';
                    queueEl.style.backgroundSize = '';
                }
                if (enc && enc.rarity && typeof RARITY_CLASSES !== 'undefined' && Array.isArray(RARITY_CLASSES)) {
                    queueEl.classList.add(`rarity-${enc.rarity}`);
                }
                tooltip = enc && enc.description ? enc.description : '';
            }
            queueEl.dataset.tooltip = tooltip || '';
        } else {
            clearQueue();
        }
    }
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
                return `${name}: ${formatNumber(pct)}%`;
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
        const tagsEl = slotEl.querySelector('.resource-tags');
        if (tagsEl) {
            tagsEl.innerHTML = '';
            const cost = slot.encounter.getResourceCost ? slot.encounter.getResourceCost() :
                (slot.encounter.resourceConsumption || {});
            for (const r in cost) {
                const tag = document.createElement('div');
                tag.className = 'resource-tag';
                const left = document.createElement('span');
                const name = typeof Lang !== 'undefined' && Lang.resource ? (Lang.resource(r) || r) : r;
                left.textContent = `-${formatTagValue(cost[r])} ${name}`;
                let current = 0;
                const res = State.resources && State.resources[r];
                if (res) {
                    current = res.value;
                }
                const valuesEl = document.createElement('span');
                valuesEl.className = 'resource-tag-values';
                const currentEl = document.createElement('span');
                currentEl.className = 'resource-tag-current';
                currentEl.textContent = formatTagValue(current);
                valuesEl.appendChild(currentEl);
                tag.appendChild(left);
                tag.appendChild(valuesEl);
                tagsEl.appendChild(tag);
            }
        }
        slotEl.dataset.tooltip = parts.join('\n');
    } else {
        labelEl.textContent = slot.text || '';
        slotEl.style.backgroundImage = 'none';
        const tagsEl = slotEl.querySelector('.resource-tags');
        if (tagsEl) tagsEl.innerHTML = '';
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
