const AdventureUI = {
    init() {
        this.startBtn = document.getElementById('adventure-start-btn');
        this.content = document.getElementById('adventure-content');
        if (!this.startBtn || !this.content) return;
        this.startBtn.addEventListener('click', () => {
            AdventureEngine.start();
            this.update();
        });
        const returnBtn = document.getElementById('return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                AdventureEngine.cancel();
                this.update();
            });
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('adventure:started', () => this.update());
            PubSub.subscribe('adventure:stopped', () => this.update());
        }
        this.update();
    },
    update() {
        const adv = AdventureManager.getCurrent();
        if (this.startBtn) this.startBtn.textContent = adv.name;
        const active = AdventureEngine.active;
        this.startBtn.classList.toggle('hidden', active);
        this.content.classList.toggle('hidden', !active);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { AdventureUI };
}
