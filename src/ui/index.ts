import { createCombatUi } from "./combat";
import { createDashboardUi } from "./dashboard";
import { createEncounterUi } from "./encounter";
import { createHudUi } from "./hud";
import { createLayoutUi } from "./layout";
import { createLayerUiModules } from "./layers";
import { createLogUi } from "./log";
import { createModalUi } from "./modal";
import { createResourceInspector } from "./resourceInspector";
import { createStoryUi } from "./story";
import { setupTooltips } from "./tooltip";
import { createWidgetUi } from "./widgets";

export function createUiModules() {
    const dashboard = createDashboardUi();
    const layout = createLayoutUi(dashboard);
    const encounter = createEncounterUi(dashboard);
    const widgets = createWidgetUi();
    const log = createLogUi();
    const combat = createCombatUi();
    const modal = createModalUi();
    const story = createStoryUi();
    const resourceInspector = createResourceInspector();
    const layers = createLayerUiModules();
    const hud = createHudUi();
    return { dashboard, layout, encounter, widgets, log, combat, modal, story, resourceInspector, setupTooltips, layers, hud };
}
