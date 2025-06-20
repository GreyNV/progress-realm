import { state, saveState, loadState } from './state.js';
import { routines, habits, routinesById } from './tasks.js';
import { startRoutine, runHabit } from './engine.js';

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

    document.getElementById('age-years').textContent = state.ageYears;
    document.getElementById('age-days').textContent = state.ageDays;
    document.getElementById('max-age').textContent = state.maxAge;

    const res = state.resources;
    document.getElementById('res-energy').textContent = res.energy;
    document.getElementById('res-energy-cap').textContent = res.maxEnergy;
    document.getElementById('res-gold').textContent = res.gold;
    document.getElementById('res-gold-cap').textContent = res.maxGold;
    document.getElementById('res-dust').textContent = res.crystalDust;
    document.getElementById('res-dust-cap').textContent = res.maxCrystalDust;
    document.getElementById('res-cores').textContent = res.manaCores;
    document.getElementById('res-cores-cap').textContent = res.maxManaCores;
    document.getElementById('active-charms').textContent = state.buffs.filter(b => b.name === 'Charm').length;

    const routineName = state.activeRoutine ? state.activeRoutine.name : 'None';
    const routineCategory = state.activeRoutine ? state.activeRoutine.category : 'none';
    document.getElementById('current-routine').textContent = routineName;
    document.getElementById('current-category').textContent = routineCategory;

    const speedEl = document.getElementById('speed-value');
    if (speedEl) speedEl.textContent = state.time + 'x';

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
        if (container) container.style.display = r.showCondition() ? 'block' : 'none';
        if (prog) {
            prog.max = r.duration;
            prog.value = state.activeRoutine === r ? r.progress : 0;
        }
    });

    Object.values(habits).forEach(h => {
        const container = document.getElementById(h.elementId);
        const prog = document.getElementById(h.elementId + '-progress');
        if (container) container.style.display = h.showCondition() ? 'block' : 'none';
        if (prog) {
            prog.max = h.duration;
            prog.value = h.progress;
        }
    });
}

export function initUI() {
    updateUI();

    if (document.getElementById('sword-training')) document.getElementById('sword-training').addEventListener('click', () => startRoutine(routines.swordPractice));
    if (document.getElementById('guard-duty')) document.getElementById('guard-duty').addEventListener('click', () => startRoutine(routines.guardDuty));
    if (document.getElementById('study-glyphs')) document.getElementById('study-glyphs').addEventListener('click', () => startRoutine(routines.studyGlyphs));
    if (document.getElementById('meditate')) document.getElementById('meditate').addEventListener('click', () => startRoutine(routines.meditate));

    if (document.getElementById('collect-taxes')) document.getElementById('collect-taxes').addEventListener('click', () => runHabit(habits.collectTaxes));
    if (document.getElementById('forge-charm')) document.getElementById('forge-charm').addEventListener('click', () => runHabit(habits.forgeCharm));

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
}

