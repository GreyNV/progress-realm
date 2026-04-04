// Legacy compatibility shim.
// The live browser runtime installs `Lang` from `src/app/legacyGlobals.ts`.
// This file remains for repository compatibility and direct test references.

const Lang = (typeof window !== 'undefined' && window.Lang) || {
    current: 'en',
    data: {},
    async load(lang) {
        if (lang === 'en') {
            this.current = 'en';
            this.data = {};
            return;
        }
        try {
            const registry = typeof window !== 'undefined' ? window.__appContent : null;
            this.data = registry && typeof registry.getLanguage === 'function'
                ? await registry.getLanguage(lang)
                : await (await fetch(`data/lang/${lang}.json`)).json();
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
    statDesc(key) {
        return this.data.statDescriptions && this.data.statDescriptions[key] || null;
    },
    resource(key) {
        return this.data.resources && this.data.resources[key] || null;
    },
    resourceDesc(key) {
        return this.data.resourceDescriptions && this.data.resourceDescriptions[key] || null;
    },
    prestigeDesc(key) {
        return this.data.prestigeDescriptions && this.data.prestigeDescriptions[key] || null;
    },
    effect(key) {
        return this.data.effects ? this.data.effects[key] || null : null;
    },
    story(key) {
        return this.data.story && this.data.story[key] || null;
    },
    log(key, params = {}) {
        if (!this.data.log) return null;
        const text = this.data.log[key];
        if (!text) return null;
        return text.replace(/\{(\w+)\}/g, (m, p) => params[p] !== undefined ? params[p] : m);
    },
    translateUI() {},
    applyToActions() {},
    applyToItems() {},
    applyToEncounters() {},
    applyToLocations() {}
};

if (typeof module !== 'undefined') {
    module.exports = Lang;
}
