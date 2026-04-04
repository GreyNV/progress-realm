import type { ActionContent, DungeonContent, UiContent } from "../content/schemas";
import type { ContentRegistryData } from "../content/registry";

interface UnlockResult {
    unlocked: boolean;
    reason: string;
    source: string;
}

interface UnlockConfig {
    type?: string;
    storyFlag?: string;
    encounterLevel?: number;
    dungeonClears?: Record<string, number>;
    stats?: Record<string, number>;
    totalStatLevels?: number;
    totalAdventureClears?: number;
}

function getStatLevel(state: Record<string, any>, statKey: string): number {
    const stat = state?.stats?.[statKey];
    return Number(stat?.level ?? stat?.value ?? 0);
}

function getTotalStatLevels(state: Record<string, any>): number {
    return Object.keys(state?.stats || {}).reduce((sum, statKey) => sum + getStatLevel(state, statKey), 0);
}

function getTotalAdventureClears(state: Record<string, any>): number {
    const clears = Object.values(state?.adventureCompletions || {}) as unknown[];
    return clears.reduce<number>((sum, value) => sum + Number(value || 0), 0);
}

function evaluateUnlockConfig(config: UnlockConfig | undefined, state: Record<string, any>, fallbackReason = "Available by default"): UnlockResult {
    if (!config || config.type === "always") {
        return { unlocked: true, reason: fallbackReason, source: "default" };
    }
    if (config.type === "never") {
        return { unlocked: false, reason: "Locked for future progression", source: "future" };
    }
    if (config.storyFlag && !state[config.storyFlag]) {
        return {
            unlocked: false,
            reason: `Requires story flag ${config.storyFlag}`,
            source: "story"
        };
    }
    if (config.encounterLevel && Number(state.encounterLevel || 1) < config.encounterLevel) {
        return {
            unlocked: false,
            reason: `Requires encounter level ${config.encounterLevel}`,
            source: "encounterLevel"
        };
    }
    if (config.stats) {
        const missingStat = Object.entries(config.stats).find(([statKey, needed]) => getStatLevel(state, statKey) < Number(needed));
        if (missingStat) {
            const [statKey, needed] = missingStat;
            return {
                unlocked: false,
                reason: `Requires ${statKey} Lv.${needed}`,
                source: "stats"
            };
        }
    }
    if (config.totalStatLevels && getTotalStatLevels(state) < Number(config.totalStatLevels)) {
        return {
            unlocked: false,
            reason: `Requires total stat levels ${config.totalStatLevels}`,
            source: "stats"
        };
    }
    if (config.dungeonClears) {
        const clears = state.adventureCompletions || {};
        const requirement = Object.entries(config.dungeonClears).find(([id, needed]) => Number(clears[id] || 0) < Number(needed));
        if (requirement) {
            return {
                unlocked: false,
                reason: `Requires ${requirement[0]} clears x${requirement[1]}`,
                source: "dungeonClears"
            };
        }
    }
    if (config.totalAdventureClears && getTotalAdventureClears(state) < Number(config.totalAdventureClears)) {
        return {
            unlocked: false,
            reason: `Requires total clears ${config.totalAdventureClears}`,
            source: "adventure"
        };
    }
    return { unlocked: true, reason: "Unlocked by progression", source: "progression" };
}

function evaluateDungeonUnlock(dungeon: DungeonContent | undefined, state: Record<string, any>): UnlockResult {
    if (!dungeon) {
        return { unlocked: true, reason: "Available by default", source: "default" };
    }
    return evaluateUnlockConfig(dungeon.unlock as UnlockConfig | undefined, state, "Available by default");
}

function evaluateTabUnlock(tabId: string, state: Record<string, any>, content: ContentRegistryData): UnlockResult {
    const tab = content.uiLayout?.tabs?.find((entry) => entry.id === tabId);
    const unlock = (tab as any)?.unlock as UnlockConfig | undefined;
    if (unlock) {
        return evaluateUnlockConfig(unlock, state, "Available by default");
    }
    return { unlocked: true, reason: "Available by default", source: "default" };
}

function evaluateActionUnlock(action: ActionContent | undefined): UnlockResult {
    if (!action) {
        return { unlocked: false, reason: "Unknown action", source: "content" };
    }
    if (action.id === "rest") {
        return { unlocked: true, reason: "Internal default action", source: "default" };
    }
    if (action.hidden || action.locked) {
        return { unlocked: false, reason: "Still hidden in content progression", source: "content" };
    }
    return { unlocked: true, reason: "Available by default", source: "default" };
}

export const progressionService = {
    isActionUnlocked(id: string, state: Record<string, any>, content: ContentRegistryData): boolean {
        return evaluateActionUnlock(content.actions.find((action) => action.id === id)).unlocked;
    },
    isDungeonUnlocked(id: string, state: Record<string, any>, content: ContentRegistryData): boolean {
        return evaluateDungeonUnlock(content.dungeons.find((dungeon) => dungeon.id === id), state).unlocked;
    },
    isTabUnlocked(id: string, state: Record<string, any>, content: ContentRegistryData): boolean {
        return evaluateTabUnlock(id, state, content).unlocked;
    },
    getUnlockReason(id: string, type: "action" | "dungeon" | "tab", state: Record<string, any>, content: ContentRegistryData): string {
        if (type === "action") {
            return evaluateActionUnlock(content.actions.find((action) => action.id === id)).reason;
        }
        if (type === "dungeon") {
            return evaluateDungeonUnlock(content.dungeons.find((dungeon) => dungeon.id === id), state).reason;
        }
        return evaluateTabUnlock(id, state, content).reason;
    },
    getUnlockSource(id: string, type: "action" | "dungeon" | "tab", state: Record<string, any>, content: ContentRegistryData): string {
        if (type === "action") {
            return evaluateActionUnlock(content.actions.find((action) => action.id === id)).source;
        }
        if (type === "dungeon") {
            return evaluateDungeonUnlock(content.dungeons.find((dungeon) => dungeon.id === id), state).source;
        }
        return evaluateTabUnlock(id, state, content).source;
    },
    getVisibleTabs(state: Record<string, any>, content: ContentRegistryData, tabs: UiContent["tabs"]) {
        return tabs.filter((tab) => !tab.hidden && !tab.locked && this.isTabUnlocked(tab.id, state, content));
    }
};
