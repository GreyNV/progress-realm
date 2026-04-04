import type { ContentRegistryData } from "../content/registry";
import { getLegacyRuntime } from "./runtime";

function normalizeRequirementRecord(record: Record<string, unknown> | undefined): Record<string, number> {
    return Object.fromEntries(Object.entries(record || {}).map(([key, value]) => [key, Number(value || 0)]));
}

function buildResearch(data: any) {
    return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        image: data.image || null,
        cost: data.cost || 0,
        requirements: {
            actionAssignments: normalizeRequirementRecord(data.requirements?.actionAssignments),
            encounterCompletions: normalizeRequirementRecord(data.requirements?.encounterCompletions),
            adventureCompletions: normalizeRequirementRecord(data.requirements?.adventureCompletions),
            inventory: normalizeRequirementRecord(data.requirements?.inventory)
        },
        unlocks: data.unlocks || [],
        done: data.done || false
    };
}

export function createResearchSystem(registry: ContentRegistryData) {
    return {
        research: [] as any[],
        async load() {
            this.research = registry.research.map((item) => buildResearch(item));
        },
        getCompletedCount() {
            const runtime = getLegacyRuntime();
            return this.research.filter((item) => runtime.State.researchCompleted.includes(item.id) || item.done).length;
        },
        getRequirementProgress(item: any) {
            const runtime = getLegacyRuntime();
            return {
                actionAssignments: Object.fromEntries(Object.entries(item.requirements.actionAssignments).map(([id, needed]) => [id, Math.min(Number(runtime.State.actionAssignments?.[id] || 0), Number(needed))])),
                encounterCompletions: Object.fromEntries(Object.entries(item.requirements.encounterCompletions).map(([id, needed]) => [id, Math.min(Number(runtime.State.encounterCompletions?.[id] || 0), Number(needed))])),
                adventureCompletions: Object.fromEntries(Object.entries(item.requirements.adventureCompletions).map(([id, needed]) => [id, Math.min(Number(runtime.State.adventureCompletions?.[id] || 0), Number(needed))])),
                inventory: Object.fromEntries(Object.entries(item.requirements.inventory).map(([id, needed]) => [id, Math.min(Number(runtime.State.inventory?.[id]?.quantity || 0), Number(needed))]))
            };
        },
        isUnlocked(item: any) {
            const runtime = getLegacyRuntime();
            const checkRecord = (required: Record<string, number>, actual: Record<string, number>) =>
                Object.entries(required).every(([id, needed]) => Number(actual[id] || 0) >= Number(needed || 0));
            return checkRecord(item.requirements.actionAssignments, runtime.State.actionAssignments || {}) &&
                checkRecord(item.requirements.encounterCompletions, runtime.State.encounterCompletions || {}) &&
                checkRecord(item.requirements.adventureCompletions, runtime.State.adventureCompletions || {}) &&
                Object.entries(item.requirements.inventory).every(([id, needed]) => Number(runtime.State.inventory?.[id]?.quantity || 0) >= Number(needed || 0));
        },
        describeRequirements(item: any) {
            const runtime = getLegacyRuntime();
            const sections: string[] = [];
            const addSection = (label: string, required: Record<string, number>, progress: Record<string, number>, formatter?: (id: string) => string) => {
                const entries = Object.entries(required);
                if (!entries.length) {
                    return;
                }
                sections.push(label);
                entries.forEach(([id, needed]) => {
                    sections.push(`${formatter ? formatter(id) : id}: ${Number(progress[id] || 0)}/${Number(needed)}`);
                });
            };
            const progress = this.getRequirementProgress(item);
            addSection(runtime.Lang?.ui?.("Routine Data") || "Routine Data", item.requirements.actionAssignments, progress.actionAssignments, (id) => runtime.actions?.[id]?.name || id);
            addSection(runtime.Lang?.ui?.("Encounter Data") || "Encounter Data", item.requirements.encounterCompletions, progress.encounterCompletions);
            addSection(runtime.Lang?.ui?.("Dungeon Data") || "Dungeon Data", item.requirements.adventureCompletions, progress.adventureCompletions, (id) => id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()));
            addSection(runtime.Lang?.ui?.("Field Samples") || "Field Samples", item.requirements.inventory, progress.inventory, (id) => {
                const itemDef = (globalThis as any).ItemGenerator?.itemList?.find((entry: any) => entry.id === id);
                return itemDef?.name || id;
            });
            return sections.join("\n");
        },
        purchase(id: string) {
            const runtime = getLegacyRuntime();
            const item = this.research.find((entry) => entry.id === id);
            if (!item) {
                return;
            }
            if (!this.isUnlocked(item)) {
                return;
            }
            if (!runtime.State.researchCompleted.includes(id)) {
                runtime.pushState("researchCompleted", id);
            }
            item.done = true;
            item.unlocks.forEach((actionId: string) => {
                if (runtime.actions?.[actionId]) {
                    runtime.actions[actionId].locked = false;
                    runtime.actions[actionId].hidden = false;
                }
                runtime.PubSub?.publish("unlock:action", actionId);
            });
            runtime.PubSub?.publish("research:updated");
            runtime.SaveSystem?.save();
        }
    };
}
