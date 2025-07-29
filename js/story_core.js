// Misc story-related helpers
function toggleLeftPanel() {
    const body = document.body;
    body.classList.toggle('left-collapsed');
    const btn = document.getElementById('toggle-left');
    if (btn) {
        btn.textContent = body.classList.contains('left-collapsed') ?
            (Lang.ui('Show Stats') || 'Show Stats') :
            (Lang.ui('Hide Stats') || 'Hide Stats');
    }
}

function applyDarkMode() {
    document.body.classList.toggle('dark', State.darkMode);
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

function showRightPanel(panel) {
    const logPanel = document.getElementById('log-panel');
    const activePanel = document.getElementById('active-panel');
    const buttons = document.querySelectorAll('#right .right-tabs button');
    if (!logPanel || !activePanel) return;
    logPanel.classList.toggle('hidden', panel !== 'log');
    activePanel.classList.toggle('hidden', panel !== 'active');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.panel === panel);
    });
}
