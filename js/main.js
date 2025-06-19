// Basic setup for Progress Realm prototype

const state = {
    stats: {
        strength: 0,
        intelligence: 0,
        charisma: 0,
    },
    resources: {
        energy: 0,
        gold: 0,
    },
};

function updateUI() {
    document.getElementById('stat-strength').textContent = state.stats.strength;
    document.getElementById('stat-intelligence').textContent = state.stats.intelligence;
    document.getElementById('stat-charisma').textContent = state.stats.charisma;

    document.getElementById('res-energy').textContent = state.resources.energy;
    document.getElementById('res-gold').textContent = state.resources.gold;
}

function trainStrength() {
    state.stats.strength += 1;
    updateUI();
}

function init() {
    updateUI();
    const btn = document.getElementById('train-strength-btn');
    if (btn) {
        btn.addEventListener('click', trainStrength);
    }
}

document.addEventListener('DOMContentLoaded', init);
