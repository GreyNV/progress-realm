import { describe, expect, it } from "vitest";
import { selectDashboardState } from "./index";
import type { ContentRegistryData } from "../content/registry";

describe("selectors", () => {
    it("returns stable dashboard state", () => {
        (globalThis as any).actions = {
            training: { id: "training", name: "Training", hidden: false, locked: false },
            studying: { id: "studying", name: "Studying", hidden: false, locked: false }
        };
        const content = {
            actions: [
                { id: "training", name: "Training", level: 1, exp: 0, expToNext: 10, activationCost: {}, statFactors: {}, baseYield: { stats: {}, resources: {}, exp: 1 }, resourceConsumption: {} },
                { id: "studying", name: "Studying", level: 1, exp: 0, expToNext: 10, activationCost: {}, statFactors: {}, baseYield: { stats: {}, resources: {}, exp: 1 }, resourceConsumption: {} }
            ],
            dungeons: [],
            encounters: [],
            furniture: [],
            homes: [],
            items: [],
            locations: [],
            research: [],
            routineUpgrades: [],
            resources: { stats: {}, resources: {}, prestige: {} },
            storyEvents: [],
            uiLayout: {
                overviewModules: [],
                tabs: [
                    { id: "adventure", name: "Adventure", unlock: { stats: { strength: 2, intelligence: 2 } } }
                ]
            },
            updates: [],
            languages: { en: {} },
            getLanguage: async () => ({})
        } satisfies ContentRegistryData;
        const selected = selectDashboardState({
            currentDungeon: "frontier",
            encounterStreak: 2,
            defaultActionId: "rest",
            slots: [{ actionId: "training" }],
            stats: {
                strength: { level: 1, exp: 0 },
                intelligence: { level: 2, exp: 0 }
            }
        }, content);
        expect(selected.currentActivity).toBe("Training");
        expect(selected.availableRoutines).toBe(2);
        expect(selected.adventureUnlocked).toBe(false);
        expect(selected.adventureUnlockLabel).toContain("Strength 1/2");
    });
});
