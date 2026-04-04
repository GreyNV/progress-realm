import { getLegacyRuntime } from "./runtime";

function clearQueuedAction(slot: any) {
    slot.queue = null;
    slot.queuedActionId = null;
}

function getActionBaseDuration(action: any): number {
    return Math.max(1, Number(action?.baseDuration || 10));
}

function getRoutineCycleDelta(runtime: any, action: any, delta: number): number {
    const speedMultiplier = Math.max(runtime.getActionSpeedMultiplier?.(action) || 1, 0.2);
    return (delta * runtime.State.time * speedMultiplier) / getActionBaseDuration(action);
}

function applyRoutineProgress(runtime: any, action: any, progressDelta: number) {
    if (!action?.baseYield?.stats || progressDelta <= 0) {
        return false;
    }
    // Completion rewards stay anchored to the base cycle so faster routines feel better
    // without inflating the stat curve at the same rate.
    const xpAmount = getActionBaseDuration(action) * progressDelta;
    let changed = false;
    Object.entries(action.baseYield.stats).forEach(([statKey, weight]) => {
        const stat = runtime.State.stats?.[statKey];
        if (!stat) {
            return;
        }
        const amount = xpAmount * Number(weight || 0);
        if (amount <= 0) {
            return;
        }
        runtime.StatSystem?.add(stat, amount);
        const masteryKey = runtime.PRESTIGE_MAP?.[statKey];
        if (masteryKey) {
            runtime.MasterySystem?.add?.(masteryKey, amount);
        }
        changed = true;
    });
    return changed;
}

export function createEngineSystems() {
    return {
        actionEngine: {
            start(slotIndex: number, actionId: string, options: Record<string, any> = {}) {
                const runtime = getLegacyRuntime();
                const slot = runtime.State.slots[slotIndex];
                const action = runtime.actions?.[actionId];
                if (!slot || !action) {
                    return;
                }
                runtime.updateState(["actionAssignments", actionId], (count: number) => (count || 0) + 1);
                slot.blocked = false;
                clearQueuedAction(slot);
                slot.actionId = actionId;
                slot.progress = typeof options.resumeProgress === "number"
                    ? options.resumeProgress
                    : 0;
                slot.text = action.name;
                runtime.updateSlotUI?.(slotIndex);
                runtime.PubSub?.publish("routines:changed", { slotIndex, actionId });
                runtime.SaveSystem?.save?.();
            },
            tick(delta: number) {
                const runtime = getLegacyRuntime();
                runtime.DeltaEngine?.calculate();
                runtime.DeltaEngine?.apply(delta, runtime.State.time);
                runtime.State.slots.forEach((slot: any, index: number) => {
                    if (!slot.actionId) {
                        return;
                    }
                    const furnitureSystem = (globalThis as any).FurnitureSystem;
                    if (furnitureSystem?.use) {
                        furnitureSystem.use(slot.actionId, delta * runtime.State.time);
                        if (!slot.actionId) {
                            return;
                        }
                    }
                    const action = runtime.actions?.[slot.actionId];
                    if (!action) {
                        return;
                    }
                    runtime.updateState(["actionRuntime", action.id], (seconds: number) => (seconds || 0) + (delta * runtime.State.time));
                    const progressDelta = getRoutineCycleDelta(runtime, action, delta);
                    if (applyRoutineProgress(runtime, action, progressDelta)) {
                        runtime.PubSub?.publish("stats:updated");
                    }
                    slot.progress = Number(slot.progress || 0) + progressDelta;
                    if (slot.progress >= 1) {
                        slot.progress -= Math.floor(slot.progress);
                    }
                    runtime.updateSlotUI?.(index);
                });
                runtime.SoftCapSystem?.apply?.();
                runtime.SaveSystem?.save();
            }
        },
        adventureEngine: {
            activeIndex: null as number | null,
            startSlot(i = 0) {
                const runtime = getLegacyRuntime();
                const slot = runtime.State.adventureSlots[i];
                const encounterGenerator = (globalThis as any).EncounterGenerator;
                if (!slot || !encounterGenerator) {
                    return;
                }
                let encounter = null;
                if (runtime.State.queuedEncounterId) {
                    encounter = encounterGenerator.encounters.find((entry: any) => entry.id === runtime.State.queuedEncounterId) || null;
                    runtime.setState("queuedEncounterId", null);
                } else {
                    encounter = encounterGenerator.randomEncounter();
                }
                slot.encounter = encounter;
                slot.duration = encounter ? encounter.getDuration() : 1;
                slot.progress = 0;
                slot.active = true;
                this.activeIndex = i;
                if (encounter && encounter.combat) {
                    runtime.CombatEngine?.start(encounter);
                }
                runtime.updateAdventureSlotUI?.(i);
            },
            completeEncounter(encounterId: string) {
                const runtime = getLegacyRuntime();
                const slot = this.activeIndex !== null ? runtime.State.adventureSlots[this.activeIndex] : null;
                const encounterGenerator = (globalThis as any).EncounterGenerator;
                if (!slot || !encounterGenerator) {
                    return;
                }
                const encounter = slot.encounter;
                encounterGenerator.resolve(slot.encounter);
                slot.active = false;
                slot.encounter = null;
                slot.progress = 0;
                runtime.PubSub?.publish("encounter:complete", encounterId);
                runtime.updateState("encounterStreak", (streak: number) => streak + 1);
                runtime.updateState(["encounterCompletions", encounterId], (count: number) => (count || 0) + 1);
                runtime.updateState(["adventureCompletions", encounter.dungeon || "frontier"], (count: number) => (count || 0) + 1);
                encounterGenerator.updateProgressBar();
                runtime.updateAdventureSlotUI?.(this.activeIndex!);
                if (runtime.State.encounterStreak >= 10) {
                    if (runtime.State.autoProgress) {
                        encounterGenerator.incrementLevel();
                        runtime.setState("encounterStreak", 0);
                        encounterGenerator.updateProgressBar();
                    } else {
                        runtime.setState("encounterStreak", 10);
                        encounterGenerator.updateProgressBar();
                    }
                }
                this.startSlot(this.activeIndex!);
            },
            handleCombatOutcome() {
                const runtime = getLegacyRuntime();
                if (!runtime.CombatEngine?.isActive()) {
                    return;
                }
                if (runtime.State.combat.phase === "victory") {
                    const encounterId = runtime.CombatEngine.finishVictory();
                    this.completeEncounter(encounterId);
                    return;
                }
                if (runtime.State.combat.phase === "defeat") {
                    runtime.CombatEngine.clear();
                    this.retreat("defeat");
                }
            },
            tick(delta: number) {
                const runtime = getLegacyRuntime();
                if (runtime.CombatEngine?.isActive()) {
                    runtime.CombatEngine.tick(delta);
                    this.handleCombatOutcome();
                    return;
                }
                const encounterQueueReady = (globalThis as any).encounterQueueReady;
                if (this.activeIndex === null) {
                    const queuedSlot = runtime.State.adventureSlots[0];
                    if (queuedSlot && queuedSlot.queue && encounterQueueReady && encounterQueueReady(queuedSlot.queue)) {
                        this.startSlot(0);
                        return;
                    }
                    if (runtime.State.healerGoneSeen) {
                        this.startSlot(0);
                    }
                    return;
                }
                const slot = runtime.State.adventureSlots[this.activeIndex];
                if (!slot?.encounter) {
                    return;
                }
                if (slot.encounter.combat) {
                    if (!runtime.CombatEngine?.isActive()) {
                        runtime.CombatEngine?.start(slot.encounter);
                    }
                    return;
                }
                if (slot.progress >= 1) {
                    this.completeEncounter(slot.encounter.id);
                } else {
                    runtime.updateAdventureSlotUI?.(this.activeIndex);
                }
            },
            retreat(resourceName: string, manual = false) {
                const runtime = getLegacyRuntime();
                const encounterGenerator = (globalThis as any).EncounterGenerator;
                const slot = this.activeIndex !== null ? runtime.State.adventureSlots[this.activeIndex] : null;
                const encounterName = slot && slot.encounter ? slot.encounter.name : "an encounter";
                const resLabel = (globalThis as any).Lang?.ui(resourceName) || resourceName;
                const msg = (globalThis as any).Lang?.log?.("retreat", { encounter: encounterName, resource: resLabel }) ||
                    `You had to retreat after ${encounterName} because you ran out of ${resLabel}.`;
                runtime.Log?.add({ text: msg, options: { encounter: true } });
                if (slot && slot.encounter) {
                    runtime.setState("queuedEncounterId", slot.encounter.id);
                    slot.active = false;
                    slot.progress = 0;
                    slot.encounter = null;
                    runtime.updateAdventureSlotUI?.(this.activeIndex!);
                }
                runtime.CombatEngine?.clear();
                encounterGenerator?.decrementLevel();
                encounterGenerator?.resetProgress();
            },
            checkHealth() {
                return false;
            }
        }
    };
}
