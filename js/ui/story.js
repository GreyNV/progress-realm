// Compatibility shim. The browser runtime installs `StoryUI` from `src/ui`.
const StoryUI = globalThis.StoryUI || {
    active: false,
    init() {
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('story:show', data => {
                this.show(data.text, data.image, data.onClose);
            });
        }
    },
    show(text, image, onClose) {
        if (this.active) return;
        this.active = true;
        const modal = document.getElementById('story-modal');
        const textEl = document.getElementById('story-text');
        const imageEl = document.getElementById('story-image');
        textEl.textContent = text;
        imageEl.innerHTML = '';
        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.alt = '';
            img.loading = 'lazy';
            imageEl.appendChild(img);
        }
        modal.classList.remove('hidden');
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('modal:open', 'story-modal');
        }
        const close = () => {
            modal.classList.add('hidden');
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('modal:close', 'story-modal');
            }
            document.getElementById('story-close').removeEventListener('click', close);
            this.active = false;
            Log.add(text);
            if (onClose) onClose();
        };
        document.getElementById('story-close').addEventListener('click', close);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { StoryUI };
}
