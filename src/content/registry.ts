import {
    loadActions,
    loadDungeons,
    loadEncounters,
    loadFurniture,
    loadHomes,
    loadItems,
    loadLanguage,
    loadLocations,
    loadResearch,
    loadRoutineUpgrades,
    loadResources,
    loadStoryEvents,
    loadUiLayout,
    loadUpdates
} from "./loaders";
import type {
    ActionContent,
    DungeonContent,
    EncounterContent,
    FurnitureContent,
    HomeContent,
    ItemContent,
    LanguageContent,
    LocationContent,
    ResearchContent,
    RoutineUpgradeContent,
    ResourcesContent,
    StoryEventContent,
    UiContent,
    UpdateContent
} from "./schemas";

export interface ContentRegistryData {
    actions: ActionContent[];
    dungeons: DungeonContent[];
    encounters: EncounterContent[];
    furniture: FurnitureContent[];
    homes: HomeContent[];
    items: ItemContent[];
    locations: LocationContent[];
    research: ResearchContent[];
    routineUpgrades: RoutineUpgradeContent[];
    resources: ResourcesContent;
    storyEvents: StoryEventContent[];
    uiLayout: UiContent;
    updates: UpdateContent[];
    languages: Record<string, LanguageContent>;
    getLanguage: (lang: string) => Promise<LanguageContent>;
}

export async function loadContentRegistry(): Promise<ContentRegistryData> {
    const [
        actions,
        dungeons,
        encounters,
        furniture,
        homes,
        items,
        locations,
        research,
        routineUpgrades,
        resources,
        storyEvents,
        uiLayout,
        updates
    ] = await Promise.all([
        loadActions(),
        loadDungeons(),
        loadEncounters(),
        loadFurniture(),
        loadHomes(),
        loadItems(),
        loadLocations(),
        loadResearch(),
        loadRoutineUpgrades(),
        loadResources(),
        loadStoryEvents(),
        loadUiLayout(),
        loadUpdates()
    ]);

    const languages: Record<string, LanguageContent> = {
        en: {}
    };

    return {
        actions,
        dungeons,
        encounters,
        furniture,
        homes,
        items,
        locations,
        research,
        routineUpgrades,
        resources,
        storyEvents,
        uiLayout,
        updates,
        languages,
        async getLanguage(lang: string): Promise<LanguageContent> {
            if (!languages[lang]) {
                languages[lang] = await loadLanguage(lang);
            }
            return languages[lang];
        }
    };
}
