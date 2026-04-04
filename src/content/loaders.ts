import { z } from "zod";
import {
    actionSchema,
    dungeonSchema,
    encounterSchema,
    furnitureSchema,
    homeSchema,
    itemSchema,
    languageSchema,
    locationSchema,
    researchSchema,
    routineUpgradeSchema,
    resourcesSchema,
    storyEventSchema,
    uiSchema,
    updateSchema,
    type ActionContent,
    type DungeonContent,
    type EncounterContent,
    type FurnitureContent,
    type HomeContent,
    type ItemContent,
    type LanguageContent,
    type LocationContent,
    type ResearchContent,
    type RoutineUpgradeContent,
    type ResourcesContent,
    type StoryEventContent,
    type UiContent,
    type UpdateContent
} from "./schemas";

async function fetchJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    const json = await response.json();
    return schema.parse(json);
}

export function loadActions(): Promise<ActionContent[]> {
    return fetchJson("/data/actions.json", z.array(actionSchema));
}

export function loadDungeons(): Promise<DungeonContent[]> {
    return fetchJson("/data/dungeons.json", z.array(dungeonSchema));
}

export function loadEncounters(): Promise<EncounterContent[]> {
    return fetchJson("/data/encounters.json", z.array(encounterSchema));
}

export function loadFurniture(): Promise<FurnitureContent[]> {
    return fetchJson("/data/furniture.json", z.array(furnitureSchema));
}

export function loadHomes(): Promise<HomeContent[]> {
    return fetchJson("/data/homes.json", z.array(homeSchema));
}

export function loadItems(): Promise<ItemContent[]> {
    return fetchJson("/data/items.json", z.array(itemSchema));
}

export function loadLocations(): Promise<LocationContent[]> {
    return fetchJson("/data/locations.json", z.array(locationSchema));
}

export function loadResearch(): Promise<ResearchContent[]> {
    return fetchJson("/data/research.json", z.array(researchSchema));
}

export function loadRoutineUpgrades(): Promise<RoutineUpgradeContent[]> {
    return fetchJson("/data/routine_upgrades.json", z.array(routineUpgradeSchema));
}

export function loadResources(): Promise<ResourcesContent> {
    return fetchJson("/data/resources.json", resourcesSchema);
}

export function loadStoryEvents(): Promise<StoryEventContent[]> {
    return fetchJson("/data/story_events.json", z.array(storyEventSchema));
}

export function loadUiLayout(): Promise<UiContent> {
    return fetchJson("/data/ui.json", uiSchema);
}

export function loadUpdates(): Promise<UpdateContent[]> {
    return fetchJson("/data/updates.json", z.array(updateSchema));
}

export async function loadLanguage(lang: string): Promise<LanguageContent> {
    if (lang === "en") {
        return languageSchema.parse({});
    }
    return fetchJson(`/data/lang/${lang}.json`, languageSchema);
}
