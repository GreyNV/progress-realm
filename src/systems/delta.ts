import { getLegacyRuntime } from "./runtime";

export function createDeltaSystem(formulas: ReturnType<typeof import("./formulas").createFormulaSystem>) {
    const statDeltas: Record<string, number> = {};
    const resourceDeltas: Record<string, number> = {};
    let ageDelta = 0;
    const encounterProgressDeltas: number[] = [];

    return {
        statDeltas,
        resourceDeltas,
        encounterProgressDeltas,
        calculate() {
            const runtime = getLegacyRuntime();
            (runtime.STAT_KEYS || []).forEach((key) => { statDeltas[key] = 0; });
            (runtime.RESOURCE_KEYS || []).forEach((key) => { resourceDeltas[key] = 0; });
            ageDelta = 1;

            runtime.State.slots.forEach((slot: any) => {
                if (!slot.actionId || slot.blocked) {
                    return;
                }
            });

            encounterProgressDeltas.length = runtime.State.adventureSlots.length;
            runtime.State.adventureSlots.forEach((slot: any, index: number) => {
                encounterProgressDeltas[index] = 0;
                if (!slot.active || !slot.encounter || slot.encounter.combat) {
                    return;
                }
                encounterProgressDeltas[index] = 1 / slot.duration;
            });
        },
        apply(deltaSeconds: number, mult = 1) {
            const runtime = getLegacyRuntime();
            let statsChanged = false;
            (runtime.STAT_KEYS || []).forEach((key) => {
                const base = (statDeltas[key] || 0) * deltaSeconds * mult;
                const delta = runtime.BonusEngine?.applyStat ? runtime.BonusEngine.applyStat(base, key) : base;
                const beforeLevel = runtime.State.stats[key].level;
                const beforeExp = runtime.State.stats[key].exp;
                runtime.StatSystem?.add(runtime.State.stats[key], delta);
                if (runtime.State.stats[key].level !== beforeLevel || runtime.State.stats[key].exp !== beforeExp || delta !== 0) {
                    statsChanged = true;
                }
            });
            runtime.AgeSystem?.addDays(ageDelta * deltaSeconds * mult);
            runtime.State.adventureSlots.forEach((slot: any, index: number) => {
                if (!slot.active || !slot.encounter) {
                    return;
                }
                slot.progress += (encounterProgressDeltas[index] || 0) * deltaSeconds * mult;
            });
            if (statsChanged) {
                runtime.PubSub?.publish("stats:updated");
            }
        }
    };
}
