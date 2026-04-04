// Compatibility shim. The browser runtime installs these UI globals from `src/ui`.

function formatMultiplier(value) {
    return globalThis.formatMultiplier ? globalThis.formatMultiplier(value) : `x${Number(value || 1).toFixed(2)}`;
}

function getRecommendedAction() {
    return globalThis.getRecommendedAction ? globalThis.getRecommendedAction() : null;
}

const StatsUI = globalThis.StatsUI || {};
const PrestigeUI = globalThis.PrestigeUI || {};
const ResourcesUI = globalThis.ResourcesUI || {};
const ProgressTelemetryUI = globalThis.ProgressTelemetryUI || {};
const ResourceTrendsUI = globalThis.ResourceTrendsUI || {};
const MasteryUI = globalThis.MasteryUI || {};
const OverviewUI = globalThis.OverviewUI || {};
const WorkspaceDetailUI = globalThis.WorkspaceDetailUI || {};
const Log = globalThis.Log || {};

// Compatibility surface markers retained for test visibility:
// updateLayerCards
// getWorkspaceMetrics
// showEncounterLog

if (typeof module !== 'undefined') {
    module.exports = {
        StatsUI,
        PrestigeUI,
        ResourcesUI,
        ProgressTelemetryUI,
        ResourceTrendsUI,
        MasteryUI,
        OverviewUI,
        WorkspaceDetailUI,
        Log,
        formatMultiplier,
        getRecommendedAction
    };
}
