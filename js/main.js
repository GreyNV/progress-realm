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
    document.getElementById('current-routine').textContent = routineName;
    const descEl = document.getElementById('routine-description');
    if (descEl) {
        const desc = state.activeRoutine ? state.activeRoutine.description : '';
        descEl.textContent = desc;
    }

    const speedEl = document.getElementById('speed-value');
    if (speedEl) {
        speedEl.textContent = state.time + 'x';
    }

    Object.values(routines).forEach(r => {
        if (!r.buttonId) return;
        const el = document.getElementById(r.buttonId);
        const prog = document.getElementById(r.buttonId + '-progress');
        if (el) {
            el.style.display = r.showCondition() ? 'inline-block' : 'none';
            el.disabled = !r.unlockCondition();
            if (prog) {
                prog.max = r.duration;
                prog.value = state.activeRoutine === r ? r.progress : 0;
            }
        }
    });

    Object.values(habits).forEach(h => {
        const el = document.getElementById(h.buttonId);
        const prog = document.getElementById(h.buttonId + '-progress');
        if (el) {
            el.style.display = h.showCondition() ? 'inline-block' : 'none';
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
        buttonId: 'sword-training-btn',
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
        buttonId: 'guard-duty-btn',
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
        buttonId: null,
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
        buttonId: 'collect-taxes-btn',
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
    const button = document.getElementById(habit.buttonId);
    if (button) button.disabled = true;
    const interval = setInterval(() => {
        habit.progress += getSpeedMultiplier(habit);
        if (habit.progress >= habit.duration) {
            clearInterval(interval);
            habit.effect();
            habit.running = false;
            habit.progress = 0;
            if (button) button.disabled = false;
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
}

function init() {
    updateUI();
    const btnTrain = document.getElementById('sword-training-btn');
    if (btnTrain) {
        btnTrain.addEventListener('click', () => startRoutine(routines.swordPractice));
    }
    const btnGuard = document.getElementById('guard-duty-btn');
    if (btnGuard) {
        btnGuard.addEventListener('click', () => startRoutine(routines.guardDuty));
    }
    const btnTaxes = document.getElementById('collect-taxes-btn');
    if (btnTaxes) {
        btnTaxes.addEventListener('click', () => runHabit(habits.collectTaxes));
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
        if (!r.buttonId) return;
        const el = document.getElementById(r.buttonId);
        if (el) {
            el.style.display = r.showCondition() ? 'inline-block' : 'none';
            el.disabled = !r.unlockCondition();
        }
    });
    Object.values(habits).forEach(h => {
        const el = document.getElementById(h.buttonId);
        if (el) {
            el.style.display = h.showCondition() ? 'inline-block' : 'none';
        }
    });
    startRoutine(routines.rest);
    setInterval(tick, 50);
}

document.addEventListener('DOMContentLoaded', init);
