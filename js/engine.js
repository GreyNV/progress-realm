import { state, applyResourceCaps, loadState } from './state.js';
import { routines, routinesById, hobbies } from './tasks.js';

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

export function runHobby(hobby) {
    if (!hobby || hobby.running) return;
    hobby.running = true;
    hobby.progress = 0;
}

function processRoutine(dt) {
    const r = state.activeRoutine;
    if (!r) return;
    r.progress += dt * r.speedMultiplier();
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

function processHobbies(dt) {
    Object.values(hobbies).forEach(h => {
        if (!h.running) return;
        h.progress += dt * h.speedMultiplier();
        if (h.progress >= h.baseDuration) {
            h.running = false;
            h.progress = 0;
            h.effect(h.yieldMultiplier());
            h.gainXp();
        }
    });
}

function processBuffsAndAge(dt) {
    state.buffs = state.buffs.filter(b => !b.expiresAt || Date.now() < b.expiresAt);
    state.ageDays += dt;
    while (state.ageDays >= 365) {
        state.ageDays -= 365;
        state.ageYears += 1;
    }
    if (state.ageYears >= state.maxAge) {
        restart();
    }
}

export function tick(delta = 1) {
    const dt = delta * state.time;
    processRoutine(dt);
    processHobbies(dt);
    processBuffsAndAge(dt);
    applyResourceCaps();
    if (!state.activeRoutine && state.queuedRoutine && state.resources.energy > 0) {
        const routine = state.queuedRoutine;
        state.queuedRoutine = null;
        startRoutine(routine);
    }
}

export function restart() {
    Object.keys(state.stats).forEach(key => {
        const gain = state.stats[key] * 0.2;
        state.prestige[key] += gain;
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

export { routines, hobbies };
