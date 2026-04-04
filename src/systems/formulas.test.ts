import { beforeEach, describe, expect, it } from "vitest";
import { createFormulaSystem } from "./formulas";

describe("createFormulaSystem", () => {
    beforeEach(() => {
        const scope = globalThis as any;
        scope.State = {
            mastery: {},
            prestige: {
                wisdom: 4,
                instinct: 2
            }
        };
        scope.PRESTIGE_MAP = {
            intelligence: "wisdom",
        will: "instinct"
        };
        scope.getStatLevel = (key: string) => ({
            intelligence: 3,
        will: 2
        }[key] || 0);
        scope.RoutineUpgradeSystem = {
            getMultiplierForStat: () => 1
        };
    });

    it("separates current-run and mastery multipliers for action speed", () => {
        const formulas = createFormulaSystem();
        const action = {
            statFactors: {
                intelligence: { speed: 0.05 },
        will: { speed: 0.02 }
            }
        };

        const breakdown = formulas.getActionMultiplierBreakdown(action, "speed");

        const expectedCurrent = Math.pow(1.05, 3) * Math.pow(1.02, 2);
        const expectedMastery = Math.pow(1.01, 4) * Math.pow(1.004, 2);

        expect(breakdown.currentMultiplier).toBeCloseTo(expectedCurrent, 8);
        expect(breakdown.masteryMultiplier).toBeCloseTo(expectedMastery, 8);
        expect(breakdown.totalMultiplier).toBeCloseTo(expectedCurrent * expectedMastery, 8);
        expect(formulas.getActionSpeedMultiplier(action)).toBeCloseTo(expectedCurrent * expectedMastery, 8);
    });

    it("adds routine upgrades as a third multiplicative layer", () => {
        const scope = globalThis as any;
        scope.RoutineUpgradeSystem = {
            getMultiplierForStat: (key: string) => key === "intelligence" ? 1.15 : 1
        };

        const formulas = createFormulaSystem();
        const action = {
            statFactors: {
                intelligence: { speed: 0.05 }
            }
        };

        const breakdown = formulas.getActionMultiplierBreakdown(action, "speed");
        const expectedCurrent = Math.pow(1.05, 3);
        const expectedMastery = Math.pow(1.01, 4);

        expect(breakdown.upgradesMultiplier).toBeCloseTo(1.15, 8);
        expect(breakdown.totalMultiplier).toBeCloseTo(expectedCurrent * expectedMastery * 1.15, 8);
    });
});
