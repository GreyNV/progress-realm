export interface LegacyRuntime {
    State: any;
    setState: (path: string | string[], value: unknown) => void;
    updateState: (path: string | string[], fn: (value: any) => any) => void;
    pushState: (path: string | string[], value: unknown) => void;
    deleteState: (path: string | string[], value?: unknown) => void;
    PubSub?: { publish: (event: string, payload?: unknown) => void };
    SoftCapSystem?: { recalculateCaps: (inventory: Record<string, unknown>) => void; apply?: () => void };
    Utils?: { weightedRandomChoice: <T>(pool: T[], weights: number[]) => T; formatCost?: (cost: Record<string, number>) => string };
    Lang?: {
        effect: (key: string) => string | null;
        stat: (key: string) => string | null;
        resource: (key: string) => string | null;
        ui?: (key: string) => string | null;
        log?: (key: string, params?: Record<string, unknown>) => string | null;
    };
    BonusEngine?: { statAdditions: Record<string, number>; applyStat?: (base: number, key: string) => number };
    AgeSystem?: { addDays: (days: number) => void };
    StatSystem?: { add: (stat: any, amount: number) => void };
    ResourceSystem?: { add: (resource: any, amount: number) => void };
    StorySystem?: { trigger: (id: string) => void };
    TabManager?: { unlockTab: (id: string) => void };
    EncounterGenerator?: any;
    SaveSystem?: { save: () => void };
    ActionEngine?: { start: (slotIndex: number, actionId: string, options?: Record<string, unknown>) => void };
    CombatEngine?: {
        start: (encounter: any) => void;
        tick: (delta: number) => void;
        isActive: () => boolean;
        finishVictory: () => string;
        clear: () => void;
    };
    DeltaEngine?: {
        calculate: () => void;
        apply: (deltaSeconds: number, mult?: number) => void;
    };
    Log?: { add: (entry: { text: string; options?: Record<string, unknown> }) => void };
    updateSlotUI?: (index: number) => void;
    updateAdventureSlotUI?: (index: number) => void;
    STAT_KEYS?: string[];
    RESOURCE_KEYS?: string[];
    PRESTIGE_MAP?: Record<string, string>;
    MasterySystem?: { add?: (key: string, amount: number) => void };
    getStatLevel?: (key: string) => number;
    getStatValue?: (key: string) => number;
    getMasteryExp?: (key: string) => number;
    getMasteryMax?: (key: string) => number;
    getResourceValue?: (key: string) => number;
    setStatValue?: (key: string, value: number) => void;
    setResourceValue?: (key: string, value: number) => void;
    createDefaultCombatState?: () => any;
    getActionSpeedMultiplier?: (action: any) => number;
    getActionOutputMultiplier?: (action: any) => number;
    getActionMultiplierBreakdown?: (action: any, field?: "speed" | "output") => any;
    actions?: Record<string, any>;
    RARITY_CLASSES?: string[];
}

export function getLegacyRuntime(): LegacyRuntime {
    const scope = globalThis as any;
    return {
        State: scope.State,
        setState: scope.setState,
        updateState: scope.updateState,
        pushState: scope.pushState,
        deleteState: scope.deleteState,
        PubSub: scope.PubSub,
        SoftCapSystem: scope.SoftCapSystem,
        Utils: scope.Utils,
        Lang: scope.Lang,
        BonusEngine: scope.BonusEngine,
        AgeSystem: scope.AgeSystem,
        StatSystem: scope.StatSystem,
        ResourceSystem: scope.ResourceSystem,
        StorySystem: scope.StorySystem,
        TabManager: scope.TabManager,
        EncounterGenerator: scope.EncounterGenerator,
        SaveSystem: scope.SaveSystem,
        ActionEngine: scope.ActionEngine,
        CombatEngine: scope.CombatEngine,
        DeltaEngine: scope.DeltaEngine,
        Log: scope.Log,
        updateSlotUI: scope.updateSlotUI,
        updateAdventureSlotUI: scope.updateAdventureSlotUI,
        STAT_KEYS: scope.STAT_KEYS,
        RESOURCE_KEYS: scope.RESOURCE_KEYS,
        PRESTIGE_MAP: scope.PRESTIGE_MAP,
        MasterySystem: scope.MasterySystem,
        getStatLevel: scope.getStatLevel,
        getStatValue: scope.getStatValue,
        getMasteryExp: scope.getMasteryExp,
        getMasteryMax: scope.getMasteryMax,
        getResourceValue: scope.getResourceValue,
        setStatValue: scope.setStatValue,
        setResourceValue: scope.setResourceValue,
        createDefaultCombatState: scope.createDefaultCombatState,
        getActionSpeedMultiplier: scope.getActionSpeedMultiplier,
        getActionOutputMultiplier: scope.getActionOutputMultiplier,
        getActionMultiplierBreakdown: scope.getActionMultiplierBreakdown,
        actions: scope.actions,
        RARITY_CLASSES: scope.RARITY_CLASSES
    };
}
