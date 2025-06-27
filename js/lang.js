// Agents: Localization helper. UI text and descriptions funnel through this
// object so translations can be swapped at runtime. Game logic should remain
// language agnostic and pull strings via `Lang.*` methods.
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
    stat(key) {
        return this.data.stats && this.data.stats[key] || null;
    },
    resource(key) {
        return this.data.resources && this.data.resources[key] || null;
    },
    story(key) {
        return this.data.story && this.data.story[key] || null;
    },
    log(key, params = {}) {
        if (!this.data.log) return null;
        let text = this.data.log[key];
        if (!text) return null;
        return text.replace(/\{(\w+)\}/g, (m, p) => params[p] !== undefined ? params[p] : m);
    },
    translateUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const text = this.ui(el.dataset.i18n);
            if (!text) return;
            if (el.childNodes.length > 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                el.childNodes[0].textContent = text;
            } else {
                el.textContent = text;
            }
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
