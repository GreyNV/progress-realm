export function createWidgetUi() {
    const scope = globalThis as any;
    const formatDuration = (seconds: number) => {
        const safeSeconds = Math.max(0, Number(seconds || 0));
        if (safeSeconds < 60) {
            return `${safeSeconds.toFixed(1)}s`;
        }
        if (safeSeconds < 3600) {
            return `${(safeSeconds / 60).toFixed(1)}m`;
        }
        return `${(safeSeconds / 3600).toFixed(1)}h`;
    };
    const getActionEffectiveDuration = (action: any) => {
        const routineMultiplier = scope.getActionSpeedMultiplier ? scope.getActionSpeedMultiplier(action) : 1;
        const duration = Number(action?.baseDuration || 10);
        return duration / Math.max(Number(routineMultiplier || 1), 0.2);
    };
    const getActionRemainingDuration = (slot: any, action: any) => {
        return getActionEffectiveDuration(action) * Math.max(0, 1 - Number(slot?.progress || 0));
    };
    const getAdventureRemainingDuration = (slot: any) => {
        return Number(slot?.duration || 1) * Math.max(0, 1 - Number(slot?.progress || 0));
    };
    const getStatReferenceHtml = (statFactors: Record<string, any> = {}, limit = 3) => {
        if (!scope.getStatChipsHtml) {
            return "";
        }
        const chips = scope.getStatChipsHtml(statFactors, limit);
        return chips ? `<div class="stat-chip-row">${chips}</div>` : "";
    };
    return {
        buildActionTooltip(action: any) {
            const routineMultiplier = scope.getActionStatOnlyMultiplier ? scope.getActionStatOnlyMultiplier(action) : 1;
            const duration = Number(action.baseDuration || 10);
            const effectiveDuration = getActionEffectiveDuration(action);
            const parts = [`<strong>${action.name}</strong> - x${Number(routineMultiplier || 1).toFixed(2)}`];
            const effects: string[] = [];
            parts.push(`<strong>${scope.Lang?.ui("Cycle Time") || "Cycle Time"}:</strong> ${duration.toFixed(0)}s`);
            parts.push(`<strong>${scope.Lang?.ui("Effective Cycle") || "Effective Cycle"}:</strong> ${effectiveDuration.toFixed(1)}s`);
            if (action.baseYield) {
                if (action.baseYield.stats) {
                    for (const [stat, value] of Object.entries(action.baseYield.stats)) {
                        const name = scope.Lang?.stat(stat) || scope.capitalize(stat);
                        effects.push(`+${(duration * Number(value || 0)).toFixed(1)} ${name} XP`);
                    }
                }
                if (action.baseYield.resources) {
                    for (const [resource, value] of Object.entries(action.baseYield.resources)) {
                        const name = scope.Lang?.resource(resource) || scope.capitalize(resource);
                        const sign = Number(value) >= 0 ? "+" : "";
                        effects.push(`${sign}${value} ${name}`);
                    }
                }
            }
            if (effects.length) {
                parts.push(`<strong>${scope.Lang?.ui("Effects") || "Effects"}:</strong> ${effects.join(", ")}`);
            }
            if (action.statFactors && Object.keys(action.statFactors).length) {
                const factors = Object.entries(action.statFactors).map(([stat, factor]: [string, any]) => {
                    const name = scope.Lang?.stat(stat) || scope.capitalize(stat);
                    const speed = Number(factor.speed || 0);
                    const output = Number(factor.output || 0);
                    return `${name} (${speed.toFixed(2)} speed, ${output.toFixed(2)} output)`;
                });
                parts.push(`<strong>${scope.Lang?.ui("Scaled By") || "Scaled By"}:</strong> ${factors.join(", ")}`);
            }
            return parts.join("<br>");
        },
        createActionElement(action: any) {
            if (action.hidden) return null;
            const li = document.createElement("li");
            li.innerHTML = `
                <div class="task-card-copy">
                    <strong class="task-card-title">${action.name}</strong>
                    <span class="task-card-meta">${scope.Lang?.ui("Completion Time") || "Completion Time"}: ${formatDuration(getActionEffectiveDuration(action))}</span>
                    ${getStatReferenceHtml(action.statFactors)}
                </div>
            `;
            li.dataset.taskId = action.id;
            li.dataset.tooltip = this.buildActionTooltip(action);
            if (action.locked) {
                li.classList.add("locked");
            } else {
                li.setAttribute("draggable", "true");
                li.addEventListener("dragstart", (event) => {
                    li.classList.add("dragging");
                    event.dataTransfer?.setData("text/plain", action.id);
                });
                li.addEventListener("dragend", () => li.classList.remove("dragging"));
                li.addEventListener("click", () => {
                    let index = scope.State.slots.findIndex((slot: any) => slot.actionId === scope.State.defaultActionId);
                    if (index === -1) index = 0;
                    scope.ActionEngine.start(index, action.id);
                });
            }
            return li;
        },
        setupSlots() {
            const container = document.getElementById("slots");
            if (!container) return;
            container.innerHTML = "";
            if (!Array.isArray(scope.State.slots)) scope.setState("slots", []);
            if (scope.State.slotCount === undefined) scope.setState("slotCount", scope.State.slots.length);
            while (scope.State.slots.length < scope.State.slotCount) {
                scope.pushState(["slots"], { actionId: scope.State.defaultActionId, progress: 0, blocked: false, text: "", queuedActionId: null, queue: null });
            }
            if (scope.State.slots.length > scope.State.slotCount) {
                scope.setState("slots", scope.State.slots.slice(0, scope.State.slotCount));
            }
            for (let i = 0; i < scope.State.slotCount; i += 1) {
                const slot = new scope.BaseSlot();
                const slotEl = slot.el;
                slotEl.dataset.slot = String(i);
                slotEl.dataset.tooltip = "Drag an action here";
                container.appendChild(slotEl);
                this.updateSlotUI(i);
            }
        },
        setupAdventureSlots() {
            const container = document.getElementById("adventure-slots");
            if (!container) return;
            container.innerHTML = "";
            if (!Array.isArray(scope.State.adventureSlots)) scope.setState("adventureSlots", []);
            if (scope.State.adventureSlotCount === undefined) scope.setState("adventureSlotCount", scope.State.adventureSlots.length);
            while (scope.State.adventureSlots.length < scope.State.adventureSlotCount) {
                scope.pushState(["adventureSlots"], { text: "", progress: 0, duration: 1, encounter: null, active: false, queue: null });
            }
            if (scope.State.adventureSlots.length > scope.State.adventureSlotCount) {
                scope.setState("adventureSlots", scope.State.adventureSlots.slice(0, scope.State.adventureSlotCount));
            }
            for (let i = 0; i < scope.State.adventureSlotCount; i += 1) {
                if (scope.State.adventureSlots[i].active === undefined) scope.State.adventureSlots[i].active = false;
                if (scope.State.adventureSlots[i].queue === undefined) scope.State.adventureSlots[i].queue = null;
                const slot = new scope.BaseSlot();
                const slotEl = slot.el;
                slotEl.dataset.slot = String(i);
                container.appendChild(slotEl);
                this.updateAdventureSlotUI(i);
            }
        },
        setupInventorySlots() {
            scope.InventoryUI?.update();
        },
        setupDragAndDrop() {
            document.querySelectorAll("#slots .slot").forEach((slotEl) => {
                slotEl.addEventListener("dragover", (event) => event.preventDefault());
                slotEl.addEventListener("drop", (event) => {
                    const dragEvent = event as DragEvent;
                    event.preventDefault();
                    const id = dragEvent.dataTransfer?.getData("text/plain");
                    const index = parseInt((slotEl as HTMLElement).dataset.slot || "0", 10);
                    scope.ActionEngine.start(index, id);
                });
                slotEl.addEventListener("click", () => {
                    if (!scope.selectedActionId) return;
                    const index = parseInt((slotEl as HTMLElement).dataset.slot || "0", 10);
                    scope.ActionEngine.start(index, scope.selectedActionId);
                });
            });
        },
        updateTaskList() {
            const list = document.getElementById("task-list");
            if (!list) return;
            Object.values(scope.actions || {}).forEach((action: any) => {
                const li = list.querySelector(`li[data-task-id="${action.id}"]`) as HTMLElement | null;
                if (action.hidden) {
                    if (li) li.remove();
                    if (scope.selectedActionId === action.id) scope.selectedActionId = null;
                    return;
                }
                if (!li) {
                    const el = this.createActionElement(action);
                if (el) list.appendChild(el);
                    return;
                }
                li.innerHTML = `
                    <div class="task-card-copy">
                        <strong class="task-card-title">${action.name}</strong>
                        <span class="task-card-meta">${scope.Lang?.ui("Completion Time") || "Completion Time"}: ${formatDuration(getActionEffectiveDuration(action))}</span>
                        ${getStatReferenceHtml(action.statFactors)}
                    </div>
                `;
                li.dataset.tooltip = this.buildActionTooltip(action);
            });
        },
        updateSlotUI(index: number) {
            const slot = scope.State.slots[index];
            const slotEl = document.querySelector(`#slots .slot[data-slot="${index}"]`) as HTMLElement | null;
            if (!slotEl) return;
            const progressEl = slotEl.querySelector("progress") as HTMLProgressElement | null;
            const labelEl = slotEl.querySelector(".label") as HTMLElement | null;
            const progressTextEl = slotEl.querySelector(".progress-text") as HTMLElement | null;
            slotEl.classList.toggle("blocked", !!slot.blocked);
            if (!slot.actionId) slot.actionId = scope.State.defaultActionId;
            const action = scope.actions[slot.actionId];
            const isOpenSlot = slot.actionId === scope.State.defaultActionId;
            if (progressEl) {
                progressEl.max = 1;
                progressEl.value = isOpenSlot ? 0 : slot.progress;
            }
            if (labelEl) {
                labelEl.textContent = isOpenSlot
                    ? (scope.Lang?.ui("Open Slot") || "Open Slot")
                    : (slot.text || action.name);
            }
            if (progressTextEl) {
                progressTextEl.textContent = isOpenSlot || !action
                    ? ""
                    : `${scope.Lang?.ui("Time Left") || "Time Left"}: ${formatDuration(getActionRemainingDuration(slot, action))}`;
            }
            const metaEl = slotEl.querySelector(".slot-meta") as HTMLElement | null;
            if (metaEl) {
                metaEl.innerHTML = isOpenSlot || !action ? "" : getStatReferenceHtml(action.statFactors, 2);
            }
            slotEl.style.backgroundImage = !isOpenSlot && action.image ? `url(${action.image})` : "none";
            slotEl.dataset.tooltip = isOpenSlot
                ? (scope.Lang?.ui("Assign a routine to begin") || "Assign a routine to begin")
                : this.buildActionTooltip(action);
        },
        updateAdventureSlotUI(index: number) {
            const slot = scope.State.adventureSlots[index];
            const slotEl = document.querySelector(`#adventure-slots .slot[data-slot="${index}"]`) as HTMLElement | null;
            if (!slotEl) return;
            const progressEl = slotEl.querySelector("progress") as HTMLProgressElement | null;
            const labelEl = slotEl.querySelector(".label") as HTMLElement | null;
            const progressTextEl = slotEl.querySelector(".progress-text") as HTMLElement | null;
            (scope.RARITY_CLASSES || []).forEach((rarity: string) => slotEl.classList.remove(`rarity-${rarity}`));
            if (progressEl) {
                progressEl.value = slot.progress || 0;
                progressEl.max = 1;
            }
            if (slot.active && slot.encounter) {
                if (labelEl) labelEl.textContent = slot.encounter.name;
                if (progressTextEl) {
                    progressTextEl.textContent = `${scope.Lang?.ui("Time Left") || "Time Left"}: ${formatDuration(getAdventureRemainingDuration(slot))}`;
                }
                const metaEl = slotEl.querySelector(".slot-meta") as HTMLElement | null;
                if (metaEl) {
                    metaEl.innerHTML = getStatReferenceHtml(slot.encounter.statFactors, 2);
                }
                if (slot.encounter.image) {
                    slotEl.style.backgroundImage = `url(${slot.encounter.image})`;
                    slotEl.style.backgroundSize = "cover";
                }
                slotEl.classList.add(`rarity-${slot.encounter.rarity}`);
                const parts = [slot.encounter.description];
                parts.push(`${scope.Lang?.ui("Dungeon") || "Dungeon"}: ${slot.encounter.dungeon || "frontier"}`);
                if (slot.encounter.items && Object.keys(slot.encounter.items).length) {
                    const chance = slot.encounter.getLootChance();
                    const total = Object.values(slot.encounter.items).reduce((a: number, b: any) => a + Number(b), 0) || 1;
                    const lines = Object.entries(slot.encounter.items).map(([id, weight]: [string, any]) => {
                        const item = scope.ItemGenerator.itemList.find((entry: any) => entry.id === id);
                        const name = item ? item.name : id;
                        const pct = chance * (Number(weight) / total) * 100;
                        return `${name}: ${pct.toFixed(1)}%`;
                    });
                    if (lines.length) {
                        parts.push((scope.Lang?.ui("Drop Chances") || "Drop chances") + ":");
                        parts.push(...lines);
                    }
                }
                slotEl.dataset.tooltip = parts.join("\n");
            } else {
                if (labelEl) labelEl.textContent = slot.text || "";
                if (progressTextEl) progressTextEl.textContent = "";
                const metaEl = slotEl.querySelector(".slot-meta") as HTMLElement | null;
                if (metaEl) metaEl.innerHTML = "";
                slotEl.style.backgroundImage = "none";
                slotEl.dataset.tooltip = "";
            }
        }
    };
}
