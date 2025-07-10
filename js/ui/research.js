const ResearchUI = {
    listEl: null,
    init() {
        this.listEl = document.getElementById('research-list');
        if (!this.listEl) return;
        this.render();
        if (typeof PubSub !== 'undefined') {
            PubSub.subscribe('research:updated', () => this.render());
        }
    },
    render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';
        ResearchSystem.research.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r.name;
            li.dataset.tooltip = `${r.description}\nCost: ${r.cost}`;
            if (State.researchCompleted.includes(r.id) || r.done) {
                li.classList.add('locked');
            } else {
                li.addEventListener('click', () => ResearchSystem.purchase(r.id));
            }
            this.listEl.appendChild(li);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = { ResearchUI };
}
