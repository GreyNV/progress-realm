function getScope(): any {
    return globalThis as any;
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildModifierItems(node: HTMLElement | null, additions: number[], multipliers: number[], emptyLabel: string): void {
    if (!node) {
        return;
    }
    node.innerHTML = "";
    if (!additions.length && !multipliers.length) {
        const empty = document.createElement("li");
        empty.textContent = emptyLabel;
        node.appendChild(empty);
        return;
    }
    additions.forEach((value) => {
        const item = document.createElement("li");
        item.textContent = `+${Number(value).toFixed(1)}`;
        node.appendChild(item);
    });
    multipliers.forEach((value) => {
        const item = document.createElement("li");
        item.textContent = `x${Number(value).toFixed(2)}`;
        node.appendChild(item);
    });
}

export function createResourceInspector() {
    return {
        buildGroup(containerId: string, group: string, keys: string[]) {
            const list = document.getElementById(containerId);
            if (!list) {
                return;
            }
            list.innerHTML = "";
            keys.forEach((key) => {
                const entry = this.createEntry(group, key);
                if (entry) {
                    list.appendChild(entry);
                }
            });
        },

        createEntry(group: string, key: string) {
            const li = document.createElement("li");
            li.className = "inspector-entry";
            li.dataset.group = group;
            li.dataset.key = key;

            const button = document.createElement("button");
            button.className = "inspector-toggle";
            button.type = "button";

            const label = document.createElement("span");
            label.className = `${group}-label inspector-label`;
            label.dataset.key = key;
            label.id = `${group}-${key}-label`;
            label.textContent = this.getLabel(group, key);
            button.appendChild(label);

            const valueWrap = document.createElement("span");
            valueWrap.className = "inspector-value";
            valueWrap.appendChild(this.buildValueContent(group, key));
            button.appendChild(valueWrap);

            li.appendChild(button);

            const detail = document.createElement("div");
            detail.className = "inspector-detail hidden";

            const description = document.createElement("p");
            description.className = "inspector-desc";
            description.id = `${group}-${key}-desc`;
            detail.appendChild(description);

            const softcap = document.createElement("p");
            softcap.className = "inspector-softcap";
            softcap.id = `${group}-${key}-softcap`;
            detail.appendChild(softcap);

            const modifiers = document.createElement("ul");
            modifiers.className = "inspector-mods";
            modifiers.id = `${group}-${key}-mods`;
            detail.appendChild(modifiers);

            li.appendChild(detail);
            button.addEventListener("click", () => {
                li.classList.toggle("expanded");
                detail.classList.toggle("hidden");
            });

            this.updateEntry(group, key);
            return li;
        },

        buildValueContent(group: string, key: string) {
            const scope = getScope();
            if (group === "stats") {
                const wrapper = document.createElement("span");
                wrapper.className = "stat-inline";
                wrapper.insertAdjacentHTML(
                    "beforeend",
                    `<span id="stat-${key}-level">x1.00</span> ` +
                    `| <span id="stat-${key}-exp">0</span>/<span id="stat-${key}-cap">0</span> XP ` +
                    `(<span id="stat-${key}-delta" class="delta">0</span>/s)`
                );
                return wrapper;
            }

            if (group === "resources") {
                const wrapper = document.createElement("span");
                wrapper.className = "resource-inline";
                wrapper.textContent = scope.Lang?.ui?.("No resource economy") || "No resource economy";
                return wrapper;
            }

            if (group === "prestige") {
                const wrapper = document.createElement("span");
                wrapper.insertAdjacentHTML(
                    "beforeend",
                    `<span id="prestige-${key}">0</span> ` +
                    `<span id="prestige-${key}-gain" class="delta">(+0)</span>`
                );
                return wrapper;
            }

            const fallback = document.createElement("span");
            fallback.textContent = "0";
            return fallback;
        },

        getLabel(group: string, key: string) {
            const scope = getScope();
            if (group === "stats") {
                return scope.Lang?.stat?.(key) || capitalize(key);
            }
            if (group === "prestige") {
                return scope.Lang?.resource?.(key) || scope.Lang?.stat?.(key) || capitalize(key);
            }
            return scope.Lang?.resource?.(key) || capitalize(key);
        },

        getDescription(group: string, key: string) {
            const scope = getScope();
            if (group === "stats") {
                return scope.Lang?.statDesc?.(key) || scope.State?.statDescriptions?.[key] || "";
            }
            if (group === "prestige") {
                return scope.Lang?.prestigeDesc?.(key) || scope.State?.prestigeDescriptions?.[key] || "";
            }
            return scope.Lang?.resourceDesc?.(key) || scope.State?.resourceDescriptions?.[key] || "";
        },

        getSoftcap(group: string, key: string) {
            const scope = getScope();
            if (group === "prestige") {
                return Infinity;
            }
            if (group === "stats") {
                return scope.getStatMax(key);
            }
            if (typeof scope.SoftCapSystem !== "undefined" && typeof scope.SoftCapSystem.getResourceCap === "function") {
                return scope.SoftCapSystem.getResourceCap(key);
            }
            return scope.getResourceMax(key);
        },

        updateEntry(group: string, key: string) {
            const scope = getScope();
            const description = document.getElementById(`${group}-${key}-desc`);
            const softcap = document.getElementById(`${group}-${key}-softcap`);
            const modifiers = document.getElementById(`${group}-${key}-mods`);
            const label = document.getElementById(`${group}-${key}-label`);
            const record = group === "stats" ? scope.State?.stats?.[key] : scope.State?.resources?.[key];

            if (label) {
                label.textContent = this.getLabel(group, key);
            }
            if (description) {
                description.textContent = this.getDescription(group, key);
            }
            if (softcap) {
                const cap = this.getSoftcap(group, key);
                if (group === "stats") {
                    softcap.textContent = `${scope.Lang?.ui?.("Next Level") || "Next Level"}: ${Number(cap).toFixed(1)} XP`;
                } else {
                    const value = Number.isFinite(cap) ? cap.toFixed(1) : "∞";
                    softcap.textContent = `${scope.Lang?.ui?.("Softcap") || "Softcap"}: ${value}`;
                }
            }
            if (modifiers) {
                const additions = Array.isArray(record?.maxAdditions) ? record.maxAdditions.filter((value: number) => value) : [];
                const multipliers = Array.isArray(record?.maxMultipliers)
                    ? record.maxMultipliers.filter((value: number) => value && value !== 1)
                    : [];
                buildModifierItems(modifiers, additions, multipliers, scope.Lang?.ui?.("No active modifiers") || "No active modifiers");
            }
        },

        translateGroup(group: string, keys: string[]) {
            keys.forEach((key) => this.updateEntry(group, key));
        }
    };
}
