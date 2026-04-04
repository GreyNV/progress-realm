import type { ContentRegistryData } from "../content/registry";
import { progressionService } from "../unlocks/progressionService";

function formatDungeonName(id: string | undefined): string {
    if (!id) {
        return "Frontier";
    }
    return id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getVisibleActions(state: any): any[] {
    const actions = Object.values((globalThis as any).actions || {}) as any[];
    return actions.filter((action) => action && !action.hidden && !action.locked && action.id !== state.defaultActionId);
}

function getCurrentActivity(state: any): string {
    const actions = (globalThis as any).actions || {};
    const current = (state.slots || [])
        .map((slot: any) => actions[slot.actionId])
        .find((action: any) => action && action.id !== state.defaultActionId);
    return current ? current.name : "Open Slot";
}

function formatStatLabel(statKey: string): string {
    return statKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getAdventureUnlockLabel(state: any, registry: ContentRegistryData): string {
    if (progressionService.isTabUnlocked("adventure", state, registry)) {
        return "Ready";
    }
    const adventureTab = registry.uiLayout?.tabs?.find((tab) => tab.id === "adventure");
    const statRequirements = ((adventureTab as any)?.unlock?.stats || {}) as Record<string, number>;
    const entries = Object.entries(statRequirements);
    if (!entries.length) {
        return progressionService.getUnlockReason("adventure", "tab", state, registry);
    }
    return entries
        .map(([statKey, required]) => `${formatStatLabel(statKey)} ${Math.min(getStatLevelValue(state, statKey), Number(required))}/${required}`)
        .join(" | ");
}

function getStatLevelValue(state: any, statKey: string): number {
    const stat = state?.stats?.[statKey];
    return Number(stat?.level ?? stat?.value ?? 0);
}

function getStatExpValue(state: any, statKey: string): number {
    return Number(state?.stats?.[statKey]?.exp ?? 0);
}

export function selectRecommendedAction(state: any, registry: ContentRegistryData): any | null {
    const candidates = registry.actions.filter((action) =>
        action &&
        !action.hidden &&
        !action.locked &&
        action.id !== state.defaultActionId
    );

    if (!candidates.length) {
        return null;
    }

    const rankedStats = Object.keys(state?.stats || {}).sort((a, b) => {
        const levelDiff = getStatLevelValue(state, a) - getStatLevelValue(state, b);
        if (levelDiff !== 0) {
            return levelDiff;
        }
        return getStatExpValue(state, a) - getStatExpValue(state, b);
    });

    const weakestStat = rankedStats[0] || null;
    const dungeonId = state.currentDungeon || "frontier";
    const dungeon = registry.dungeons.find((entry) => entry.id === dungeonId) || null;
    const routeStat = dungeon?.recommendedStat && dungeon.recommendedStat !== "balanced"
        ? dungeon.recommendedStat
        : null;
    const firstOpenSlot = (state.slots || []).findIndex((slot: any) => slot.actionId === state.defaultActionId);

    let bestAction = candidates[0];
    let bestScore = Number.NEGATIVE_INFINITY;

    candidates.forEach((action) => {
        let score = 0;
        const assignments = Number(state?.actionAssignments?.[action.id] || 0);
        const runtime = Number(state?.actionRuntime?.[action.id] || 0);
        const weakestFactor = weakestStat ? action.statFactors?.[weakestStat] : null;
        const routeFactor = routeStat ? action.statFactors?.[routeStat] : null;

        if (weakestFactor) {
            score += Number(weakestFactor.speed || 0) + Number(weakestFactor.output || 0);
        }
        if (routeFactor) {
            score += (Number(routeFactor.speed || 0) + Number(routeFactor.output || 0)) * 1.35;
        }

        score += Math.max(0, 4 - assignments) * 0.2;
        score += Math.max(0, 600 - runtime) / 6000;

        if (score > bestScore) {
            bestScore = score;
            bestAction = action;
        }
    });

    return {
        action: bestAction,
        weakestStat,
        routeStat,
        canAssignDirectly: firstOpenSlot !== -1,
        targetSlot: firstOpenSlot === -1 ? 0 : firstOpenSlot
    };
}

export function selectDashboardState(state: any, registry: ContentRegistryData) {
    return {
        currentActivity: getCurrentActivity(state),
        recommendedAction: selectRecommendedAction(state, registry),
        selectedDungeon: formatDungeonName(state.currentDungeon),
        encounterStreak: Number(state.encounterStreak || 0),
        availableRoutines: registry.actions.filter((action) => !action.hidden && !action.locked && action.id !== state.defaultActionId).length,
        routineMultiplier: (() => {
            const actions = (globalThis as any).actions || {};
            const active = (state.slots || [])
                .map((slot: any) => actions[slot.actionId])
                .find((action: any) => action && action.id !== state.defaultActionId);
            return active && typeof (globalThis as any).getActionSpeedMultiplier === "function"
                ? Number((globalThis as any).getActionSpeedMultiplier(active) || 1)
                : 1;
        })(),
        adventureUnlocked: progressionService.isTabUnlocked("adventure", state, registry),
        adventureUnlockLabel: getAdventureUnlockLabel(state, registry)
    };
}

export function selectRoutinesState(state: any, registry: ContentRegistryData) {
    return {
        visibleActions: registry.actions.filter((action) => !action.hidden),
        slots: state.slots || [],
        slotCount: Number(state.slotCount || 0)
    };
}

export function selectAdventureState(state: any, registry: ContentRegistryData) {
    return {
        currentDungeon: registry.dungeons.find((dungeon) => dungeon.id === state.currentDungeon) || null,
        encounterLevel: Number(state.encounterLevel || 1),
        encounterStreak: Number(state.encounterStreak || 0),
        dungeonClears: state.adventureCompletions || {}
    };
}

export function selectInventoryState(state: any, registry: ContentRegistryData) {
    return {
        equipment: state.equipment || {},
        inventory: state.inventory || {},
        homes: registry.homes,
        furniture: registry.furniture
    };
}

export function selectChipState(state: any, registry: ContentRegistryData) {
    return {
        updates: registry.updates,
        research: registry.research,
        completedResearch: state.researchCompleted || [],
        prestige: state.prestige || {}
    };
}
