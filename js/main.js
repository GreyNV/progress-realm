// Basic setup for Progress Realm prototype

const state = {
    stats: {
        strength: 0,
        intelligence: 0,
        charisma: 0,
    },
    resources: {
        energy: 5,
        maxEnergy: 10,
        gold: 0,
        maxGold: 100,
    },
};

function applyResourceCaps() {
    state.resources.energy = Math.min(state.resources.energy, state.resources.maxEnergy);
    state.resources.gold = Math.min(state.resources.gold, state.resources.maxGold);
}

function updateUI() {
    document.getElementById('stat-strength').textContent = state.stats.strength;
    document.getElementById('stat-intelligence').textContent = state.stats.intelligence;
    document.getElementById('stat-charisma').textContent = state.stats.charisma;

    document.getElementById('res-energy').textContent = state.resources.energy;
    document.getElementById('res-energy-cap').textContent = state.resources.maxEnergy;
    document.getElementById('res-gold').textContent = state.resources.gold;
    document.getElementById('res-gold-cap').textContent = state.resources.maxGold;
}

const actions = {
    trainStrength: {
        name: 'Train Strength',
        intervalId: null,
        effect() {
            if (state.resources.energy > 0) {
                state.resources.energy -= 1;
                state.stats.strength += 1;
                applyResourceCaps();
                updateUI();
            } else {
                stopAction(this);
            }
        },
    },
};

function startAction(action) {
    if (action.intervalId) return;
    action.intervalId = setInterval(() => action.effect(), 1000);
}

function stopAction(action) {
    if (action.intervalId) {
        clearInterval(action.intervalId);
        action.intervalId = null;
    }
}

function init() {
    updateUI();
    const btn = document.getElementById('train-strength-btn');
    if (btn) {
        btn.addEventListener('click', () => startAction(actions.trainStrength));
    }
}

document.addEventListener('DOMContentLoaded', init);
