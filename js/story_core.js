// Compatibility shim. The browser runtime installs these helpers from `src/app`.
function getScope() {
    return globalThis;
}

function getInstalled(name) {
    const scope = getScope();
    return typeof scope[name] === 'function' ? scope[name].bind(scope) : null;
}

function toggleLeftPanel() {
    const installed = getInstalled('toggleLeftPanel');
    if (installed && installed !== toggleLeftPanel) return installed();
}

function applyDarkMode() {
    const installed = getInstalled('applyDarkMode');
    if (installed && installed !== applyDarkMode) return installed();
}

function openSettings() {
    const installed = getInstalled('openSettings');
    if (installed && installed !== openSettings) return installed();
}

function closeSettings() {
    const installed = getInstalled('closeSettings');
    if (installed && installed !== closeSettings) return installed();
}

function openInventoryFilter() {
    const installed = getInstalled('openInventoryFilter');
    if (installed && installed !== openInventoryFilter) return installed();
}

function closeInventoryFilter() {
    const installed = getInstalled('closeInventoryFilter');
    if (installed && installed !== closeInventoryFilter) return installed();
}

if (typeof module !== 'undefined') {
    module.exports = {
        toggleLeftPanel,
        applyDarkMode,
        openSettings,
        closeSettings,
        openInventoryFilter,
        closeInventoryFilter
    };
}
