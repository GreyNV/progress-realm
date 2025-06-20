// Basic setup for Progress Realm prototype

const state = {
    stats: {

        strength: 1,
        intelligence: 1,
        charisma: 1,
    },
    prestige: {
        strength: 0,
        intelligence: 0,
        charisma: 0,
    },
    showPrestige: false,
    ageYears: 16,
    ageDays: 0,
    maxAge: 75,
    time: 1,
    resources: {
        energy: 5,
        maxEnergy: 10,
        gold: 0,
        maxGold: 100,
    },
    activeRoutine: null,
    queuedRoutine: null,
};

function getRoutineKey(obj) {
    for (const key in routines) {
        if (routines[key] === obj) return key;
    }
    return null;
}

function saveState() {
    const data = {
        stats: state.stats,
        prestige: state.prestige,
        showPrestige: state.showPrestige,
        ageYears: state.ageYears,
        ageDays: state.ageDays,
        maxAge: state.maxAge,
        time: state.time,
        resources: state.resources,
        activeRoutine: getRoutineKey(state.activeRoutine),
        queuedRoutine: getRoutineKey(state.queuedRoutine),
    };
    localStorage.setItem('progressRealmSave', JSON.stringify(data));
}

function loadState() {
    const raw = localStorage.getItem('progressRealmSave');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        Object.assign(state.stats, data.stats || {});
        Object.assign(state.prestige, data.prestige || {});
        state.showPrestige = data.showPrestige || false;
        state.ageYears = data.ageYears || 16;
        state.ageDays = data.ageDays || 0;
        state.maxAge = data.maxAge || 75;
        state.time = data.time || 1;
        Object.assign(state.resources, data.resources || {});
        state.activeRoutine = data.activeRoutine ? routines[data.activeRoutine] : null;
        state.queuedRoutine = data.queuedRoutine ? routines[data.queuedRoutine] : null;
    } catch (e) {
        console.error('Failed to load save', e);
    }
}

function applyResourceCaps() {
    state.resources.energy = Math.min(state.resources.energy, state.resources.maxEnergy);
    state.resources.gold = Math.min(state.resources.gold, state.resources.maxGold);
}

function getSpeedMultiplier(action) {
    let mult = state.time;
    if (action.bonusStat && state.stats[action.bonusStat] !== undefined) {
        mult *= 1 + (state.stats[action.bonusStat] - 1) * 0.02;
    }
    return mult;
}
function updateUI() {
    document.getElementById('stat-strength').textContent = state.stats.strength;
    document.getElementById('stat-intelligence').textContent = state.stats.intelligence;
    document.getElementById('stat-charisma').textContent = state.stats.charisma;
    document.getElementById('prestige-strength').textContent = state.prestige.strength;
    document.getElementById('prestige-intelligence').textContent = state.prestige.intelligence;
    document.getElementById('prestige-charisma').textContent = state.prestige.charisma;

    const prestigeBlock = document.getElementById('prestige-block');
    if (prestigeBlock) {
        prestigeBlock.style.display = state.showPrestige ? 'block' : 'none';
    }

    document.getElementById('age-years').textContent = state.ageYears;
    document.getElementById('age-days').textContent = state.ageDays;
    document.getElementById('max-age').textContent = state.maxAge;

    document.getElementById('res-energy').textContent = state.resources.energy;
    document.getElementById('res-energy-cap').textContent = state.resources.maxEnergy;
    document.getElementById('res-gold').textContent = state.resources.gold;
    document.getElementById('res-gold-cap').textContent = state.resources.maxGold;

    const routineName = state.activeRoutine ? state.activeRoutine.name : 'None';
    const routineCategory = state.activeRoutine ? state.activeRoutine.category : 'none';
    document.getElementById('current-routine').textContent = routineName;
    document.getElementById('current-category').textContent = routineCategory;
    const descEl = document.getElementById('routine-description');
    if (descEl) {
        const desc = state.activeRoutine ? state.activeRoutine.description : '';
        descEl.textContent = desc;
    }

    const speedEl = document.getElementById('speed-value');
    if (speedEl) {
        speedEl.textContent = state.time + 'x';
    }

    const habitList = document.getElementById('active-habits');
    if (habitList) {
        habitList.innerHTML = '';
        Object.values(habits).forEach(h => {
            if (h.running) {
                const li = document.createElement('li');
                li.textContent = `${h.name} (${h.category})`;
                habitList.appendChild(li);
            }
        });
    }

    Object.values(routines).forEach(r => {
        if (!r.elementId) return;
        const container = document.getElementById(r.elementId);
        const prog = document.getElementById(r.elementId + '-progress');
        if (container) {
            container.style.display = r.showCondition() ? 'block' : 'none';
            if (prog) {
                prog.max = r.duration;
                prog.value = state.activeRoutine === r ? r.progress : 0;
            }
        }
    });

    Object.values(habits).forEach(h => {
        const container = document.getElementById(h.elementId);
        const prog = document.getElementById(h.elementId + '-progress');
        if (container) {
            container.style.display = h.showCondition() ? 'block' : 'none';
            if (prog) {
                prog.max = h.duration || 0;
                prog.value = h.progress || 0;
            }
        }
    });
}

const routines = {
    swordPractice: {
        name: 'Sword Practice',
        category: 'physical',
        bonusStat: 'strength',
        description: 'Drill at the barracks with your retired mercenary father to build muscle.',
        elementId: 'sword-training',
        duration: 5,
        progress: 0,
        modifiers: [],
        intervalId: null,
        showCondition() { return true; },
        unlockCondition() { return true; },
        effect() {
            const cost = 1 * state.time;
            if (state.resources.energy >= cost) {
                state.resources.energy -= cost;
                state.stats.strength += 0.5 * state.time;
                applyResourceCaps();
                updateUI();
            } else {
                stopRoutine(this);
                state.queuedRoutine = this;
                startRoutine(routines.rest);
            }
        },
    },
    guardDuty: {
        name: 'Guard Duty',
        category: 'physical',
        bonusStat: 'strength',
        description: 'Patrol the family lands and earn a small wage.',
        elementId: 'guard-duty',
        duration: 10,
        progress: 0,
        modifiers: [],
        intervalId: null,
        showCondition() { return state.stats.strength >= 2; },
        unlockCondition() { return state.stats.strength >= 2; },
        effect() {
            const cost = 2 * state.time;
            if (state.resources.energy >= cost) {
                state.resources.energy -= cost;
                state.resources.gold += 1 * state.time;
                applyResourceCaps();
                updateUI();
            } else {
                stopRoutine(this);
                state.queuedRoutine = this;
                startRoutine(routines.rest);
            }
        },
    },
    rest: {
        name: 'Resting',
        category: 'rest',
        description: 'Take a break to recover your energy.',
        elementId: null,
        duration: 5,
        progress: 0,
        modifiers: [],
        intervalId: null,
        showCondition() { return true; },
        unlockCondition() { return true; },
        effect() {
            if (state.resources.energy < state.resources.maxEnergy) {
                state.resources.energy += 1 * state.time;
                applyResourceCaps();
                updateUI();
                if (state.resources.energy >= state.resources.maxEnergy && state.queuedRoutine) {
                    const routine = state.queuedRoutine;
                    state.queuedRoutine = null;
                    startRoutine(routine);
                }
            }
        },
    },
};

const habits = {
    collectTaxes: {
        name: 'Collect Taxes',
        elementId: 'collect-taxes',
        category: 'social',
        bonusStat: 'charisma',
        duration: 3,
        progress: 0,
        running: false,
        showCondition() { return true; },
        effect() {
            state.resources.gold += 5;
            applyResourceCaps();
        },
    },
};

function startRoutine(routine) {
    if (!routine.unlockCondition()) return;
    if (state.activeRoutine === routine) return;
    if (state.activeRoutine) stopRoutine(state.activeRoutine);
    routine.progress = 0;
    routine.intervalId = setInterval(() => {
        routine.progress += getSpeedMultiplier(routine);
        if (routine.progress >= routine.duration) {
            routine.progress -= routine.duration;
            routine.effect();
        }
        updateUI();
    }, 1000);
    state.activeRoutine = routine;
    updateUI();
}

function stopRoutine(routine) {
    if (routine && routine.intervalId) {
        clearInterval(routine.intervalId);
        routine.intervalId = null;
        routine.progress = 0;
    }
}

function runHabit(habit) {
    if (habit.running) return;
    habit.running = true;
    habit.progress = 0;
    const interval = setInterval(() => {
        habit.progress += getSpeedMultiplier(habit);
        if (habit.progress >= habit.duration) {
            clearInterval(interval);
            habit.effect();
            habit.running = false;
            habit.progress = 0;
            updateUI();
            return;
        }
        updateUI();
    }, 1000);
}

function tick() {
    state.ageDays += state.time;
    while (state.ageDays >= 365) {
        state.ageDays -= 365;
        state.ageYears += 1;
    }
    if (state.ageYears >= state.maxAge) {
        restart();
    }
    updateUI();
    saveState();
}

function restart() {
    for (const key in state.stats) {
        state.prestige[key] += state.stats[key];
        state.stats[key] = 1;
    }
    state.showPrestige = true;
    state.ageYears = 16;
    state.ageDays = 0;
    state.resources.energy = state.resources.maxEnergy;
    state.resources.gold = 0;
    if (state.activeRoutine) stopRoutine(state.activeRoutine);
    state.queuedRoutine = null;
    startRoutine(routines.rest);
    updateUI();
    saveState();
}

function init() {
    loadState();
    updateUI();
    const trainEl = document.getElementById('sword-training');
    if (trainEl) {
        trainEl.addEventListener('click', () => startRoutine(routines.swordPractice));
    }
    const guardEl = document.getElementById('guard-duty');
    if (guardEl) {
        guardEl.addEventListener('click', () => startRoutine(routines.guardDuty));
    }
    const taxesEl = document.getElementById('collect-taxes');
    if (taxesEl) {
        taxesEl.addEventListener('click', () => runHabit(habits.collectTaxes));
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

    Object.values(routines).forEach(r => {
        if (!r.elementId) return;
        const container = document.getElementById(r.elementId);
        if (container) {
            container.style.display = r.showCondition() ? 'block' : 'none';
        }
    });
    Object.values(habits).forEach(h => {
        const container = document.getElementById(h.elementId);
        if (container) {
            container.style.display = h.showCondition() ? 'block' : 'none';
        }
    });
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveState);
    const loadBtn = document.getElementById('load-btn');
    if (loadBtn) loadBtn.addEventListener('click', () => { loadState(); updateUI(); });

    if (state.activeRoutine) {
        startRoutine(state.activeRoutine);
    } else {
        startRoutine(routines.rest);
    }
    setInterval(tick, 50);
}

document.addEventListener('DOMContentLoaded', init);
