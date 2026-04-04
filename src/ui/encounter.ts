import { createDashboardUi } from "./dashboard";

export function createEncounterUi(dashboardUi: ReturnType<typeof createDashboardUi>) {
    return {
        getItemLabel(itemId: string) {
            const scope = globalThis as any;
            const item = scope.ItemGenerator?.itemList?.find((entry: any) => entry.id === itemId);
            return item ? item.name : itemId;
        },
        getDungeonStrongestStat(dungeonId: string) {
            const scope = globalThis as any;
            const encounters = scope.EncounterGenerator?.encounters?.filter((encounter: any) =>
                encounter.id !== "recover" && (encounter.dungeon || "frontier") === dungeonId
            ) || [];
            const totals: Record<string, number> = {};
            encounters.forEach((encounter: any) => {
                Object.entries(encounter.statFactors || {}).forEach(([stat, factor]: [string, any]) => {
                    totals[stat] = (totals[stat] || 0) + Number(factor.speed || 0) + Number(factor.output || 0);
                });
            });
            const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
            return top ? (scope.Lang?.stat(top[0]) || scope.capitalize?.(top[0]) || top[0]) : (scope.Lang?.ui("Balanced") || "Balanced");
        },
        getDungeonStatFactors(dungeonId: string) {
            const scope = globalThis as any;
            const encounters = scope.EncounterGenerator?.encounters?.filter((encounter: any) =>
                encounter.id !== "recover" && (encounter.dungeon || "frontier") === dungeonId
            ) || [];
            const totals: Record<string, { speed: number; output: number }> = {};
            encounters.forEach((encounter: any) => {
                Object.entries(encounter.statFactors || {}).forEach(([stat, factor]: [string, any]) => {
                    if (!totals[stat]) {
                        totals[stat] = { speed: 0, output: 0 };
                    }
                    totals[stat].speed += Number(factor.speed || 0);
                    totals[stat].output += Number(factor.output || 0);
                });
            });
            return totals;
        },
        getDungeonPossibleDrops(dungeon: any) {
            const scope = globalThis as any;
            const weighted = Object.entries(dungeon.weightedDrops || {})
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 4)
                .map(([id]) => {
                    const item = scope.ItemGenerator?.itemList?.find((entry: any) => entry.id === id);
                    return item ? { id: item.id, name: item.name, image: item.image || "" } : { id, name: this.getItemLabel(id as string), image: "" };
                });
            const unique = Array.from(new Map(weighted.map((entry: any) => [entry.id, entry])).values()).filter(Boolean);
            return unique.length ? unique : [];
        },
        getDungeonAverageDuration(dungeonId: string) {
            const scope = globalThis as any;
            const encounters = scope.EncounterGenerator?.encounters?.filter((encounter: any) =>
                encounter.id !== "recover" && (encounter.dungeon || "frontier") === dungeonId
            ) || [];
            if (!encounters.length) {
                return 0;
            }
            return encounters.reduce((sum: number, encounter: any) => sum + Number(encounter.getDuration?.() || encounter.baseDuration || 0), 0) / encounters.length;
        },
        formatDuration(seconds: number) {
            const safeSeconds = Math.max(0, Number(seconds || 0));
            if (safeSeconds < 60) {
                return `${safeSeconds.toFixed(1)}s`;
            }
            if (safeSeconds < 3600) {
                return `${(safeSeconds / 60).toFixed(1)}m`;
            }
            return `${(safeSeconds / 3600).toFixed(1)}h`;
        },
        updateName() {
            const scope = globalThis as any;
            const milestone = scope.EncounterGenerator?.milestones
                ?.slice()
                .reverse()
                .find((m: any) => scope.EncounterGenerator.level >= m.level);
            const name = milestone ? milestone.name : scope.EncounterGenerator?.milestones?.[0]?.name;
            const el = document.getElementById("encounter-location");
            if (!el) return;
            const dungeon = scope.State.currentDungeon
                ? scope.State.currentDungeon.replace(/_/g, " ").replace(/\b\w/g, (char: string) => char.toUpperCase())
                : "Frontier";
            el.textContent = `${dungeon} | ${name} (${dashboardUi.formatMultiplier(scope.getDungeonAverageMultiplier?.(scope.State.currentDungeon) || 1)})`;
        },
        updateProgressBar() {
            const scope = globalThis as any;
            const bar = document.getElementById("encounter-level-progress") as HTMLProgressElement | null;
            if (bar) {
                bar.max = 10;
                bar.value = Math.min(scope.State.encounterStreak || 0, 10);
            }
        },
        updateDungeonCatalog(container: HTMLElement | null) {
            const scope = globalThis as any;
            if (!container) return;
            const catalog = scope.EncounterGenerator?.getDungeonCatalog?.() || [];
            container.innerHTML = "";
            catalog.forEach((dungeon: any) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "dungeon-card";
                const isUnlocked = !!dungeon.unlocked;
                if ((scope.State.currentDungeon || "frontier") === dungeon.id && isUnlocked) {
                    button.classList.add("active");
                }
                button.disabled = !isUnlocked;
                button.classList.toggle("is-locked", !isUnlocked);
                const clears = scope.State.adventureCompletions[dungeon.id] || 0;
                const strongestStat = this.getDungeonStrongestStat(dungeon.id);
                const statReference = scope.getStatChipsHtml ? scope.getStatChipsHtml(this.getDungeonStatFactors(dungeon.id), 3) : "";
                const possibleDrops = this.getDungeonPossibleDrops(dungeon);
                button.innerHTML = `
                    <span class="dungeon-card-kicker">${dungeon.name}</span>
                    <strong>${dungeon.description || ""}</strong>
                    <strong>${scope.Lang?.ui("Expedition Multiplier") || "Expedition Multiplier"} ${dashboardUi.formatMultiplier(scope.getDungeonAverageMultiplier?.(dungeon.id) || 1)}</strong>
                    ${statReference ? `<div class="stat-chip-row stat-chip-row-dungeon">${statReference}</div>` : ""}
                    <span>${scope.Lang?.ui("Completion Time") || "Completion Time"}: ${this.formatDuration(this.getDungeonAverageDuration(dungeon.id))}</span>
                    <span>${scope.Lang?.ui("Encounters") || "Encounters"}: ${dungeon.encounterCount}</span>
                    <span>${scope.Lang?.ui("Combat Nodes") || "Combat Nodes"}: ${dungeon.combatCount}</span>
                    <span>${scope.Lang?.ui("Lead Stat") || "Lead Stat"}: ${strongestStat}</span>
                    <span>${scope.Lang?.ui("Clears") || "Clears"}: ${clears}</span>
                    <span>${scope.Lang?.ui("Possible Drops") || "Possible Drops"}: ${possibleDrops.length ? possibleDrops.map((entry: any) => entry.name).join(", ") : (scope.Lang?.ui("Unknown") || "Unknown")}</span>
                    <span>${isUnlocked ? (scope.Lang?.ui("Open") || "Open") : `${scope.Lang?.ui("Unlock") || "Unlock"}: ${dungeon.unlockLabel}`}</span>
                `;
                if (isUnlocked) {
                    button.addEventListener("click", () => {
                        scope.EncounterGenerator.setCurrentDungeon(dungeon.id);
                        this.updateName();
                        this.updateDungeonCatalog(container);
                    });
                }
                container.appendChild(button);
            });
        }
    };
}
