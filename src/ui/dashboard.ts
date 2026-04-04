import { getLegacyRuntime } from "../systems/runtime";

function getScope(): any {
    return globalThis as any;
}

export function createDashboardUi() {
    return {
        formatLayerMetricValue(value: unknown) {
            if (typeof value === "number") {
                return Number.isInteger(value) ? String(value) : value.toFixed(1);
            }
            return String(value ?? "");
        },
        formatMultiplier(value: number) {
            return `x${Number(value || 1).toFixed(2)}`;
        },
        formatRuntime(seconds = 0) {
            if (seconds < 60) return `${seconds.toFixed(0)}s`;
            if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
            return `${(seconds / 3600).toFixed(1)}h`;
        },
        formatDungeonName(id?: string) {
            if (!id) return "frontier";
            return id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
        },
        getTopRecordEntry(record: Record<string, number> = {}) {
            const entries = Object.entries(record);
            if (!entries.length) return null;
            entries.sort((a, b) => b[1] - a[1]);
            return entries[0];
        },
        getObjectTotal(record: Record<string, number> = {}) {
            return Object.values(record).reduce((sum, value) => sum + Number(value || 0), 0);
        },
        getTopStatKey() {
            const runtime = getLegacyRuntime();
            const scope = getScope();
            return (scope.StatsUI?.list || []).slice().sort((a: string, b: string) => {
                const levelDiff = runtime.getStatLevel ? runtime.getStatLevel(b) - runtime.getStatLevel(a) : 0;
                if (levelDiff !== 0) return levelDiff;
                return (scope.getStatExp?.(b) || 0) - (scope.getStatExp?.(a) || 0);
            })[0] || null;
        },
        getLifeState() {
            const runtime = getLegacyRuntime();
            const scope = getScope();
            if (runtime.State.age.years >= runtime.State.age.max - 5) return scope.Lang?.ui("Fading") || "Fading";
            if (runtime.State.healerGoneSeen) return scope.Lang?.ui("On the Road") || "On the Road";
            return scope.Lang?.ui("Recovering") || "Recovering";
        },
        getLayerMetrics(tabId: string) {
            const runtime = getLegacyRuntime();
            const scope = getScope();
            const inventoryItems = scope.Inventory?.getItems ? scope.Inventory.getItems() : [];
            const activeRoutineSlots = runtime.State.slots.filter((slot: any) => slot.actionId && slot.actionId !== runtime.State.defaultActionId).length;
            const home = scope.HomeSystem?.homes.find((item: any) => item.id === runtime.State.homeId);
            const currentDungeonDefinition = scope.EncounterGenerator?.getDungeonDefinition?.(runtime.State.currentDungeon || "frontier");
            const activeDungeon = this.formatDungeonName(runtime.State.currentDungeon || "frontier");
            const maps: Record<string, Array<{ label: string; value: string | number }>> = {
                routines: [
                    { label: scope.Lang?.ui("Actions Ready") || "Actions Ready", value: Object.values(runtime.actions || {}).filter((action: any) => !action.hidden).length },
                    { label: scope.Lang?.ui("Active Slots") || "Active Slots", value: `${activeRoutineSlots}/${runtime.State.slotCount}` },
                    { label: scope.Lang?.ui("Routine Multiplier") || "Routine Multiplier", value: this.formatMultiplier(scope.getActiveRoutineMultiplier?.() || 1) }
                ],
                adventure: [
                    { label: scope.Lang?.ui("Dungeon") || "Dungeon", value: activeDungeon },
                    { label: scope.Lang?.ui("Route Focus") || "Route Focus", value: currentDungeonDefinition?.recommendedStat ? (scope.Lang?.stat(currentDungeonDefinition.recommendedStat) || currentDungeonDefinition.recommendedStat) : (scope.Lang?.ui("Balanced") || "Balanced") },
                    { label: scope.Lang?.ui("Expedition Multiplier") || "Expedition Multiplier", value: this.formatMultiplier(scope.getDungeonAverageMultiplier?.(runtime.State.currentDungeon) || 1) }
                ],
                inventory: [
                    { label: scope.Lang?.ui("Tracked Items") || "Tracked Items", value: inventoryItems.length },
                    { label: scope.Lang?.ui("Current Home") || "Current Home", value: home ? home.name : (scope.Lang?.ui("Default Hut") || "Default Hut") },
                    { label: scope.Lang?.ui("Equipped") || "Equipped", value: scope.Equipment?.getEquippedCount ? scope.Equipment.getEquippedCount() : 0 },
                    { label: scope.Lang?.ui("Weapon") || "Weapon", value: scope.formatEquipmentName ? scope.formatEquipmentName(runtime.State.equipment.rightHand, scope.Lang?.ui("Unarmed") || "Unarmed") : (scope.Lang?.ui("Unarmed") || "Unarmed") }
                ],
                chip: [
                    { label: scope.Lang?.ui("Pending Updates") || "Pending Updates", value: scope.UpdateSystem ? scope.UpdateSystem.updates.filter((item: any) => item.state !== "done").length : 0 },
                    { label: scope.Lang?.ui("Research Ready") || "Research Ready", value: scope.ResearchSystem ? scope.ResearchSystem.research.filter((item: any) => !(runtime.State.researchCompleted.includes(item.id) || item.done) && scope.ResearchSystem.isUnlocked?.(item)).length : 0 },
                    { label: scope.Lang?.ui("Research Progress") || "Research Progress", value: scope.ResearchSystem?.getCompletedCount ? `${scope.ResearchSystem.getCompletedCount()}/${scope.ResearchSystem.research.length}` : 0 }
                ],
                automation: [
                    { label: scope.Lang?.ui("Status") || "Status", value: scope.Lang?.ui("Standby") || "Standby" },
                    { label: scope.Lang?.ui("Queue") || "Queue", value: 0 },
                    { label: scope.Lang?.ui("Action Data") || "Action Data", value: this.getObjectTotal(runtime.State.actionAssignments) }
                ]
            };
            return maps[tabId] || [];
        },
        getWorkspaceMetrics(tabId: string) {
            const runtime = getLegacyRuntime();
            const scope = getScope();
            const currentLocation = scope.EncounterGenerator?.milestones
                ? (scope.EncounterGenerator.milestones.slice().reverse().find((m: any) => scope.EncounterGenerator.level >= m.level) || scope.EncounterGenerator.milestones[0])
                : null;
            const home = scope.HomeSystem?.homes.find((item: any) => item.id === runtime.State.homeId);
            const topDungeon = this.getTopRecordEntry(runtime.State.adventureCompletions);
            const activeDungeon = this.formatDungeonName(runtime.State.currentDungeon || "frontier");
            const currentDungeonDefinition = scope.EncounterGenerator?.getDungeonDefinition?.(runtime.State.currentDungeon || "frontier");
            const maps: Record<string, Array<{ label: string; value: string | number }>> = {
                routines: [
                    { label: scope.Lang?.ui("Open Slots") || "Open Slots", value: runtime.State.slots.filter((slot: any) => slot.actionId === runtime.State.defaultActionId).length },
                    { label: scope.Lang?.ui("Routine Multiplier") || "Routine Multiplier", value: this.formatMultiplier(scope.getActiveRoutineMultiplier?.() || 1) },
                    { label: scope.Lang?.ui("Upgrades") || "Upgrades", value: this.formatMultiplier((scope.getActiveRoutineBreakdown?.()?.breakdown?.upgradesMultiplier) || 1) }
                ],
                adventure: [
                    { label: scope.Lang?.ui("Location") || "Location", value: currentLocation ? `${activeDungeon} | ${currentLocation.name}` : activeDungeon },
                    { label: scope.Lang?.ui("Expedition Multiplier") || "Expedition Multiplier", value: this.formatMultiplier(scope.getDungeonAverageMultiplier?.(runtime.State.currentDungeon) || 1) },
                    { label: scope.Lang?.ui("Route Focus") || "Route Focus", value: currentDungeonDefinition?.recommendedStat ? (scope.Lang?.stat(currentDungeonDefinition.recommendedStat) || currentDungeonDefinition.recommendedStat) : (scope.Lang?.ui("Balanced") || "Balanced") },
                    { label: scope.Lang?.ui("Encounter Streak") || "Encounter Streak", value: runtime.State.encounterStreak || 0 },
                    { label: scope.Lang?.ui("Dungeon Clears") || "Dungeon Clears", value: topDungeon ? `${this.formatDungeonName(topDungeon[0])} | ${topDungeon[1]}` : 0 }
                ],
                inventory: [
                    { label: scope.Lang?.ui("Current Home") || "Current Home", value: home ? home.name : (scope.Lang?.ui("Default Hut") || "Default Hut") },
                    { label: scope.Lang?.ui("Tracked Items") || "Tracked Items", value: scope.Inventory?.getItems?.().length || 0 },
                    { label: scope.Lang?.ui("Equipped") || "Equipped", value: scope.Equipment?.getEquippedCount ? scope.Equipment.getEquippedCount() : 0 },
                    { label: scope.Lang?.ui("Weapon") || "Weapon", value: scope.formatEquipmentName ? scope.formatEquipmentName(runtime.State.equipment.rightHand, scope.Lang?.ui("Unarmed") || "Unarmed") : (scope.Lang?.ui("Unarmed") || "Unarmed") }
                ],
                chip: [
                    { label: scope.Lang?.ui("Encounter Data") || "Encounter Data", value: this.getObjectTotal(runtime.State.encounterCompletions) },
                    { label: scope.Lang?.ui("Dungeon Data") || "Dungeon Data", value: this.getObjectTotal(runtime.State.adventureCompletions) },
                    { label: scope.Lang?.ui("Action Data") || "Action Data", value: this.getObjectTotal(runtime.State.actionAssignments) },
                    { label: scope.Lang?.ui("Research Progress") || "Research Progress", value: scope.ResearchSystem?.getCompletedCount ? `${scope.ResearchSystem.getCompletedCount()}/${scope.ResearchSystem.research.length}` : 0 }
                ],
                automation: [
                    { label: scope.Lang?.ui("Status") || "Status", value: scope.Lang?.ui("Standby") || "Standby" },
                    { label: scope.Lang?.ui("Action Data") || "Action Data", value: this.getObjectTotal(runtime.State.actionAssignments) },
                    { label: scope.Lang?.ui("Open Slots") || "Open Slots", value: runtime.State.slots.filter((slot: any) => slot.actionId === runtime.State.defaultActionId).length }
                ]
            };
            return maps[tabId] || [];
        },
        getHeroState() {
            const runtime = getLegacyRuntime();
            const selected = (globalThis as any).window?.__appSelectors && (globalThis as any).window?.__appContent
                ? (globalThis as any).window.__appSelectors.selectDashboardState(runtime.State, (globalThis as any).window.__appContent)
                : null;
            const routineBreakdown = (globalThis as any).getActiveRoutineBreakdown?.()?.breakdown || null;
            return {
                openSlots: runtime.State.slots.filter((slot: any) => slot.actionId === runtime.State.defaultActionId).length,
                routineMultiplier: selected ? selected.routineMultiplier : ((globalThis as any).getActiveRoutineMultiplier?.() || 1),
                upgradesMultiplier: Number(routineBreakdown?.upgradesMultiplier || 1)
            };
        }
    };
}
