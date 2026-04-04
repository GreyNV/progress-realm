def test_dashboard_shell_present():
    with open('index.html', encoding='utf-8') as f:
        html = f.read()
    assert 'overview-view' in html
    assert 'workspace-view' in html
    assert 'back-to-overview' in html
    assert 'encounter-log-toggle' in html
    assert 'overview-routine-multiplier' in html
    assert 'overview-upgrades-multiplier' in html
    assert 'overview-stat-breakdown' in html
    assert 'stat-breakdown-card' in html
    assert 'app-sidebar-card' in html
    assert 'prestige-list' in html
    assert 'type="module"' in html
    assert '/src/main.ts' in html
    assert 'dungeon-list' in html
    assert 'adventure-overview-card' in html
    assert 'adventure-log-container' in html
    assert 'routine-insights' in html
    assert 'overview-routine-insights' in html
    assert 'overview-adventure-insights' in html
    assert 'overview-open-adventure' in html
    assert 'routine-upgrades-list' in html
    assert 'inventory-insights' in html
    assert 'chip-insights' in html
    assert 'activity-card' in html


def test_overview_modules_configured_in_ui_json():
    import json
    with open('data/ui.json', encoding='utf-8') as f:
        data = json.load(f)
    assert 'overviewModules' in data
    module_ids = {entry['id'] for entry in data['overviewModules']}
    assert 'run-summary-card' in module_ids
    assert 'activity-card' in module_ids


def test_ui_handler_builds_dashboard_cards():
    with open('js/ui_handler.js', encoding='utf-8') as f:
        text = f.read()
    assert 'buildLayerCards' in text
    assert 'buildWorkspaceSummary' in text
    assert 'buildPrestige' in text
    assert 'buildResourceCharts' in text
    assert 'buildProgressTelemetry' in text
    assert 'applyOverviewModules' in text


def test_overview_ui_updates_layer_cards():
    with open('js/ui.js', encoding='utf-8') as f:
        text = f.read()
    assert 'const OverviewUI' in text
    assert 'updateLayerCards' in text
    assert 'getWorkspaceMetrics' in text
    assert 'showEncounterLog' in text
    assert 'const ResourceTrendsUI' in text
    assert 'const ProgressTelemetryUI' in text
    assert 'const WorkspaceDetailUI' in text


def test_stat_reference_ui_is_wired():
    with open('src/ui/widgets.ts', encoding='utf-8') as f:
        widgets = f.read()
    with open('src/ui/encounter.ts', encoding='utf-8') as f:
        encounter = f.read()
    assert 'getStatReferenceHtml' in widgets
    assert 'slot-meta' in widgets
    assert 'getDungeonStatFactors' in encounter
    assert 'stat-chip-row' in encounter


def test_main_uses_current_chart_module_name():
    with open('src/app/orchestrator.ts', encoding='utf-8') as f:
        text = f.read()
    assert 'ResourceChartsUI.init' not in text
    assert 'TabManager.openWorkspaceSection' in text
    assert 'hero-recommended-action' in text
    assert 'window.__appOrchestrator' not in text


def test_rest_is_hidden_internal_default_action():
    import json
    with open('data/actions.json', encoding='utf-8') as f:
        actions = json.load(f)
    rest = next(action for action in actions if action['id'] == 'rest')
    assert rest['hidden'] is True
    visible = [action['id'] for action in actions if not action.get('hidden')]
    assert visible == ['studying', 'training', 'agility_drills', 'conditioning', 'scouting']


def test_all_routines_use_ten_second_ten_xp_baseline():
    import json
    with open('data/actions.json', encoding='utf-8') as f:
        actions = json.load(f)
    for action in actions:
        assert action['baseDuration'] == 10
        total_stat_yield = sum(float(value) for value in action.get('baseYield', {}).get('stats', {}).values())
        assert round(total_stat_yield, 2) == 1.00
