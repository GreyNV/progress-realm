import { beforeEach, describe, expect, it, vi } from "vitest";
import { installLegacyAppGlobals } from "./legacyGlobals";

describe("SaveSystem persistence", () => {
    beforeEach(() => {
        const storage = new Map<string, string>();
        const scope = globalThis as any;

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
        scope.State = {
            stats: {
                intelligence: { value: 0, baseMax: 20, baseXpRequirement: 20, level: 0, exp: 0, expToNext: 20 }
            },
            resources: {},
            prestige: { wisdom: 3 },
            mastery: {},
            slots: [],
            defaultActionId: "rest"
        };
        scope.actions = {
            studying: { id: "studying", hidden: false, locked: false }
        };
        scope.RESOURCE_KEYS = [];
        scope.STAT_KEYS = ["intelligence"];
        scope.PRESTIGE_KEYS = ["wisdom"];
        scope.PRESTIGE_MAP = { intelligence: "wisdom" };
        scope.createDefaultEquipment = () => ({ rightHand: null });
        scope.createDefaultCombatState = () => ({ active: false });
        scope.mergeState = vi.fn((value: Record<string, unknown>) => Object.assign(scope.State, value));
        scope.ensureResource = vi.fn();
        scope.ensureStat = vi.fn();
        scope.ensureMastery = vi.fn();
        scope.setState = vi.fn();
        scope.applyPrestigeBonuses = vi.fn();
        scope.loadBaseData = vi.fn();
    });

    it("backfills mastery state from persisted prestige levels during load", () => {
        const scope = globalThis as any;
        installLegacyAppGlobals();

        scope.localStorage.setItem("progressRealmSave", JSON.stringify({
            version: 3,
            state: {
                stats: {
                    intelligence: { value: 0, baseMax: 20, baseXpRequirement: 20, level: 0, exp: 0, expToNext: 20 }
                },
                resources: {},
                prestige: { wisdom: 3 },
                slots: [],
                defaultActionId: "rest"
            },
            actions: {}
        }));

        scope.SaveSystem.load();

        expect(scope.ensureMastery).toHaveBeenCalledWith("wisdom", 3, 20);
    });

    it("preserves mastery xp during load when saved mastery state exists", () => {
        const scope = globalThis as any;
        scope.ensureMastery = vi.fn((key: string, level: number, baseXpRequirement: number) => {
            scope.State.mastery[key] = {
                level,
                exp: 0,
                expToNext: baseXpRequirement,
                baseXpRequirement
            };
            scope.State.prestige[key] = level;
        });
        installLegacyAppGlobals();

        scope.localStorage.setItem("progressRealmSave", JSON.stringify({
            version: 3,
            state: {
                stats: {
                    intelligence: { value: 0, baseMax: 20, baseXpRequirement: 20, level: 0, exp: 0, expToNext: 20 }
                },
                resources: {},
                prestige: { wisdom: 3 },
                mastery: {
                    wisdom: { level: 3, exp: 9, expToNext: 20, baseXpRequirement: 20 }
                },
                slots: [],
                defaultActionId: "rest"
            },
            actions: {}
        }));

        scope.SaveSystem.load();

        expect(scope.State.mastery.wisdom.level).toBe(3);
        expect(scope.State.mastery.wisdom.exp).toBe(9);
        expect(scope.State.mastery.wisdom.expToNext).toBe(20);
    });

    it("quarantines invalid saves when migration fails", () => {
        const scope = globalThis as any;
        scope.window.__saveMigrationService = {
            migrate: vi.fn(() => null)
        };
        installLegacyAppGlobals();

        scope.localStorage.setItem("progressRealmSave", "{\"broken\":true}");
        scope.SaveSystem.load();

        expect(scope.localStorage.removeItem).toHaveBeenCalledWith("progressRealmSave");
        expect(scope.localStorage.setItem).toHaveBeenCalledWith(
            expect.stringMatching(/^progressRealmSave\.invalid\./),
            "{\"broken\":true}"
        );
    });

    it("round-trips the current state and saved action visibility", () => {
        const scope = globalThis as any;
        installLegacyAppGlobals();

        scope.State.language = "ua";
        scope.State.stats.intelligence.exp = 7.5;
        scope.actions.studying.hidden = true;

        scope.SaveSystem.save();
        const loadedActions = scope.SaveSystem.load();

        expect(scope.localStorage.setItem).toHaveBeenCalledWith(
            "progressRealmSave",
            expect.stringContaining("\"language\":\"ua\"")
        );
        expect(scope.State.language).toBe("ua");
        expect(scope.State.stats.intelligence.exp).toBe(7.5);
        expect(loadedActions).toEqual({
            studying: { hidden: true, locked: false }
        });
    });

    it("remaps legacy stat keys into the simplified five-stat model during load", () => {
        const scope = globalThis as any;
        scope.State.stats = {
            strength: { value: 0, baseMax: 20, baseXpRequirement: 20, level: 0, exp: 0, expToNext: 20 },
            intelligence: { value: 1, baseMax: 22, baseXpRequirement: 22, level: 1, exp: 2, expToNext: 33 },
            agility: { value: 0, baseMax: 18, baseXpRequirement: 18, level: 0, exp: 0, expToNext: 18 },
            constitution: { value: 0, baseMax: 24, baseXpRequirement: 24, level: 0, exp: 0, expToNext: 24 },
            will: { value: 0, baseMax: 18, baseXpRequirement: 18, level: 0, exp: 0, expToNext: 18 }
        };
        scope.STAT_KEYS = ["strength", "intelligence", "agility", "constitution", "will"];
        scope.PRESTIGE_KEYS = ["constitution", "wisdom", "reflexes", "vigor", "instinct"];
        scope.PRESTIGE_MAP = {
            strength: "constitution",
            intelligence: "wisdom",
            agility: "reflexes",
            constitution: "vigor",
            will: "instinct"
        };
        installLegacyAppGlobals();

        scope.localStorage.setItem("progressRealmSave", JSON.stringify({
            version: 3,
            state: {
                stats: {
                    intelligence: { value: 1, baseMax: 22, baseXpRequirement: 22, level: 1, exp: 2, expToNext: 33 },
                    dexterity: { value: 3, baseMax: 18, baseXpRequirement: 18, level: 3, exp: 4, expToNext: 60 },
                    endurance: { value: 4, baseMax: 24, baseXpRequirement: 24, level: 4, exp: 5, expToNext: 81 },
                    awareness: { value: 2, baseMax: 18, baseXpRequirement: 18, level: 2, exp: 6, expToNext: 41 },
                    craftsmanship: { value: 5, baseMax: 26, baseXpRequirement: 26, level: 5, exp: 7, expToNext: 90 }
                },
                resources: {},
                prestige: { wisdom: 1, reflexes: 2, vigor: 3, instinct: 4, constitution: 5 },
                routineUpgrades: { layout_tools: 2 },
                slots: [],
                defaultActionId: "rest"
            },
            actions: {}
        }));

        scope.SaveSystem.load();

        expect(scope.State.stats.agility.level).toBe(3);
        expect(scope.State.stats.constitution.level).toBe(4);
        expect(scope.State.stats.will.level).toBe(2);
        expect(scope.State.stats.intelligence.level).toBe(6);
        expect(scope.State.stats.intelligence.exp).toBe(9);
        expect(scope.State.routineUpgrades.field_notebook).toBe(2);
        expect(scope.State.stats.dexterity).toBeUndefined();
        expect(scope.State.stats.endurance).toBeUndefined();
        expect(scope.State.stats.awareness).toBeUndefined();
        expect(scope.State.stats.craftsmanship).toBeUndefined();
    });

    it("keeps mastery progress through prestige resets", async () => {
        const scope = globalThis as any;
        scope.State = {
            age: { years: 33, days: 0 },
            stats: {
                intelligence: { value: 24, baseMax: 20, baseXpRequirement: 20, level: 24, exp: 0, expToNext: 20 }
            },
            resources: {},
            prestige: { wisdom: 3 },
            mastery: {
                wisdom: { level: 3, exp: 11, expToNext: 20, baseXpRequirement: 20 }
            },
            slots: [],
            adventureSlots: [],
            inventory: {},
            equipment: { rightHand: "iron_sword" },
            furniture: [],
            researchCompleted: [],
            actionAssignments: {},
            actionRuntime: {},
            routineUpgrades: {},
            encounterCompletions: {},
            adventureCompletions: {},
            defaultActionId: "rest",
            encounterLevel: 2,
            encounterStreak: 1,
            currentDungeon: "frontier",
            prestiging: false
        };
        scope.PRESTIGE_KEYS = ["wisdom"];
        scope.PRESTIGE_MAP = { intelligence: "wisdom" };
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
        scope.ensureMastery = vi.fn((key: string, level: number, baseXpRequirement: number) => {
            scope.State.mastery[key] = {
                level,
                exp: scope.State.mastery[key]?.exp || 0,
                expToNext: Math.max(1, baseXpRequirement),
                baseXpRequirement
            };
            scope.State.prestige[key] = level;
        });
        scope.loadBaseData = vi.fn(async () => {
            scope.State.stats = {
                intelligence: { value: 0, baseMax: 20, baseXpRequirement: 20, level: 0, exp: 0, expToNext: 20 }
            };
            scope.State.resources = {};
            scope.State.prestige = { wisdom: 0 };
            scope.State.mastery = {};
        });
        installLegacyAppGlobals();

        await scope.SaveSystem.prestige();

        expect(scope.State.prestige.wisdom).toBe(5);
        expect(scope.State.mastery.wisdom.level).toBe(5);
        expect(scope.State.mastery.wisdom.exp).toBe(11);
        expect(scope.window.location.reload).toHaveBeenCalled();
    });
});
