// Agents: UI helper for the character image in the Character tab. Character art updates
// when equipment changes. Purely cosmetic and not tied into game mechanics.
const CharacterBackground = {
    baseImage: 'assets/char/new_char.png',
    equippedImage: 'assets/char/leather+woodshield+spear.png',
    fullGearImage: 'assets/char/set+sword.png',
    container: null,
    init() {
        this.container = document.querySelector('.tab-section[data-section="character"] .character-layout');
        if (!this.container) return;
        this.container.style.backgroundImage = `url(${this.baseImage})`;
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('equipment:changed', (_, equipped) => this.update(equipped));
        }
    },
    update(equipped = []) {
        if (!this.container) return;
        const equippedSet = new Set(equipped);
        const fullGear = ['leather_armor', 'wooden_shield', 'iron_sword', 'gem'];
        const spearSet = ['leather_armor', 'wooden_shield', 'stone_spear'];

        if (fullGear.every(item => equippedSet.has(item))) {
            this.container.style.backgroundImage = `url(${this.fullGearImage})`;
        } else if (spearSet.every(item => equippedSet.has(item))) {
            this.container.style.backgroundImage = `url(${this.equippedImage})`;
        } else {
            this.container.style.backgroundImage = `url(${this.baseImage})`;
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { CharacterBackground };
}
