// Tab UI controller separated from main script
const TabManager = {
    tabs: [],
    buttons: {},
    activeSections: {},
    _sectionButtons: {},
    icons: {
        routines: '🏠',
        adventure: '⚔️',
        character: '🧍',
        inventory: '🎒',
        automation: '🤖',
        chip: '💡'
    },
    load(tabData) {
        this.tabs = Array.isArray(tabData) ? tabData : [];
    },
    init() {
        this.header = document.getElementById('tab-headers');
        if (State.healerGoneSeen) {
            const adv = this.tabs.find(t => t.id === 'adventure');
            if (adv) adv.hidden = false;
        }
        // Show the chip tab if the bandit ambush story event was cleared
        if (State.banditsAmbushSeen) {
            const chip = this.tabs.find(t => t.id === 'chip');
            if (chip) chip.hidden = false;
        }
        this.tabs.forEach(tab => {
            if (tab.hidden) return;
            this._createButton(tab);
        });
        this.header.addEventListener('click', e => {
            if (!e.target.dataset.tab) return;
            this.showTab(e.target.dataset.tab);
        });
        const first = this.tabs.find(t => !t.hidden);
        if (first) this.showTab(first.id);
    },
    _createButton(tab) {
        const btn = document.createElement('button');
        btn.dataset.tab = tab.id;
        btn.dataset.i18n = tab.name;
        this.buttons[tab.id] = btn;
        if (tab.locked) btn.disabled = true;
        this.header.appendChild(btn);
        this._updateButton(tab);
        this._initSections(tab);
    },
    _updateButton(tab) {
        const btn = this.buttons[tab.id];
        if (!btn) return;
        const name = Lang.ui(tab.name) || tab.name;
        const locked = Lang.ui('Locked') || 'Locked';
        btn.title = tab.locked ? `${name} (${locked})` : name;
        const icon = this.icons[tab.id] || name[0];
        btn.textContent = tab.locked ? `${icon}🔒` : icon;
    },
    _updateSectionButton(section, btn) {
        const name = Lang.ui(section.name) || section.name;
        const locked = Lang.ui('Locked') || 'Locked';
        btn.textContent = section.locked ? `${name} (${locked})` : name;
    },
    translate() {
        this.tabs.forEach(tab => {
            this._updateButton(tab);
            if (tab.sections) {
                Object.entries(this._sectionButtons[tab.id] || {}).forEach(([id, btn]) => {
                    const sec = tab.sections.find(s => s.id === id);
                    if (sec) this._updateSectionButton(sec, btn);
                });
            }
        });
    },
    unlockTab(id) {
        const tab = this.tabs.find(t => t.id === id);
        if (!tab || !tab.hidden) return;
        tab.hidden = false;
        this._createButton(tab);
    },
    _initSections(tab) {
        if (!tab.sections) return;
        const content = document.querySelector(`.tab-content[data-tab="${tab.id}"]`);
        if (!content) return;
        const header = content.querySelector('.section-headers');
        if (!header) return;
        this._sectionButtons[tab.id] = {};
        header.innerHTML = '';
        tab.sections.forEach(sec => {
            if (sec.hidden) return;
            const btn = document.createElement('button');
            btn.dataset.tab = tab.id;
            btn.dataset.section = sec.id;
            btn.dataset.i18n = sec.name;
            if (sec.locked) btn.disabled = true;
            header.appendChild(btn);
            this._sectionButtons[tab.id][sec.id] = btn;
            this._updateSectionButton(sec, btn);
        });
        header.addEventListener('click', e => {
            if (!e.target.dataset.section) return;
            this.showSection(tab.id, e.target.dataset.section);
        });
        const first = tab.sections.find(s => !s.hidden);
        if (first) this.showSection(tab.id, first.id);
    },
    showTab(id) {
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.toggle('hidden', el.dataset.tab !== id);
        });
        document.querySelectorAll('#tab-headers button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === id);
        });
        // sections are now collapsible blocks rather than sub-navigation
        if (id === 'character' && typeof CharacterUI !== 'undefined') {
            // refresh character display when the tab becomes active
            CharacterUI.updateSlots();
            CharacterUI.updateItems();
        }
    },
    showSection(tabId, sectionId) {
        this.activeSections[tabId] = sectionId;
        const content = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
        if (!content) return;
        const sectionEl = content.querySelector(`.tab-section[data-section="${sectionId}"]`);
        if (!sectionEl) return;
        content.querySelectorAll('.tab-section').forEach(sec => {
            sec.classList.toggle('hidden', sec.dataset.section !== sectionId);
        });
        const header = content.querySelector('.section-headers');
        if (!header) return;
        header.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });
    }
};
