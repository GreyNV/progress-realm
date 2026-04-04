import { z } from "zod";

const numericRecord = z.record(z.string(), z.number()).default({});
const statFactorSchema = z.object({
    speed: z.number().optional(),
    output: z.number().optional()
}).passthrough();

const unlockSchema = z.object({
    type: z.string().optional(),
    storyFlag: z.string().optional(),
    encounterLevel: z.number().optional(),
    dungeonClears: z.record(z.string(), z.number()).optional()
}).passthrough();

const dashboardSchema = z.object({
    cardTitle: z.string().optional(),
    accent: z.string().optional(),
    description: z.string().optional(),
    cta: z.string().optional(),
    summaryMetrics: z.array(z.string()).optional(),
    workspaceSections: z.array(z.string()).optional()
}).passthrough();

const sectionSchema = z.object({
    id: z.string(),
    name: z.string(),
    hidden: z.boolean().optional(),
    locked: z.boolean().optional()
}).passthrough();

export const actionSchema = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional(),
    hidden: z.boolean().optional(),
    locked: z.boolean().optional(),
    level: z.number(),
    exp: z.number(),
    expToNext: z.number(),
    baseDuration: z.number().optional(),
    activationCost: z.record(z.string(), z.number()).default({}),
    statFactors: z.record(z.string(), statFactorSchema).default({}),
    baseYield: z.object({
        stats: numericRecord,
        resources: numericRecord,
        exp: z.number().default(0)
    }).passthrough(),
    scaling: z.object({
        type: z.string().optional(),
        base: z.number().optional(),
        multiplier: z.number().optional(),
        softcapLevel: z.number().optional(),
        falloff: z.number().optional()
    }).passthrough().optional(),
    resourceConsumption: z.record(z.string(), z.number()).default({})
}).passthrough();

export const dungeonSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    recommendedStat: z.string().optional(),
    hiddenUntilUnlocked: z.boolean().optional(),
    unlock: unlockSchema.optional()
}).passthrough();

export const encounterSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    rarity: z.string().optional(),
    category: z.string().optional(),
    baseDuration: z.number().optional(),
    minLevel: z.number().optional(),
    storyLevel: z.number().optional(),
    resourceConsumption: z.record(z.string(), z.number()).default({}),
    weight: z.number().optional(),
    dungeon: z.string().optional(),
    statFactors: z.record(z.string(), statFactorSchema).default({}),
    items: z.any().optional(),
    loot: z.record(z.string(), z.any()).optional(),
    combat: z.boolean().optional(),
    enemy: z.record(z.string(), z.any()).optional()
}).passthrough();

export const itemSchema = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional()
}).passthrough();

export const homeSchema = z.object({
    id: z.string(),
    name: z.string()
}).passthrough();

export const furnitureSchema = z.object({
    id: z.string(),
    name: z.string()
}).passthrough();

export const researchSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    requirements: z.object({
        actionAssignments: z.record(z.string(), z.number()).optional(),
        encounterCompletions: z.record(z.string(), z.number()).optional(),
        adventureCompletions: z.record(z.string(), z.number()).optional(),
        inventory: z.record(z.string(), z.number()).optional()
    }).optional()
}).passthrough();

export const updateSchema = z.object({
    id: z.string(),
    name: z.string().optional()
}).passthrough();

export const routineUpgradeSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    stat: z.string(),
    perLevel: z.number(),
    maxLevel: z.number().optional(),
    cost: z.record(z.string(), z.number()).default({})
}).passthrough();

export const locationSchema = z.object({
    level: z.number(),
    name: z.string()
}).passthrough();

export const resourcesSchema = z.object({
    stats: z.record(z.string(), z.object({
        value: z.number(),
        baseMax: z.number(),
        baseXpRequirement: z.number().optional(),
        exp: z.number().optional(),
        expToNext: z.number().optional(),
        description: z.string().optional()
    }).passthrough()).default({}),
    resources: z.record(z.string(), z.object({
        value: z.number(),
        baseMax: z.number(),
        description: z.string().optional()
    }).passthrough()).default({}),
    prestige: z.record(z.string(), z.union([
        z.number(),
        z.object({
            value: z.number().optional(),
            description: z.string().optional()
        }).passthrough()
    ])).default({})
}).passthrough();

export const storyEventSchema = z.object({
    id: z.string()
}).passthrough();

export const uiSchema = z.object({
    overviewModules: z.array(z.object({
        id: z.string(),
        order: z.number().optional(),
        span: z.string().optional()
    }).passthrough()).default([]),
    tabs: z.array(z.object({
        id: z.string(),
        name: z.string(),
        hidden: z.boolean().optional(),
        locked: z.boolean().optional(),
        overviewVisible: z.boolean().optional(),
        dashboard: dashboardSchema.optional(),
        sections: z.array(sectionSchema).optional()
    }).passthrough()).default([])
}).passthrough();

export const languageSchema = z.object({
    ui: z.record(z.string(), z.string()).optional(),
    stats: z.record(z.string(), z.string()).optional(),
    statDescriptions: z.record(z.string(), z.string()).optional(),
    resources: z.record(z.string(), z.string()).optional(),
    resourceDescriptions: z.record(z.string(), z.string()).optional(),
    prestigeDescriptions: z.record(z.string(), z.string()).optional(),
    effects: z.record(z.string(), z.string()).optional(),
    story: z.record(z.string(), z.string()).optional(),
    log: z.record(z.string(), z.string()).optional(),
    actions: z.record(z.string(), z.object({
        name: z.string().optional(),
        description: z.string().optional()
    })).optional(),
    items: z.record(z.string(), z.object({
        name: z.string().optional(),
        description: z.string().optional()
    })).optional(),
    encounters: z.record(z.string(), z.object({
        name: z.string().optional(),
        description: z.string().optional()
    })).optional(),
    locations: z.record(z.string(), z.string()).optional()
}).passthrough();

export type ActionContent = z.infer<typeof actionSchema>;
export type DungeonContent = z.infer<typeof dungeonSchema>;
export type EncounterContent = z.infer<typeof encounterSchema>;
export type ItemContent = z.infer<typeof itemSchema>;
export type HomeContent = z.infer<typeof homeSchema>;
export type FurnitureContent = z.infer<typeof furnitureSchema>;
export type ResearchContent = z.infer<typeof researchSchema>;
export type UpdateContent = z.infer<typeof updateSchema>;
export type RoutineUpgradeContent = z.infer<typeof routineUpgradeSchema>;
export type LocationContent = z.infer<typeof locationSchema>;
export type ResourcesContent = z.infer<typeof resourcesSchema>;
export type StoryEventContent = z.infer<typeof storyEventSchema>;
export type UiContent = z.infer<typeof uiSchema>;
export type LanguageContent = z.infer<typeof languageSchema>;
