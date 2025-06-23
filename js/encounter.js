class Encounter {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || '';
        this.rarity = data.rarity || 'common';
        this.category = data.category || 'strength';
        this.baseDuration = data.baseDuration || 5;
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
}

const EncounterGenerator = {
    encounters: [],
    container: null,
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

        const weights = this.encounters.map(e => this.rarityWeights[e.rarity] || 1);
        for (let i = 0; i < this.encounters.length; i++) {
            if (r <= 0) return this.encounters[i];
        return this.encounters[this.encounters.length - 1];
            console.error('Failed to load encounters', e);
            this.encounters = [];
        }
    },

    init() {
        this.container = document.getElementById('adventure-slots');
        if (!this.container) return;
        this.populateSlots();
        this.updateName();
        this.updateUI();
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
            const encounter = this.randomEncounter();
            State.adventureSlots[i].encounter = encounter;
            State.adventureSlots[i].duration = encounter ? encounter.getDuration() : 1;
            State.adventureSlots[i].progress = 0;
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
