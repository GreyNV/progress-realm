import { describe, expect, it } from "vitest";
import { actionSchema, dungeonSchema, resourcesSchema } from "./schemas";

describe("content schemas", () => {
    it("accepts an action entry", () => {
        const parsed = actionSchema.parse({
            id: "training",
            name: "Training",
            level: 1,
            exp: 0,
            expToNext: 10,
            baseDuration: 10,
            activationCost: {},
            statFactors: {},
            baseYield: { stats: {}, resources: {}, exp: 1 },
            resourceConsumption: {}
        });
        expect(parsed.id).toBe("training");
    });

    it("accepts dungeon unlock metadata", () => {
        const parsed = dungeonSchema.parse({
            id: "frontier",
            name: "Frontier",
            unlock: { type: "always" }
        });
        expect(parsed.unlock?.type).toBe("always");
    });

    it("accepts stat-first resources payload", () => {
        const parsed = resourcesSchema.parse({
            stats: {
                strength: { value: 1, baseMax: 10, baseXpRequirement: 20 }
            },
            resources: {},
            prestige: {}
        });
        expect(parsed.stats.strength.value).toBe(1);
    });
});
