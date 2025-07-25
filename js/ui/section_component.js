const SectionComponent = {
    initAll() {
        document.querySelectorAll('.tab-section').forEach(el => {
            const type = el.dataset.type;
            if (type === 'buttons') {
                this._initButtons(el);
            }
        });
    },
    _initButtons(el) {
        const header = el.querySelector('h2');
        const body = el.querySelector('.section-body');
        if (!header || !body) return;
        header.addEventListener('click', () => {
            body.classList.toggle('hidden');
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = SectionComponent;
}
