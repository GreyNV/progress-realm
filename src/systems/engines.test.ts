import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEngineSystems } from "./engines";

describe("createEngineSystems", () => {
    beforeEach(() => {
        const scope = globalThis as any;
        scope.State = {
            time: 1,
            slots: [
                {
                    actionId: "studying",
                    progress: 0
                }
            ],
            stats: {
                intelligence: { level: 0, exp: 0 }
            },
            mastery: {
                wisdom: { level: 0, exp: 0, expToNext: 20, baseXpRequirement: 20 }
            },
            prestige: {
                wisdom: 0
            }
        };
        scope.PRESTIGE_MAP = { intelligence: "wisdom" };
        scope.actions = {
            studying: {
                id: "studying",
                baseDuration: 10,
                baseYield: {
                    stats: {
                        intelligence: 1
                    }
                }
            }
        };
        scope.StatSystem = { add: vi.fn() };
        scope.MasterySystem = { add: vi.fn() };
        scope.DeltaEngine = { calculate: vi.fn(), apply: vi.fn() };
        scope.SoftCapSystem = { apply: vi.fn() };
        scope.SaveSystem = { save: vi.fn() };
        scope.updateSlotUI = vi.fn();
        scope.updateState = vi.fn();
        scope.PubSub = { publish: vi.fn() };
        scope.getActionSpeedMultiplier = () => 1;
    });

    it("grants routine xp gradually from progress instead of waiting for completion", () => {
        const systems = createEngineSystems();

        systems.actionEngine.tick(2);

        expect((globalThis as any).StatSystem.add).toHaveBeenCalledWith((globalThis as any).State.stats.intelligence, 2);
        expect((globalThis as any).State.slots[0].progress).toBeCloseTo(0.2, 8);
    });

    it("mirrors routine xp into the mapped mastery track", () => {
        const systems = createEngineSystems();

        systems.actionEngine.tick(2);

        expect((globalThis as any).MasterySystem.add).toHaveBeenCalledWith("wisdom", 2);
    });

    it("uses the routine speed multiplier to accelerate slot progress", () => {
        const systems = createEngineSystems();
        (globalThis as any).getActionSpeedMultiplier = () => 2;

        systems.actionEngine.tick(2);

        expect((globalThis as any).State.slots[0].progress).toBeCloseTo(0.4, 8);
        expect((globalThis as any).StatSystem.add).toHaveBeenCalledWith((globalThis as any).State.stats.intelligence, 4);
    });
});
