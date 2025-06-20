import { state, applyResourceCaps, loadState } from './state.js';
import { routines, routinesById, habits } from './tasks.js';

export function startRoutine(routine) {
    if (!routine || !routine.unlockCondition()) return;
    if (state.activeRoutine === routine) return;
    if (state.activeRoutine) stopRoutine();
    routine.progress = 0;
    state.activeRoutine = routine;
}

export function stopRoutine() {
    if (state.activeRoutine) {
        state.activeRoutine.progress = 0;
        state.activeRoutine = null;
    }
}

export function runHabit(habit) {
    if (!habit || habit.running) return;
    habit.running = true;
    habit.progress = 0;
}

function processRoutine() {
    const r = state.activeRoutine;
    if (!r) return;
    r.progress += state.time * r.speedMultiplier();
    if (r.progress >= r.baseDuration) {
        r.progress -= r.baseDuration;
        r.effect(r.yieldMultiplier());
        r.gainXp();
    }
    if (state.resources.energy <= 0 && r !== routines.rest) {
        state.queuedRoutine = r;
        stopRoutine();
        startRoutine(routines.rest);
    }
}

function processHabits() {
    Object.values(habits).forEach(h => {
        if (!h.running) return;
        h.progress += state.time * h.speedMultiplier();
        if (h.progress >= h.baseDuration) {
            h.running = false;
            h.progress = 0;
            h.effect(h.yieldMultiplier());
            h.gainXp();
        }
    });
}

function processBuffsAndAge() {
    state.buffs = state.buffs.filter(b => !b.expiresAt || Date.now() < b.expiresAt);
    state.ageDays += state.time;
    while (state.ageDays >= 365) {
        state.ageDays -= 365;
        state.ageYears += 1;
    }
    if (state.ageYears >= state.maxAge) {
        restart();
    }
}

export function tick() {
    processRoutine();
    processHabits();
    processBuffsAndAge();
    applyResourceCaps();
    if (!state.activeRoutine && state.queuedRoutine && state.resources.energy > 0) {
        const routine = state.queuedRoutine;
        state.queuedRoutine = null;
        startRoutine(routine);
    }
}

export function restart() {
    Object.keys(state.stats).forEach(key => {
        state.prestige[key] += state.stats[key];
        state.stats[key] = 1;
    });
    state.showPrestige = true;
    state.ageYears = 16;
    state.ageDays = 0;
    Object.assign(state.resources, {
        energy: state.resources.maxEnergy,
        gold: 0,
        herbs: 0,
        scrolls: 0,
        manaCores: 0,
    });
    state.buffs = [];
    stopRoutine();
    state.queuedRoutine = null;
    startRoutine(routines.rest);
}

export function initEngine() {
    loadState(routinesById);
    if (!state.activeRoutine) startRoutine(routines.rest);
}

export { routines, habits };
