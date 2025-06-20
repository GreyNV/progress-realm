import { state, applyResourceCaps } from './state.js';

export class Task {
    constructor({ id, name, category, bonusStat, description, elementId, duration, showCondition = () => true, unlockCondition = () => true, effect }) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.bonusStat = bonusStat;
        this.description = description;
        this.elementId = elementId;
        this.duration = duration;
        this.showCondition = showCondition;
        this.unlockCondition = unlockCondition;
        this.effect = effect;
        this.progress = 0;
        this.running = false;
    }
}

export const routines = {
    swordPractice: new Task({
        id: 'swordPractice',
        name: 'Sword Practice',
        category: 'physical',
        bonusStat: 'strength',
        description: 'Drill at the barracks with your retired mercenary father to build muscle.',
        elementId: 'sword-training',
        duration: 5,
        effect() {
            const cost = 1 * state.time;
            if (state.resources.energy >= cost) {
                state.resources.energy -= cost;
                state.stats.strength += 0.5 * state.time;
                applyResourceCaps();
            }
        }
    }),
    guardDuty: new Task({
        id: 'guardDuty',
        name: 'Guard Duty',
        category: 'physical',
        bonusStat: 'strength',
        description: 'Patrol the family lands and earn a small wage.',
        elementId: 'guard-duty',
        duration: 10,
        showCondition() { return state.stats.strength >= 2; },
        unlockCondition() { return state.stats.strength >= 2; },
        effect() {
            const cost = 2 * state.time;
            if (state.resources.energy >= cost) {
                state.resources.energy -= cost;
                state.resources.gold += 1 * state.time;
                applyResourceCaps();
            }
        }
    }),
    studyGlyphs: new Task({
        id: 'studyGlyphs',
        name: 'Study Glyphs',
        category: 'mental',
        bonusStat: 'intelligence',
        description: 'Learn arcane symbols to grow your magical insight.',
        elementId: 'study-glyphs',
        duration: 10,
        showCondition() { return state.resources.crystalDust > 0; },
        unlockCondition() { return state.resources.crystalDust > 0; },
        effect() {
            const dustCost = 1 * state.time;
            const energyCost = 5 * state.time;
            if (state.resources.crystalDust >= dustCost && state.resources.energy >= energyCost) {
                state.resources.crystalDust -= dustCost;
                state.resources.energy -= energyCost;
                state.stats.intelligence += 0.2 * state.time;
                state.stats.wisdom += 0.1 * state.time;
                applyResourceCaps();
            }
        }
    }),
    meditate: new Task({
        id: 'meditate',
        name: 'Meditate',
        category: 'spiritual',
        bonusStat: 'wisdom',
        description: 'Calm your mind to gain insight and recover energy.',
        elementId: 'meditate',
        duration: 5,
        effect() {
            const cost = 3 * state.time;
            if (state.resources.energy >= cost) {
                state.resources.energy -= cost;
                state.stats.wisdom += 0.1 * state.time;
                state.resources.energy += 1 * state.time;
                applyResourceCaps();
            }
        }
    }),
    rest: new Task({
        id: 'rest',
        name: 'Resting',
        category: 'rest',
        description: 'Take a break to recover your energy.',
        elementId: null,
        duration: 5,
        effect() {
            if (state.resources.energy < state.resources.maxEnergy) {
                state.resources.energy += 1 * state.time;
                applyResourceCaps();
            }
        }
    }),
};

export const habits = {
    collectTaxes: new Task({
        id: 'collectTaxes',
        name: 'Collect Taxes',
        elementId: 'collect-taxes',
        category: 'social',
        bonusStat: 'charisma',
        duration: 3,
        effect() {
            state.resources.gold += 5;
            applyResourceCaps();
        }
    }),
    forgeCharm: new Task({
        id: 'forgeCharm',
        name: 'Forge Charm',
        elementId: 'forge-charm',
        category: 'crafting',
        bonusStat: 'intelligence',
        duration: 30,
        showCondition() { return state.resources.manaCores > 0; },
        effect() {
            if (state.resources.manaCores >= 1) {
                state.resources.manaCores -= 1;
                state.buffs.push({ name: 'Charm', expiresAt: Date.now() + 600000 });
                applyResourceCaps();
            }
        }
    })
};

export const routinesById = {};
Object.values(routines).forEach(r => { routinesById[r.id] = r; });
