import { RuntimeEncounter } from "./encounters";

export function installLegacySystemGlobals(): void {
    const scope = globalThis as any;
    const getSystems = () => scope.window?.__gameSystems;

    const systems = getSystems();
    if (!systems) {
        return;
    }

    const {
        itemGenerator,
        inventory,
        homeSystem,
        furnitureSystem,
        formulas,
        deltaEngine,
        encounterGenerator,
        routineUpgradeSystem,
        actionEngine,
        adventureEngine,
        researchSystem,
        updateSystem
    } = systems;

    scope.ItemGenerator = itemGenerator;
    scope.Inventory = inventory;
    scope.HomeSystem = homeSystem;
    scope.FurnitureSystem = furnitureSystem;
    scope.ResearchSystem = researchSystem;
    scope.RoutineUpgradeSystem = routineUpgradeSystem;
    scope.UpdateSystem = updateSystem;

    scope.TierSystem = formulas.tierSystem;
    scope.getActionTier = formulas.getActionTier.bind(formulas);
    scope.scalingMultiplier = formulas.scalingMultiplier.bind(formulas);
    scope.getPrestigeValueForStat = formulas.getPrestigeValueForStat.bind(formulas);
    scope.resolveStatFactorValue = formulas.resolveStatFactorValue.bind(formulas);
    scope.getWeightedStatContribution = formulas.getWeightedStatContribution.bind(formulas);
    scope.getActionMultiplierBreakdown = formulas.getActionMultiplierBreakdown.bind(formulas);
    scope.getActionSpeedMultiplier = formulas.getActionSpeedMultiplier.bind(formulas);
    scope.getActionOutputMultiplier = formulas.getActionOutputMultiplier.bind(formulas);
    scope.getActionStatOnlyMultiplier = formulas.getActionStatOnlyMultiplier.bind(formulas);
    scope.getEncounterSpeedMultiplier = formulas.getEncounterSpeedMultiplier.bind(formulas);
    scope.getEncounterOutputMultiplier = formulas.getEncounterOutputMultiplier.bind(formulas);
    scope.getEncounterStatOnlyMultiplier = formulas.getEncounterStatOnlyMultiplier.bind(formulas);
    scope.canAfford = formulas.canAfford.bind(formulas);
    scope.applyYield = formulas.applyYield.bind(formulas);
    scope.gainExp = formulas.gainExp.bind(formulas);

    scope.DeltaEngine = deltaEngine;
    scope.statDeltas = deltaEngine.statDeltas;
    scope.resourceDeltas = deltaEngine.resourceDeltas;
    scope.encounterProgressDeltas = deltaEngine.encounterProgressDeltas;

    scope.Encounter = RuntimeEncounter;
    scope.EncounterGenerator = encounterGenerator;
    scope.ActionEngine = actionEngine;
    scope.AdventureEngine = adventureEngine;
    scope.retreat = adventureEngine.retreat.bind(adventureEngine);
    scope.checkHealth = adventureEngine.checkHealth.bind(adventureEngine);
}
