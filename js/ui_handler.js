const UIHandler = {
    async init() {
        await this.loadTabs();
        if (typeof CharacterUI !== 'undefined') {
            CharacterUI.init();
        }
    },
    async loadTabs() {
        try {
            const res = await fetch('data/ui.json');
            const json = await res.json();
            if (json.tabs && Array.isArray(json.tabs)) {
                TabManager.load(json.tabs);
            }
        } catch (e) {
            console.error('Failed to load UI layout', e);
            TabManager.load([]);
        }
    }
};
