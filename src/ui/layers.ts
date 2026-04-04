function getScope(): any {
    return globalThis as any;
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createLayerUiModules() {
    const modules = {
        inventory: {
            container: null as HTMLElement | null,
            init() {
                this.container = document.getElementById("inventory-slots");
                getScope().PubSub?.subscribe("inventory:changed", () => this.update());
                this.update();
            },
            update() {
                if (!this.container) return;
                const scope = getScope();
                const items = scope.Inventory?.getItems?.() || [];
                this.container.innerHTML = "";
                items.forEach((item: any) => {
                    const slot = document.createElement("div");
                    slot.className = "slot";
                    const label = document.createElement("span");
                    label.className = "label";
                    const countEl = document.createElement("span");
                    countEl.className = "count";
                    label.textContent = capitalize(item.name);
                    countEl.textContent = String(item.quantity);
                    if (item.image) {
                        slot.style.backgroundImage = `url(${item.image})`;
                    }
                    slot.classList.add(`rarity-${item.rarity}`);
                    const lines = [item.description];
                    if (item.effect) lines.push(item.effect);
                    slot.dataset.tooltip = lines.join("\n");
                    slot.appendChild(label);
                    slot.appendChild(countEl);
                    this.container!.appendChild(slot);
                });
            }
        },
        character: {
            leftContainer: null as HTMLElement | null,
            rightContainer: null as HTMLElement | null,
            itemsContainer: null as HTMLElement | null,
            portrait: null as HTMLElement | null,
            buildSlot(slot: string, itemId: string | null) {
                const scope = getScope();
                const slotEl = document.createElement("div");
                slotEl.className = "slot equipment-slot";
                slotEl.dataset.slot = slot;
                const label = document.createElement("span");
                label.className = "label";
                label.textContent = scope.Lang?.ui(slot) || capitalize(slot);
                slotEl.appendChild(label);
                if (itemId) {
                    const item = scope.ItemGenerator?.itemList?.find((entry: any) => entry.id === itemId);
                    if (item?.image) slotEl.style.backgroundImage = `url(${item.image})`;
                    slotEl.dataset.tooltip = item ? `${item.name}\n${item.description}` : itemId;
                    slotEl.classList.add("active");
                } else {
                    slotEl.dataset.tooltip = scope.Lang?.ui("Empty Slot") || "Empty Slot";
                }
                slotEl.addEventListener("click", () => {
                    if (scope.State?.equipment?.[slot]) scope.Equipment?.unequip(slot);
                });
                return slotEl;
            },
            init() {
                this.leftContainer = document.getElementById("character-slots-left");
                this.rightContainer = document.getElementById("character-slots-right");
                this.itemsContainer = document.getElementById("equipment-items");
                this.portrait = document.getElementById("character-portrait-panel");
                if (!this.leftContainer || !this.rightContainer || !this.itemsContainer) return;
                const scope = getScope();
                scope.PubSub?.subscribe("equipment:changed", () => {
                    this.updateSlots();
                    this.updateItems();
                });
                scope.PubSub?.subscribe("inventory:changed", () => this.updateItems());
                scope.PubSub?.subscribe("lang:changed", () => {
                    this.updateSlots();
                    this.updateItems();
                });
                this.updateSlots();
                this.updateItems();
            },
            updateSlots() {
                if (!this.leftContainer || !this.rightContainer) return;
                const scope = getScope();
                this.leftContainer.innerHTML = "";
                this.rightContainer.innerHTML = "";
                ["head", "leftHand", "ring1", "pants", "boots"].forEach((slot) => {
                    this.leftContainer!.appendChild(this.buildSlot(slot, scope.State.equipment[slot]));
                });
                ["armor", "rightHand", "gloves", "ring2", "necklace"].forEach((slot) => {
                    this.rightContainer!.appendChild(this.buildSlot(slot, scope.State.equipment[slot]));
                });
                scope.CharacterBackground?.updatePortrait?.(this.portrait);
            },
            updateItems() {
                if (!this.itemsContainer) return;
                const scope = getScope();
                const items = (scope.Inventory?.getItems?.() || []).filter((item: any) => item.type === "equipment");
                this.itemsContainer.innerHTML = "";
                items.forEach((item: any) => {
                    const slot = new scope.BaseSlot(false);
                    slot.el.classList.add("equipment-item-card");
                    slot.setLabel(capitalize(item.name));
                    slot.setImage(item.image);
                    const equipped = !!scope.Equipment?.isEquipped?.(item.id);
                    const lines = [item.description];
                    if (item.effect) lines.push(item.effect);
                    if (item.slot) lines.push(`${scope.Lang?.ui("Slot") || "Slot"}: ${scope.Lang?.ui(item.slot) || capitalize(item.slot)}`);
                    if (equipped) lines.push(scope.Lang?.ui("Equipped") || "Equipped");
                    slot.setTooltip(lines.join("\n"));
                    slot.el.classList.add(`rarity-${item.rarity}`);
                    const action = document.createElement("button");
                    action.className = equipped ? "ghost-button" : "accent-button";
                    action.textContent = equipped ? (scope.Lang?.ui("Unequip") || "Unequip") : (scope.Lang?.ui("Equip") || "Equip");
                    action.addEventListener("click", (event) => {
                        event.stopPropagation();
                        if (equipped) {
                            scope.Equipment?.unequip(item.slot);
                        } else {
                            scope.Equipment?.equip(item.id);
                        }
                    });
                    slot.el.appendChild(action);
                    this.itemsContainer!.appendChild(slot.el);
                });
            }
        },
        characterBackground: {
            baseImage: "assets/char/new_char.png",
            equippedImage: "assets/char/leather+woodshield+spear.png",
            fullGearImage: "assets/char/set+sword.png",
            container: null as HTMLElement | null,
            getImage() {
                const scope = getScope();
                const fullGear = [["armor", "leather_armor"], ["leftHand", "wooden_shield"], ["rightHand", "iron_sword"], ["necklace", "gem"]];
                const spearSet = [["armor", "leather_armor"], ["leftHand", "wooden_shield"], ["rightHand", "stone_spear"]];
                if (scope.State.equipment && fullGear.every(([slot, item]) => scope.State.equipment[slot] === item)) return this.fullGearImage;
                if (scope.State.equipment && spearSet.every(([slot, item]) => scope.State.equipment[slot] === item)) return this.equippedImage;
                return this.baseImage;
            },
            init() {
                this.container = document.getElementById("character-portrait-panel");
                const scope = getScope();
                scope.PubSub?.subscribe("inventory:changed", () => this.update());
                scope.PubSub?.subscribe("equipment:changed", () => this.update());
                this.update();
            },
            update() {
                this.updatePortrait(this.container);
            },
            updatePortrait(container: HTMLElement | null) {
                if (!container) return;
                container.style.backgroundImage = `url(${this.getImage()})`;
            }
        }
    };
    Object.assign(modules, {
        home: {
            listEl: null as HTMLElement | null,
            slotContainer: null as HTMLElement | null,
            furnitureContainer: null as HTMLElement | null,
            furnitureSlots: [] as any[],
            init() {
                this.listEl = document.getElementById("home-list");
                this.slotContainer = document.getElementById("home-slot");
                this.furnitureContainer = document.getElementById("furniture-slots");
                if (!this.listEl || !this.slotContainer) return;
                this.renderList();
                this.createSlot();
                this.updateSlot();
                const scope = getScope();
                scope.PubSub?.subscribe("home:changed", () => this.updateSlot());
                scope.PubSub?.subscribe("furniture:updated", () => this.updateSlot());
                scope.PubSub?.subscribe("furniture:durabilityChanged", () => this.updateDurability());
                scope.PubSub?.subscribe("inventory:changed", () => this.renderList());
            },
            renderList() {
                if (!this.listEl) return;
                const scope = getScope();
                this.listEl.innerHTML = "";
                (scope.HomeSystem?.homes || []).forEach((home: any) => {
                    if (home.default) return;
                    const li = document.createElement("li");
                    li.textContent = home.name;
                    li.dataset.homeId = home.id;
                    li.dataset.tooltip = `${home.description}\nCost: ${scope.Utils?.formatCost(home.cost)}`;
                    if (scope.Inventory?.canAfford?.(home.cost)) li.classList.add("affordable");
                    li.setAttribute("draggable", "true");
                    li.addEventListener("dragstart", (event: DragEvent) => {
                        li.classList.add("dragging");
                        event.dataTransfer?.setData("text/plain", home.id);
                    });
                    li.addEventListener("dragend", () => li.classList.remove("dragging"));
                    li.addEventListener("click", () => scope.HomeSystem?.setHome?.(home.id));
                    this.listEl!.appendChild(li);
                });
            },
            createSlot() {
                if (!this.slotContainer) return;
                const scope = getScope();
                this.slotContainer.innerHTML = "";
                const slot = new scope.BaseSlot(false);
                const slotEl = slot.el;
                slotEl.dataset.slot = "0";
                slotEl.addEventListener("dragover", (event: DragEvent) => event.preventDefault());
                slotEl.addEventListener("drop", (event: DragEvent) => {
                    event.preventDefault();
                    const id = event.dataTransfer?.getData("text/plain");
                    if (id) scope.HomeSystem?.setHome?.(id);
                });
                this.slotContainer.appendChild(slotEl);
            },
            updateSlot() {
                const scope = getScope();
                const slotEl = this.slotContainer?.querySelector(".slot") as HTMLElement | null;
                const labelEl = slotEl?.querySelector(".label") as HTMLElement | null;
                if (!slotEl || !labelEl) return;
                const home = scope.HomeSystem?.homes?.find((entry: any) => entry.id === scope.State.homeId);
                if (!home) {
                    labelEl.textContent = "";
                    slotEl.style.backgroundImage = "none";
                    slotEl.dataset.tooltip = "";
                    (scope.RARITY_CLASSES || []).forEach((rarity: string) => slotEl.classList.remove(`rarity-${rarity}`));
                    if (this.furnitureContainer) this.furnitureContainer.innerHTML = "";
                    return;
                }
                labelEl.textContent = home.name;
                slotEl.style.backgroundImage = home.image ? `url(${home.image})` : "none";
                slotEl.dataset.tooltip = `${home.description}\nCost: ${scope.Utils?.formatCost(home.cost)}`;
                (scope.RARITY_CLASSES || []).forEach((rarity: string) => slotEl.classList.remove(`rarity-${rarity}`));
                slotEl.classList.add(`rarity-${home.rarity}`);
                this.updateFurnitureSlots(home.furnitureSlots);
            },
            updateFurnitureSlots(count = 0) {
                if (!this.furnitureContainer) return;
                const scope = getScope();
                this.furnitureContainer.innerHTML = "";
                this.furnitureSlots = [];
                for (let index = 0; index < count; index += 1) {
                    const slot = new scope.BaseSlot();
                    this.furnitureSlots.push(slot);
                    const data = scope.State.furniture[index];
                    if (data) {
                        const furniture = scope.FurnitureSystem?.furniture?.find((entry: any) => entry.id === data.id);
                        if (furniture) {
                            slot.setLabel(furniture.name);
                            slot.setImage(furniture.image);
                            slot.setTooltip(`${furniture.description}\nDurability: ${data.durability}/${furniture.durability}`);
                            slot.setProgress(data.durability / furniture.durability, `${data.durability}/${furniture.durability}`);
                        }
                    }
                    this.furnitureContainer.appendChild(slot.el);
                }
            },
            updateDurability() {
                const scope = getScope();
                this.furnitureSlots.forEach((slot: any, index: number) => {
                    const data = scope.State.furniture[index];
                    if (!data) {
                        slot.setProgress(0, "");
                        slot.setTooltip("");
                        slot.setLabel("");
                        slot.setImage(null);
                        return;
                    }
                    const furniture = scope.FurnitureSystem?.furniture?.find((entry: any) => entry.id === data.id);
                    if (furniture) {
                        const ratio = Math.max(data.durability, 0) / furniture.durability;
                        slot.setProgress(ratio, `${data.durability.toFixed(1)}/${furniture.durability}`);
                        slot.setTooltip(`${furniture.description}\nDurability: ${data.durability.toFixed(1)}/${furniture.durability}`);
                    }
                });
            }
        }
    });
    Object.assign(modules, {
        furniture: {
            listEl: null as HTMLElement | null,
            init() {
                this.listEl = document.getElementById("furniture-list");
                if (!this.listEl) return;
                this.render();
                const scope = getScope();
                scope.PubSub?.subscribe("furniture:updated", () => this.render());
                scope.PubSub?.subscribe("inventory:changed", () => this.render());
            },
            render() {
                if (!this.listEl) return;
                const scope = getScope();
                this.listEl.innerHTML = "";
                const home = scope.HomeSystem?.homes?.find((entry: any) => entry.id === scope.State.homeId);
                const limit = home ? home.furnitureSlots : 0;
                const used = scope.State.furniture.length;
                (scope.FurnitureSystem?.furniture || []).forEach((furniture: any) => {
                    const li = document.createElement("li");
                    li.textContent = furniture.name;
                    const owned = scope.State.furniture.find((entry: any) => entry.id === furniture.id);
                    let cost = furniture.cost;
                    if (owned) {
                        const missing = Math.max(furniture.durability - owned.durability, 0);
                        const ratio = missing / furniture.durability;
                        cost = {};
                        Object.entries(furniture.cost).forEach(([key, value]) => {
                            cost[key] = Math.ceil(Number(value) * ratio);
                        });
                        li.dataset.tooltip = `${furniture.description}\nRefresh: ${scope.Utils?.formatCost(cost)}`;
                    } else {
                        li.dataset.tooltip = `${furniture.description}\nCost: ${scope.Utils?.formatCost(cost)}`;
                    }
                    const canAfford = scope.Inventory?.canAfford?.(cost);
                    const slotsAvailable = owned || used < limit;
                    if (canAfford && slotsAvailable) li.classList.add("affordable");
                    li.addEventListener("click", () => scope.FurnitureSystem?.purchase?.(furniture.id));
                    li.setAttribute("draggable", "true");
                    li.addEventListener("dragstart", () => li.classList.add("dragging"));
                    li.addEventListener("dragend", () => li.classList.remove("dragging"));
                    this.listEl!.appendChild(li);
                });
            }
        },
        research: {
            listEl: null as HTMLElement | null,
            init() {
                this.listEl = document.getElementById("research-list");
                if (!this.listEl) return;
                this.render();
                getScope().PubSub?.subscribe("research:updated", () => this.render());
            },
            render() {
                if (!this.listEl) return;
                const scope = getScope();
                this.listEl.innerHTML = "";
                (scope.ResearchSystem?.research || []).forEach((research: any) => {
                    const li = document.createElement("li");
                    li.textContent = research.name;
                    const requirementText = scope.ResearchSystem?.describeRequirements?.(research) || "";
                    li.dataset.tooltip = requirementText ? `${research.description}\n${requirementText}` : research.description;
                    if (scope.ResearchSystem?.isUnlocked?.(research)) li.classList.add("affordable");
                    if (scope.State.researchCompleted.includes(research.id) || research.done) {
                        li.classList.add("locked");
                    } else {
                        li.addEventListener("click", () => scope.ResearchSystem?.purchase?.(research.id));
                        li.setAttribute("draggable", "true");
                        li.addEventListener("dragstart", () => li.classList.add("dragging"));
                        li.addEventListener("dragend", () => li.classList.remove("dragging"));
                    }
                    this.listEl!.appendChild(li);
                });
            }
        }
    });
    Object.assign(modules, {
        routineUpgrades: {
            container: null as HTMLElement | null,
            init() {
                this.container = document.getElementById("routine-upgrades-list");
                if (!this.container) return;
                this.render();
                const scope = getScope();
                scope.PubSub?.subscribe("routine-upgrades:changed", () => this.render());
                scope.PubSub?.subscribe("inventory:changed", () => this.render());
                scope.PubSub?.subscribe("lang:changed", () => this.render());
            },
            render() {
                if (!this.container) return;
                const scope = getScope();
                const upgrades = scope.RoutineUpgradeSystem?.getSortedUpgrades?.() || [];
                this.container.innerHTML = "";
                upgrades.forEach((upgrade: any) => {
                    const card = document.createElement("button");
                    card.type = "button";
                    card.className = "routine-upgrade-card";
                    card.disabled = !upgrade.affordable || upgrade.capped;
                    card.classList.toggle("is-affordable", !!upgrade.affordable);
                    card.classList.toggle("is-capped", !!upgrade.capped);
                    const statName = scope.Lang?.stat(upgrade.stat) || capitalize(upgrade.stat);
                    const costLabel = Object.entries(upgrade.currentCost || {})
                        .map(([id, amount]) => {
                            const item = scope.ItemGenerator?.itemList?.find((entry: any) => entry.id === id);
                            return `${item?.name || id} x${amount}`;
                        })
                        .join(" | ");
                    card.innerHTML = `
                        <span class="routine-upgrade-kicker">${statName}</span>
                        <strong>${upgrade.name}</strong>
                        <span class="routine-upgrade-description">${upgrade.description || ""}</span>
                        <div class="routine-upgrade-meta">
                            <span>${scope.Lang?.ui("Level") || "Level"} ${upgrade.level}${upgrade.maxLevel ? `/${upgrade.maxLevel}` : ""}</span>
                            <span>${scope.Lang?.ui("Multiplier") || "Multiplier"} x${Number(upgrade.multiplier || 1).toFixed(2)}</span>
                            <span>${scope.Lang?.ui("Next") || "Next"} x${Number(upgrade.nextMultiplier || upgrade.multiplier || 1).toFixed(2)}</span>
                        </div>
                        <span class="routine-upgrade-cost">${costLabel || (scope.Lang?.ui("No Cost") || "No Cost")}</span>
                    `;
                    card.addEventListener("click", () => scope.RoutineUpgradeSystem?.purchase?.(upgrade.id));
                    this.container!.appendChild(card);
                });
            }
        }
    });
    Object.assign(modules, {
        updates: {
            listEl: null as HTMLElement | null,
            slotContainer: null as HTMLElement | null,
            init() {
                this.listEl = document.getElementById("chip-list");
                this.slotContainer = document.getElementById("chip-slots");
                if (!this.listEl || !this.slotContainer) return;
                this.renderList();
                this.createSlots();
                const scope = getScope();
                scope.PubSub?.subscribe("updates:changed", () => {
                    this.renderList();
                    this.updateSlots();
                });
                scope.PubSub?.subscribe("inventory:changed", () => this.renderList());
            },
            renderList() {
                if (!this.listEl) return;
                const scope = getScope();
                this.listEl.innerHTML = "";
                (scope.UpdateSystem?.updates || []).forEach((update: any) => {
                    if (update.state === "done") return;
                    const li = document.createElement("li");
                    li.textContent = update.name;
                    li.dataset.updateId = update.id;
                    li.dataset.tooltip = `${update.description}\nCost: ${scope.Utils?.formatCost(update.resourceConsumption)}`;
                    if (scope.Inventory?.canAfford?.(update.resourceConsumption)) li.classList.add("affordable");
                    if (update.state !== "available") {
                        li.classList.add("locked");
                    } else {
                        li.setAttribute("draggable", "true");
                        li.addEventListener("dragstart", (event: DragEvent) => {
                            li.classList.add("dragging");
                            event.dataTransfer?.setData("text/plain", update.id);
                        });
                        li.addEventListener("dragend", () => li.classList.remove("dragging"));
                    }
                    this.listEl!.appendChild(li);
                });
            },
            createSlots() {
                if (!this.slotContainer) return;
                const scope = getScope();
                while (scope.UpdateSystem.slots.length < scope.UpdateSystem.slotCount) {
                    scope.UpdateSystem.slots.push({ updateId: null, progress: 0, active: false });
                }
                for (let index = 0; index < scope.UpdateSystem.slotCount; index += 1) {
                    const slotEl = document.createElement("div");
                    slotEl.className = "slot";
                    slotEl.dataset.slot = String(index);
                    const label = document.createElement("span");
                    label.className = "label";
                    slotEl.appendChild(label);
                    const wrapper = document.createElement("div");
                    wrapper.className = "progress-wrapper";
                    const progress = document.createElement("progress");
                    progress.value = 0;
                    progress.max = 1;
                    wrapper.appendChild(progress);
                    slotEl.appendChild(wrapper);
                    slotEl.addEventListener("dragover", (event: DragEvent) => event.preventDefault());
                    slotEl.addEventListener("drop", (event: DragEvent) => {
                        event.preventDefault();
                        const id = event.dataTransfer?.getData("text/plain");
                        if (id) scope.UpdateSystem.start(index, id);
                    });
                    this.slotContainer!.appendChild(slotEl);
                    this.updateSlot(index);
                }
            },
            updateSlots() {
                const scope = getScope();
                for (let index = 0; index < scope.UpdateSystem.slotCount; index += 1) {
                    this.updateSlot(index);
                }
            },
            updateSlot(index: number) {
                if (!this.slotContainer) return;
                const scope = getScope();
                const slot = scope.UpdateSystem.slots[index];
                const slotEl = this.slotContainer.querySelector(`.slot[data-slot="${index}"]`) as HTMLElement | null;
                if (!slotEl) return;
                const progressEl = slotEl.querySelector("progress") as HTMLProgressElement | null;
                const labelEl = slotEl.querySelector(".label") as HTMLElement | null;
                if (!slot.updateId) {
                    if (progressEl) {
                        progressEl.value = 0;
                        progressEl.max = 1;
                    }
                    if (labelEl) labelEl.textContent = "";
                    slotEl.dataset.tooltip = "";
                    return;
                }
                const update = scope.UpdateSystem.updates.find((entry: any) => entry.id === slot.updateId);
                if (progressEl) {
                    progressEl.max = 1;
                    progressEl.value = slot.progress;
                }
                if (labelEl) labelEl.textContent = update.name;
                slotEl.dataset.tooltip = update.description;
            }
        }
    });
    return modules;
}
