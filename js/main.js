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
    age: 0,
    maxAge: 100,
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
}

const routines = {
    trainStrength: {
        name: 'Strength Training',
        intervalId: null,
        effect() {
            if (state.resources.energy > 0) {
                state.resources.energy -= 1;
                state.stats.strength += 1;
                applyResourceCaps();
                updateUI();
                if (state.resources.energy === 0) {
                    stopRoutine(this);
                    state.queuedRoutine = this;
                    startRoutine(routines.rest);
                }
            }
        },
    },
    rest: {
        name: 'Resting',
        intervalId: null,
        effect() {
            if (state.resources.energy < state.resources.maxEnergy) {
                state.resources.energy += 1;
                applyResourceCaps();
                updateUI();
                if (state.resources.energy === state.resources.maxEnergy && state.queuedRoutine) {
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
    state.age = 0;
    state.resources.energy = state.resources.maxEnergy;
    state.resources.gold = 0;
    if (state.activeRoutine) stopRoutine(state.activeRoutine);
    state.queuedRoutine = null;
    startRoutine(routines.rest);
    updateUI();
}

function init() {
    updateUI();
    const btn = document.getElementById('train-strength-btn');
    if (btn) {
        btn.addEventListener('click', () => startRoutine(routines.trainStrength));
    }
    startRoutine(routines.rest);
    setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', init);
