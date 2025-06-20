import { state, applyResourceCaps } from './state.js';

export class Task {
    constructor({ id, name, category, bonusStat, description, elementId, baseDuration, showCondition = () => true, unlockCondition = () => true, effect }) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.bonusStat = bonusStat;
        this.description = description;
        this.elementId = elementId;
        this.baseDuration = baseDuration;
        this.showCondition = showCondition;
        this.unlockCondition = unlockCondition;
        this.effect = effect;
        this.progress = 0;
        this.running = false;
        this.level = 1;
        this.xp = 0;
    }

    speedMultiplier() {
        return 1 + 0.5 * this.level / (this.level + 4);
    }

    yieldMultiplier() {
        return 1 + 0.5 * this.level / (this.level + 4);
    }

    duration() {
        return this.baseDuration / this.speedMultiplier();
    }

    gainXp() {
        this.xp += 1;
        if (this.xp >= this.level * 5) {
            this.xp -= this.level * 5;
            this.level += 1;
        }
    }
}

export const routines = {
    pushUps: new Task({
        id: 'pushUps',
        name: 'Push-Ups',
        category: 'physical',
        bonusStat: 'strength',
        description: 'Basic strength training to build your body.',
        elementId: 'push-ups',
        baseDuration: 5,
        effect(mult) {
            const cost = 1 * state.time;
            if (state.resources.energy >= cost) {
                state.resources.energy -= cost;
                state.stats.strength += 0.3 * mult * state.time;
                applyResourceCaps();
            }
        }
    }),
    readScrolls: new Task({
        id: 'readScrolls',
        name: 'Read Scrolls',
        category: 'mental',
        bonusStat: 'intelligence',
        description: 'Study arcane scrolls to improve intellect.',
        elementId: 'read-scrolls',
        baseDuration: 8,
        showCondition() { return state.resources.scrolls > 0; },
        effect(mult) {
            const scrollCost = 1 * state.time;
            const energyCost = 4 * state.time;
            if (state.resources.scrolls >= scrollCost && state.resources.energy >= energyCost) {
                state.resources.scrolls -= scrollCost;
                state.resources.energy -= energyCost;
                state.stats.intelligence += 0.3 * mult * state.time;
                state.stats.wisdom += 0.1 * mult * state.time;
                applyResourceCaps();
            }
        }
    }),
    mindFocus: new Task({
        id: 'mindFocus',
        name: 'Mind Focus',
        category: 'spiritual',
        bonusStat: 'wisdom',
        description: 'Center your thoughts and recover energy.',
        elementId: 'mind-focus',
        baseDuration: 6,
        effect(mult) {
            const cost = 2 * state.time;
            if (state.resources.energy >= cost) {
                state.resources.energy -= cost;
                state.stats.wisdom += 0.2 * mult * state.time;
                state.resources.energy += 0.5 * state.time;
                applyResourceCaps();
            }
        }
    }),
    arcaneExperiment: new Task({
        id: 'arcaneExperiment',
        name: 'Arcane Experiment',
        category: 'arcane',
        bonusStat: 'intelligence',
        description: 'Risky experiments to push magical boundaries.',
        elementId: 'arcane-experiment',
        baseDuration: 12,
        showCondition() { return state.stats.intelligence >= 5 && state.stats.wisdom >= 5; },
        effect(mult) {
            if (state.resources.manaCores >= 2) {
                state.resources.manaCores -= 2;
                state.stats.intelligence += 0.5 * mult * state.time;
                state.stats.wisdom += 0.5 * mult * state.time;
                applyResourceCaps();
            }
        }
    }),
    rest: new Task({
        id: 'rest',
        name: 'Resting',
        category: 'rest',
        description: 'Recover your energy slowly.',
        elementId: null,
        baseDuration: 5,
        effect(mult) {
            if (state.resources.energy < state.resources.maxEnergy) {
                state.resources.energy += 1 * state.time;
                applyResourceCaps();
            }
        }
    })
};

export const habits = {
    gatherHerbs: new Task({
        id: 'gatherHerbs',
        name: 'Gather Herbs',
        elementId: 'gather-herbs',
        category: 'foraging',
        bonusStat: 'endurance',
        baseDuration: 3,
        effect(mult) {
            state.resources.herbs += 1;
            applyResourceCaps();
        }
    }),
    sellTrinkets: new Task({
        id: 'sellTrinkets',
        name: 'Sell Trinkets',
        elementId: 'sell-trinkets',
        category: 'social',
        bonusStat: 'charisma',
        baseDuration: 5,
        effect(mult) {
            state.resources.gold += 10;
            applyResourceCaps();
        }
    }),
    brewPotion: new Task({
        id: 'brewPotion',
        name: 'Brew Potion',
        elementId: 'brew-potion',
        category: 'alchemy',
        bonusStat: 'intelligence',
        baseDuration: 10,
        showCondition() { return state.resources.herbs > 0 && state.resources.manaCores > 0; },
        effect(mult) {
            if (state.resources.herbs >= 1 && state.resources.manaCores >= 1) {
                state.resources.herbs -= 1;
                state.resources.manaCores -= 1;
                state.buffs.push({ name: 'Clarity', expiresAt: Date.now() + 300000 });
                applyResourceCaps();
            }
        }
    })
};

export class Upgrade {
    constructor({ id, name, category, tier, description, apply }) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.tier = tier;
        this.description = description;
        this.apply = apply;
    }
}

export const upgrades = {
    fitTrainer: new Upgrade({
        id: 'fitTrainer',
        name: 'Fit Trainer',
        category: 'training',
        tier: 1,
        description: 'Improve Push-Up efficiency',
        apply() { routines.pushUps.level += 1; }
    }),
    scholarlyMentor: new Upgrade({
        id: 'scholarlyMentor',
        name: 'Scholarly Mentor',
        category: 'study',
        tier: 1,
        description: 'Improve Scroll study speed',
        apply() { routines.readScrolls.level += 1; }
    })
};

export const routinesById = {};
Object.values(routines).forEach(r => { routinesById[r.id] = r; });

export const upgradesById = {};
Object.values(upgrades).forEach(u => { upgradesById[u.id] = u; });
