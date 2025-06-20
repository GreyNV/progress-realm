import { state, saveState, loadState } from './state.js';
import { routines, hobbies, routinesById, upgradesById } from './tasks.js';
import { startRoutine, runHobby, restart } from './engine.js';

let currentTooltipTask = null;
export function showTaskInfo(task) {
    const el = document.getElementById('routine-description');
    if (!el) return;
    if (!task) return;
    if (currentTooltipTask !== task) {
        currentTooltipTask = task;
        el.textContent = `${task.name} (Lv ${task.level}) - ${task.description} | Cost: ${task.costDesc} | Result: ${task.resultDesc} (x${task.yieldMultiplier().toFixed(2)}) | XP ${task.xp}/${task.xpNeeded()}`;
    }
}

export function updateUI() {
    document.getElementById('stat-strength').textContent = state.stats.strength;
    document.getElementById('stat-intelligence').textContent = state.stats.intelligence;
    document.getElementById('stat-wisdom').textContent = state.stats.wisdom;
    document.getElementById('stat-charisma').textContent = state.stats.charisma;
    document.getElementById('stat-endurance').textContent = state.stats.endurance;

    document.getElementById('prestige-strength').textContent = state.prestige.strength;
    document.getElementById('prestige-intelligence').textContent = state.prestige.intelligence;
    document.getElementById('prestige-wisdom').textContent = state.prestige.wisdom;
    document.getElementById('prestige-charisma').textContent = state.prestige.charisma;
    document.getElementById('prestige-endurance').textContent = state.prestige.endurance;

    document.getElementById('age-years').textContent = Math.floor(state.ageYears);
    document.getElementById('age-days').textContent = Math.floor(state.ageDays);
    document.getElementById('max-age').textContent = state.maxAge;

    const res = state.resources;
    document.getElementById('res-energy').textContent = res.energy;
    document.getElementById('res-energy-cap').textContent = res.maxEnergy;
    document.getElementById('res-gold').textContent = res.gold;
    document.getElementById('res-gold-cap').textContent = res.maxGold;
    document.getElementById('res-herbs').textContent = res.herbs;
    document.getElementById('res-herbs-cap').textContent = res.maxHerbs;
    document.getElementById('res-scrolls').textContent = res.scrolls;
    document.getElementById('res-scrolls-cap').textContent = res.maxScrolls;
    document.getElementById('res-cores').textContent = res.manaCores;
    document.getElementById('res-cores-cap').textContent = res.maxManaCores;
    document.getElementById('active-charms').textContent = state.buffs.length;

    const routineName = state.activeRoutine ? state.activeRoutine.name : 'None';
    const routineCategory = state.activeRoutine ? state.activeRoutine.category : 'none';
    document.getElementById('current-routine').textContent = routineName;
    document.getElementById('current-category').textContent = routineCategory;

    const speedEl = document.getElementById('speed-value');
    if (speedEl) speedEl.textContent = state.time + 'x';

    const hobbyList = document.getElementById('active-hobbies');
    if (hobbyList) {
        hobbyList.innerHTML = '';
        Object.values(hobbies).forEach(h => {
            if (h.running) {
                const li = document.createElement('li');
                li.textContent = `${h.name} (${h.category})`;
                hobbyList.appendChild(li);
            }
        });
    }

    Object.values(routines).forEach(r => {
        if (!r.elementId) return;
        const container = document.getElementById(r.elementId);
        const prog = document.getElementById(r.elementId + '-progress');
        if (container) {
            container.style.display = r.showCondition() ? 'block' : 'none';
            const label = container.querySelector('.label');
            if (label) label.textContent = `${r.name} (Lv ${r.level})`;
            container.title = `Cost: ${r.costDesc} | Result: ${r.resultDesc} (x${r.yieldMultiplier().toFixed(2)})`;
        }
        if (prog) {
            prog.max = r.xpNeeded();
            prog.value = r.xp;
        }
    });

    Object.values(hobbies).forEach(h => {
        const container = document.getElementById(h.elementId);
        const prog = document.getElementById(h.elementId + '-progress');
        if (container) {
            container.style.display = h.showCondition() ? 'block' : 'none';
            const label = container.querySelector('.label');
            if (label) label.textContent = `${h.name} (Lv ${h.level})`;
            container.title = `Cost: ${h.costDesc} | Result: ${h.resultDesc} (x${h.yieldMultiplier().toFixed(2)})`;
        }
        if (prog) {
            prog.max = h.xpNeeded();
            prog.value = h.xp;
        }
    });

    updateUpgradesUI();
}

export function updateUpgradesUI() {
    const availList = document.getElementById('available-upgrades');
    const activeList = document.getElementById('active-upgrades');
    if (availList) {
        availList.innerHTML = '';
        state.upgrades.available.forEach(id => {
            const up = upgradesById[id];
            if (!up) return;
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.textContent = 'Activate';
            btn.addEventListener('click', () => activateUpgrade(id));
            li.textContent = `${up.name} - ${up.description} `;
            li.appendChild(btn);
            availList.appendChild(li);
        });
    }
    if (activeList) {
        activeList.innerHTML = '';
        state.upgrades.active.forEach(id => {
            const up = upgradesById[id];
            if (!up) return;
            const li = document.createElement('li');
            li.textContent = `${up.name} (Tier ${up.tier})`;
            activeList.appendChild(li);
        });
    }
}

export function activateUpgrade(id) {
    const up = upgradesById[id];
    if (!up) return;
    const conflict = state.upgrades.active.some(aid => {
        const act = upgradesById[aid];
        return act && act.category === up.category && act.tier === up.tier;
    });
    if (conflict) return;
    state.upgrades.active.push(id);
    state.upgrades.available = state.upgrades.available.filter(x => x !== id);
    if (typeof up.apply === 'function') up.apply();
    updateUpgradesUI();
}

function initTabs() {
    const buttons = document.querySelectorAll('.tabs button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(el => {
                el.classList.toggle('active', el.id === tabId);
            });
        });
    });
    if (buttons[0]) buttons[0].click();
}

export function initUI() {
    updateUI();

    document.getElementById('toggle-stats')?.addEventListener('click', () => {
        document.getElementById('left').classList.toggle('collapsed');
    });

    // apply category colors
    Object.values(routines).forEach(r => {
        if (!r.elementId) return;
        document.getElementById(r.elementId + '-progress')?.classList.add(r.category);
    });
    Object.values(hobbies).forEach(h => {
        document.getElementById(h.elementId + '-progress')?.classList.add(h.category);
    });


    if (document.getElementById('push-ups')) {
        const el = document.getElementById('push-ups');
        el.addEventListener('click', () => startRoutine(routines.pushUps));
        el.addEventListener('mouseenter', () => showTaskInfo(routines.pushUps));
    }
    if (document.getElementById('read-scrolls')) {
        const el = document.getElementById('read-scrolls');
        el.addEventListener('click', () => startRoutine(routines.readScrolls));
        el.addEventListener('mouseenter', () => showTaskInfo(routines.readScrolls));
    }
    if (document.getElementById('mind-focus')) {
        const el = document.getElementById('mind-focus');
        el.addEventListener('click', () => startRoutine(routines.mindFocus));
        el.addEventListener('mouseenter', () => showTaskInfo(routines.mindFocus));
    }
    if (document.getElementById('arcane-experiment')) {
        const el = document.getElementById('arcane-experiment');
        el.addEventListener('click', () => startRoutine(routines.arcaneExperiment));
        el.addEventListener('mouseenter', () => showTaskInfo(routines.arcaneExperiment));
    }

    if (document.getElementById('gather-herbs')) {
        const el = document.getElementById('gather-herbs');
        el.addEventListener('click', () => runHobby(hobbies.gatherHerbs));
        el.addEventListener('mouseenter', () => showTaskInfo(hobbies.gatherHerbs));
    }
    if (document.getElementById('sell-trinkets')) {
        const el = document.getElementById('sell-trinkets');
        el.addEventListener('click', () => runHobby(hobbies.sellTrinkets));
        el.addEventListener('mouseenter', () => showTaskInfo(hobbies.sellTrinkets));
    }
    if (document.getElementById('brew-potion')) {
        const el = document.getElementById('brew-potion');
        el.addEventListener('click', () => runHobby(hobbies.brewPotion));
        el.addEventListener('mouseenter', () => showTaskInfo(hobbies.brewPotion));
    }

    document.querySelectorAll('[data-speed]').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseFloat(btn.getAttribute('data-speed'));
            if (!isNaN(val)) {
                state.time = val;
                updateUI();
            }
        });
    });

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveState);
    const loadBtn = document.getElementById('load-btn');
    if (loadBtn) loadBtn.addEventListener('click', () => { loadState(routinesById); updateUI(); });
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', () => { restart(); updateUI(); saveState(); });

    initTabs();
}

