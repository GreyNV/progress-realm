const CharacterBackground = {
    baseImage: 'assets/char/new_char.png',
    equippedImage: 'assets/char/leather+woodshield+spear.png',
    fullGearImage: 'assets/char/set+sword.png',
    container: null,
    init() {
        this.container = document.getElementById('left');
        this.update();
    },
    update() {
        if (!this.container) return;
        const fullGear = ['leather_armor', 'wooden_shield', 'iron_sword', 'gem'];
        const spearSet = ['leather_armor', 'wooden_shield', 'stone_spear'];

        if (fullGear.every(item => Inventory.hasItem(item))) {
            this.container.style.backgroundImage = `url(${this.fullGearImage})`;
        } else if (spearSet.every(item => Inventory.hasItem(item))) {
            this.container.style.backgroundImage = `url(${this.equippedImage})`;
        } else {
            this.container.style.backgroundImage = `url(${this.baseImage})`;
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { CharacterBackground };
}
