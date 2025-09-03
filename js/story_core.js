// Misc story-related helpers
function applyDarkMode() {
    document.body.dataset.theme = State.darkMode ? 'dark' : 'light';
    const chk = document.getElementById('dark-mode-toggle');
    if (chk) chk.checked = State.darkMode;
}

function openSettings() {
    PubSub.publish('modal:open', 'settings-modal');
}

function closeSettings() {
    PubSub.publish('modal:close', 'settings-modal');
}

function openInventoryFilter() {
    PubSub.publish('modal:open', 'inventory-filter-modal');
    const chk = document.getElementById('hide-rarity-toggle');
    const sel = document.getElementById('hide-rarity-select');
    if (chk) chk.checked = State.hideRarityEnabled;
    if (sel) sel.value = State.hideBelowRarity;
}

function closeInventoryFilter() {
    PubSub.publish('modal:close', 'inventory-filter-modal');
}

if (typeof module !== 'undefined') {
    module.exports = { applyDarkMode, openSettings, closeSettings, openInventoryFilter, closeInventoryFilter };
}

