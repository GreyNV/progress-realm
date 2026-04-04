function getScope(): any {
    return globalThis as any;
}

function publishModal(eventName: string, modalId: string): void {
    getScope().PubSub?.publish(eventName, modalId);
}

export function toggleLeftPanel(): void {
    const scope = getScope();
    const body = document.body;
    body.classList.toggle("left-collapsed");
    const button = document.getElementById("toggle-left");
    if (button) {
        button.textContent = body.classList.contains("left-collapsed")
            ? (scope.Lang?.ui?.("Show Stats") || "Show Stats")
            : (scope.Lang?.ui?.("Hide Stats") || "Hide Stats");
    }
}

export function applyDarkMode(): void {
    const scope = getScope();
    document.body.classList.toggle("dark", !!scope.State?.darkMode);
    const toggle = document.getElementById("dark-mode-toggle") as HTMLInputElement | null;
    if (toggle) {
        toggle.checked = !!scope.State?.darkMode;
    }
}

export function openSettings(): void {
    publishModal("modal:open", "settings-modal");
}

export function closeSettings(): void {
    publishModal("modal:close", "settings-modal");
}

export function openInventoryFilter(): void {
    const scope = getScope();
    publishModal("modal:open", "inventory-filter-modal");
    const checkbox = document.getElementById("hide-rarity-toggle") as HTMLInputElement | null;
    const select = document.getElementById("hide-rarity-select") as HTMLSelectElement | null;
    if (checkbox) {
        checkbox.checked = !!scope.State?.hideRarityEnabled;
    }
    if (select) {
        select.value = scope.State?.hideBelowRarity || "rare";
    }
}

export function closeInventoryFilter(): void {
    publishModal("modal:close", "inventory-filter-modal");
}
