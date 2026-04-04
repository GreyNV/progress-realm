import type { ContentRegistryData } from "../content/registry";
import { createDeltaSystem } from "./delta";
import { createDwellingSystems } from "./dwelling";
import { createEncounterSystem } from "./encounters";
import { createEngineSystems } from "./engines";
import { createFormulaSystem } from "./formulas";
import { createItemSystems } from "./items";
import { createResearchSystem } from "./research";
import { createRoutineUpgradeSystem } from "./routineUpgrades";
import { createUpdateSystem } from "./updates";

export function createGameSystems(registry: ContentRegistryData) {
    const itemSystems = createItemSystems(registry);
    const dwellingSystems = createDwellingSystems(registry);
    const formulas = createFormulaSystem();
    const deltaEngine = createDeltaSystem(formulas);
    const encounterSystem = createEncounterSystem(registry);
    const engineSystems = createEngineSystems();
    const researchSystem = createResearchSystem(registry);
    const routineUpgradeSystem = createRoutineUpgradeSystem(registry);
    const updateSystem = createUpdateSystem(registry);

    return {
        itemGenerator: itemSystems.itemGenerator,
        inventory: itemSystems.inventory,
        homeSystem: dwellingSystems.homeSystem,
        furnitureSystem: dwellingSystems.furnitureSystem,
        formulas,
        deltaEngine,
        encounterGenerator: encounterSystem,
        routineUpgradeSystem,
        actionEngine: engineSystems.actionEngine,
        adventureEngine: engineSystems.adventureEngine,
        researchSystem,
        updateSystem
    };
}
