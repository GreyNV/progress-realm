const Lang = {
    current: 'en',
    data: {},
    async load(lang) {
        if (lang === 'en') {
            this.current = 'en';
            this.data = {};
            return;
        }
        try {
            const res = await fetch(`data/lang/${lang}.json`);
            this.data = await res.json();
            this.current = lang;
        } catch (e) {
            console.error('Lang load failed', e);
            this.data = {};
            this.current = 'en';
        }
    },
    ui(key) {
        return this.data.ui && this.data.ui[key] || null;
    },
    translateUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const text = this.ui(el.dataset.i18n);
            if (text) el.textContent = text;
        });
    },
    applyToActions(actions) {
        if (!this.data.actions) return;
        Object.values(actions).forEach(a => {
            const t = this.data.actions[a.id];
            if (!t) return;
            if (t.name) a.name = t.name;
            if (t.description) a.description = t.description;
        });
    },
    applyToItems(items) {
        if (!this.data.items) return;
        items.forEach(i => {
            const t = this.data.items[i.id];
            if (!t) return;
            if (t.name) i.name = t.name;
            if (t.description) i.description = t.description;
        });
    },
    applyToEncounters(encs) {
        if (!this.data.encounters) return;
        encs.forEach(e => {
            const t = this.data.encounters[e.id];
            if (!t) return;
            if (t.name) e.name = t.name;
            if (t.description) e.description = t.description;
        });
    },
    applyToLocations(milestones) {
        if (!this.data.locations) return;
        milestones.forEach(m => {
            const t = this.data.locations[m.name];
            if (t) m.name = t;
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = Lang;
}
