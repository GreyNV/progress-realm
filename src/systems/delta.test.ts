import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeltaSystem } from "./delta";

describe("createDeltaSystem", () => {
    beforeEach(() => {
        const scope = globalThis as any;
        scope.State = {
            slots: [],
            adventureSlots: [],
            stats: {
                strength: { level: 0, exp: 0 },
                intelligence: { level: 0, exp: 0 },
                agility: { level: 0, exp: 0 },
                constitution: { level: 0, exp: 0 },
                will: { level: 0, exp: 0 }
            }
        };
        scope.STAT_KEYS = ["strength", "intelligence", "agility", "constitution", "will"];
        scope.RESOURCE_KEYS = [];
        scope.BonusEngine = { applyStat: (value: number) => value };
        scope.StatSystem = { add: vi.fn() };
        scope.AgeSystem = { addDays: vi.fn() };
        scope.PubSub = { publish: vi.fn() };
    });

    it("initializes delta buckets for every configured stat key", () => {
        const delta = createDeltaSystem({
            getActionSpeedMultiplier: () => 1,
            getActionOutputMultiplier: () => 1
        } as any);

        delta.calculate();

        expect(delta.statDeltas.agility).toBe(0);
        expect(delta.statDeltas.constitution).toBe(0);
        expect(delta.statDeltas.will).toBe(0);
    });
});
