class Encounter {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description || '';
        this.image = data.image || '';
    }
}

const EncounterGenerator = {
    encounters: [],
    container: null,

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

    init() {
        this.container = document.getElementById('adventure-slots');
        if (!this.container) return;
        this.populateSlots();
    },

    randomEncounter() {
        if (!this.encounters.length) return null;
        const idx = Math.floor(Math.random() * this.encounters.length);
        return this.encounters[idx];
    },

    populateSlots() {
        for (let i = 0; i < State.adventureSlots.length; i++) {
            const encounter = this.randomEncounter();
            State.adventureSlots[i].encounter = encounter;
            updateAdventureSlotUI(i);
        }
    }
};
