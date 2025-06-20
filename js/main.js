// Basic setup for Progress Realm prototype

const state = {
    stats: {
        strength: 0,
        intelligence: 0,
        charisma: 0,
    },
    prestige: {
        strength: 0,
        intelligence: 0,
        charisma: 0,
    },
    age: 16,
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

function updateUI() {
    document.getElementById('stat-strength').textContent = state.stats.strength;
    document.getElementById('stat-intelligence').textContent = state.stats.intelligence;
    document.getElementById('stat-charisma').textContent = state.stats.charisma;

    document.getElementById('prestige-strength').textContent = state.prestige.strength;
    document.getElementById('prestige-intelligence').textContent = state.prestige.intelligence;
    document.getElementById('prestige-charisma').textContent = state.prestige.charisma;

    document.getElementById('stat-age').textContent = state.age;
    document.getElementById('stat-max-age').textContent = state.maxAge;

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
}

const routines = {
    trainStrength: {
        name: 'Strength Training',
        description: 'Drill at the barracks with your retired mercenary father to build muscle.',
        intervalId: null,
        effect() {
            const cost = 1 * state.time;
            if (state.resources.energy >= cost) {
                state.resources.energy -= cost;
                state.stats.strength += 1 * state.time;
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
        description: 'Patrol the family lands and earn a small wage.',
        intervalId: null,
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
        description: 'Take a break to recover your energy.',
        intervalId: null,
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

function startRoutine(routine) {
    if (state.activeRoutine === routine) return;
    if (state.activeRoutine) stopRoutine(state.activeRoutine);
    routine.intervalId = setInterval(() => routine.effect(), 1000);
    state.activeRoutine = routine;
    updateUI();
}

function stopRoutine(routine) {
    if (routine && routine.intervalId) {
        clearInterval(routine.intervalId);
        routine.intervalId = null;
    }
}

function tick() {
    state.age += 1;
    if (state.age >= state.maxAge) {
        restart();
    }
    updateUI();
}

function restart() {
    for (const key in state.stats) {
        state.prestige[key] += state.stats[key];
        state.stats[key] = 0;
    }
    state.age = 16;
    state.resources.energy = state.resources.maxEnergy;
    state.resources.gold = 0;
    if (state.activeRoutine) stopRoutine(state.activeRoutine);
    state.queuedRoutine = null;
    startRoutine(routines.rest);
    updateUI();
}

function init() {
    updateUI();
    const btnTrain = document.getElementById('train-strength-btn');
    if (btnTrain) {
        btnTrain.addEventListener('click', () => startRoutine(routines.trainStrength));
    }
    const btnGuard = document.getElementById('guard-duty-btn');
    if (btnGuard) {
        btnGuard.addEventListener('click', () => startRoutine(routines.guardDuty));
    }
    startRoutine(routines.rest);
    setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', init);
