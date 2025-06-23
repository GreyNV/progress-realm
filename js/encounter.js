class Encounter {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || '';
        this.rarity = data.rarity || 'common';
        this.category = data.category || 'strength';
        this.baseDuration = data.baseDuration || 5;
        this.resourceConsumption = data.resourceConsumption || {};
    }

    getDuration() {
        const stat = State.stats[this.category] || 0;
        const reduction = stat * EncounterGenerator.durationModPerStat;
        return Math.max(this.baseDuration * (1 - reduction), 1);
    }

    getLootChance() {
        const base = EncounterGenerator.lootBaseByCategory[this.category] || 0;
        const stat = State.stats[this.category] || 0;
        return base + stat * EncounterGenerator.lootBonusPerStat;
    }

    getResourceCost() {
        const scale =
            1 + EncounterGenerator.level * EncounterGenerator.costScalePerLevel;
        const cost = {};
        for (const k in this.resourceConsumption) {
            cost[k] = this.resourceConsumption[k] * scale;
        }
        return cost;
    }
}

const EncounterGenerator = {
    encounters: [],
    container: null,
    level: 0,
    milestones: [
        { level: 0, name: 'Hut in the Forest' },
        { level: 3, name: 'Abandoned Clearing' },
        { level: 6, name: 'Ruined Keep' }
    ],
    rarityWeights: {
        common: 1,
        rare: 0.5,
        epic: 0.2,
        legendary: 0.1,
    },
    lootBaseByCategory: {
        strength: 0.02,
        intelligence: 0.02,
        creativity: 0.02,
    },
    lootBonusPerStat: 0.001, // +0.1% loot chance per stat point
    durationModPerStat: 0.02, // -2% duration per stat point
    costScalePerLevel: 0.1, // +10% cost per encounter level

    async load() {
        try {
            const res = await fetch('data/encounters.json');
            const json = await res.json();
            this.encounters = json.map(e => new Encounter(e));
        } catch (e) {
            console.error('Failed to load encounters', e);
            this.encounters = [];
        }
    },

    updateName() {
        const milestone = this.milestones
            .slice()
            .reverse()
            .find(m => this.level >= m.level);
        const name = milestone ? milestone.name : this.milestones[0].name;
        const el = document.getElementById('encounter-location');
        if (el) {
            el.textContent = `${name} (Level ${this.level})`;
        }
    },

    incrementLevel() {
        this.level += 1;
        State.encounterLevel = this.level;
        this.updateName();
    },

    init() {
        this.container = document.getElementById('adventure-slots');
        if (!this.container) return;
        this.level = State.encounterLevel || 0;
        this.updateName();
        this.populateSlots();
    },

    randomEncounter() {
        if (!this.encounters.length) return null;
        const weights = this.encounters.map(e => this.rarityWeights[e.rarity] || 1);
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < this.encounters.length; i++) {
            r -= weights[i];
            if (r <= 0) return this.encounters[i];
        }
        return this.encounters[this.encounters.length - 1];
    },

    populateSlots() {
        for (let i = 0; i < State.adventureSlots.length; i++) {
            State.adventureSlots[i].encounter = null;
            State.adventureSlots[i].duration = 1;
            State.adventureSlots[i].progress = 0;
            State.adventureSlots[i].active = false;
            updateAdventureSlotUI(i);
        }
    },

    resolve(encounter) {
        const chance = encounter.getLootChance();
        if (Math.random() < chance) {
            Log.add(`You found loot during ${encounter.name}!`);
        }
    }
};
