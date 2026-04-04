function buildActionTooltip(action) {
    return window.__uiModules.widgets.buildActionTooltip(action);
}

function createActionElement(action) {
    return window.__uiModules.widgets.createActionElement(action);
}

function setupSlots() {
    return window.__uiModules.widgets.setupSlots();
}

function setupAdventureSlots() {
    return window.__uiModules.widgets.setupAdventureSlots();
}

function setupInventorySlots() {
    return window.__uiModules.widgets.setupInventorySlots();
}

function setupDragAndDrop() {
    return window.__uiModules.widgets.setupDragAndDrop();
}

function updateTaskList() {
    return window.__uiModules.widgets.updateTaskList();
}

function updateSlotUI(i) {
    return window.__uiModules.widgets.updateSlotUI(i);
}

function updateAdventureSlotUI(i) {
    return window.__uiModules.widgets.updateAdventureSlotUI(i);
}

if (typeof module !== 'undefined') {
    module.exports = {
        buildActionTooltip,
        createActionElement,
        setupSlots,
        setupAdventureSlots,
        setupInventorySlots,
        setupDragAndDrop,
        updateTaskList,
        updateSlotUI,
        updateAdventureSlotUI
    };
}
