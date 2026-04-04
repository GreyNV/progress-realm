import { describe, expect, it } from "vitest";
import { progressionService } from "./progressionService";
import type { ContentRegistryData } from "../content/registry";

const content = {
    actions: [{ id: "training", name: "Training", level: 1, exp: 0, expToNext: 10, activationCost: {}, statFactors: {}, baseYield: { stats: {}, resources: {}, exp: 1 }, resourceConsumption: {} }],
    dungeons: [
        { id: "frontier", name: "Frontier", unlock: { type: "always" } },
        { id: "deep_woods", name: "Deep Woods", unlock: { encounterLevel: 3, dungeonClears: { frontier: 2 } } }
    ],
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
            { id: "routines", name: "Routines" },
            { id: "adventure", name: "Adventure", unlock: { stats: { strength: 2, intelligence: 2 } } }
        ]
    },
    updates: [],
    languages: { en: {} },
    getLanguage: async () => ({})
} satisfies ContentRegistryData;

describe("progression service", () => {
    it("keeps frontier open at the start", () => {
        expect(progressionService.isDungeonUnlocked("frontier", { encounterLevel: 1, adventureCompletions: {} }, content)).toBe(true);
    });

    it("locks deeper routes behind progress", () => {
        expect(progressionService.isDungeonUnlocked("deep_woods", { encounterLevel: 1, adventureCompletions: {} }, content)).toBe(false);
    });

    it("keeps adventure locked until early training is complete", () => {
        expect(progressionService.isTabUnlocked("adventure", {
            stats: {
                strength: { level: 1 },
                intelligence: { level: 2 }
            }
        }, content)).toBe(false);
    });

    it("unlocks adventure after the required stat levels", () => {
        expect(progressionService.isTabUnlocked("adventure", {
            stats: {
                strength: { level: 2 },
                intelligence: { level: 2 }
            }
        }, content)).toBe(true);
    });
});
