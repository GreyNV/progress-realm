import { loadContentRegistry } from "./content/registry";
import { appOrchestrator } from "./app/orchestrator";
import { installLegacyAppGlobals } from "./app/legacyGlobals";
import { installLoggerGlobals } from "./core/logger";
import { installPubSubGlobals } from "./core/pubsub";
import { installStateGlobals } from "./core/stateBridge";
import { installUtilityGlobals } from "./core/utils";
import * as selectors from "./selectors";
import { progressionService } from "./unlocks/progressionService";
import { saveMigrationService } from "./core/saveMigrationService";
import { loadLegacyScripts } from "./core/legacyScriptLoader";
import { createGameSystems } from "./systems";
import { installLegacySystemGlobals } from "./systems/legacyGlobals";
import { installSupportGlobals } from "./systems/support";
import { installSlotGlobals } from "./ui/slot";
import { createUiModules } from "./ui";
import { installLegacyUiGlobals } from "./ui/legacyGlobals";

async function bootstrap(): Promise<void> {
    const registry = await loadContentRegistry();
    window.__appContent = registry;
    window.__appSelectors = selectors;
    window.__progressionService = progressionService;
    window.__saveMigrationService = saveMigrationService;
    window.__gameSystems = createGameSystems(registry);
    window.__uiModules = createUiModules();
    window.__appOrchestrator = appOrchestrator;
    appOrchestrator.ensureGlobals();
    installLoggerGlobals();
    installUtilityGlobals();
    installStateGlobals();
    installPubSubGlobals();
    installSupportGlobals();
    installSlotGlobals();
    installLegacyAppGlobals();
    installLegacySystemGlobals();
    installLegacyUiGlobals();
    await loadLegacyScripts();
    await appOrchestrator.init();
}

bootstrap().catch((error) => {
    console.error("Failed to bootstrap Progress Realm", error);
    const app = document.getElementById("app") || document.body;
    const message = document.createElement("pre");
    const details = error instanceof Error
        ? `${error.message}\n\n${error.stack || ""}`
        : String(error);
    message.textContent = `Bootstrap failed:\n${details}`;
    app.appendChild(message);
});
