const SectionComponent = {
    initAll() {
        document.querySelectorAll('.tab-section').forEach(el => {
            const type = el.dataset.type;
            if (type === 'buttons') {
                this._initButtons(el);
            }
        });
        document.querySelectorAll('.collapsible-section').forEach(el => {
            this._initCollapsible(el);
        });
    },
    _initButtons(el) {
        const header = el.querySelector('h2');
        const body = el.querySelector('.section-body');
        if (!header || !body) return;
        header.addEventListener('click', () => {
            body.classList.toggle('hidden');
        });
    },
    _initCollapsible(el) {
        const header = el.querySelector('.section-header');
        const body = el.querySelector('.section-body');
        if (!header || !body) return;
        header.addEventListener('click', () => {
            const hidden = body.classList.toggle('hidden');
            header.classList.toggle('collapsed', hidden);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = SectionComponent;
}
