const CharacterBackground = {
    baseImage: 'assets/char/new_char.png',
    equippedImage: 'assets/char/leather+woodshield+spear.png',
    container: null,
    init() {
        this.container = document.getElementById('left');
        this.update();
    },
    update() {
        if (!this.container) return;
        if (Inventory.hasItem('leather_armor') &&
            Inventory.hasItem('wooden_shield') &&
            Inventory.hasItem('stone_spear')) {
            this.container.style.backgroundImage = `url(${this.equippedImage})`;
        } else {
            this.container.style.backgroundImage = `url(${this.baseImage})`;
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { CharacterBackground };
}
