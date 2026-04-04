import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFormulaSystem } from "./formulas";
import { installLegacyAppGlobals } from "../app/legacyGlobals";

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

    it("uses restored mastery levels instead of stale prestige values after load", () => {
        const scope = globalThis as any;
        const storage = new Map<string, string>();
        scope.localStorage = {
            getItem: vi.fn((key: string) => storage.get(key) ?? null),
            setItem: vi.fn((key: string, value: string) => {
                storage.set(key, value);
            }),
            removeItem: vi.fn((key: string) => {
                storage.delete(key);
            })
        };
        scope.window = { __saveMigrationService: null, location: { reload: vi.fn() } };
        scope.VERSION = 3;
        scope.RESOURCE_KEYS = [];
        scope.STAT_KEYS = ["intelligence"];
        scope.PRESTIGE_KEYS = ["wisdom"];
        scope.createDefaultEquipment = () => ({ rightHand: null });
        scope.createDefaultCombatState = () => ({ active: false });
        scope.mergeState = vi.fn((value: Record<string, unknown>) => Object.assign(scope.State, value));
        scope.ensureResource = vi.fn();
        scope.ensureStat = vi.fn();
        scope.ensureMastery = vi.fn((key: string, level: number, baseXpRequirement: number) => {
            scope.State.mastery[key] = {
                level,
                exp: 0,
                expToNext: baseXpRequirement,
                baseXpRequirement
            };
            scope.State.prestige[key] = level;
        });
        scope.setState = vi.fn((path: string | string[], value: unknown) => {
            const parts = Array.isArray(path) ? path : path.split(".");
            let obj = scope.State;
            for (let i = 0; i < parts.length - 1; i += 1) {
                if (obj[parts[i]] === undefined) {
                    obj[parts[i]] = {};
                }
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
        });
        scope.applyPrestigeBonuses = vi.fn();
        scope.loadBaseData = vi.fn();
        scope.State = {
            stats: {
                intelligence: { value: 3, baseMax: 20, baseXpRequirement: 20, level: 3, exp: 0, expToNext: 20 }
            },
            resources: {},
            prestige: { wisdom: 1 },
            mastery: {},
            slots: [],
            defaultActionId: "rest"
        };

        installLegacyAppGlobals();

        scope.localStorage.setItem("progressRealmSave", JSON.stringify({
            version: 3,
            state: {
                stats: {
                    intelligence: { value: 3, baseMax: 20, baseXpRequirement: 20, level: 3, exp: 0, expToNext: 20 }
                },
                resources: {},
                prestige: { wisdom: 1 },
                mastery: {
                    wisdom: { level: 4, exp: 0, expToNext: 20, baseXpRequirement: 20 }
                },
                slots: [],
                defaultActionId: "rest"
            },
            actions: {}
        }));

        scope.SaveSystem.load();

        const formulas = createFormulaSystem();
        const action = {
            statFactors: {
                intelligence: { speed: 0.05 }
            }
        };
        const breakdown = formulas.getActionMultiplierBreakdown(action, "speed");

        expect(scope.State.mastery.wisdom.level).toBe(4);
        expect(scope.State.prestige.wisdom).toBe(4);
        expect(breakdown.masteryMultiplier).toBeCloseTo(Math.pow(1.01, 4), 8);
        expect(breakdown.totalMultiplier).toBeCloseTo(Math.pow(1.05, 3) * Math.pow(1.01, 4), 8);
    });
});
