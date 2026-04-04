export {};

declare global {
    interface Window {
        __appContent?: import("../content/registry").ContentRegistryData;
        __appSelectors?: typeof import("../selectors");
        __progressionService?: typeof import("../unlocks/progressionService").progressionService;
        __saveMigrationService?: typeof import("../core/saveMigrationService").saveMigrationService;
        __gameSystems?: ReturnType<typeof import("../systems").createGameSystems>;
        __uiModules?: ReturnType<typeof import("../ui").createUiModules>;
        __appOrchestrator?: typeof import("../app/orchestrator").appOrchestrator;
    }
}
