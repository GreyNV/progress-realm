import json
import os
import subprocess
import textwrap


def _run_node(script: str):
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout.strip())

def test_prestige_button_exists():
    with open('index.html') as f:
        html = f.read()
    assert 'id="prestige-btn"' in html


def test_prestige_function_defined():
    path = os.path.join('js', 'save_system.js')
    with open(path) as f:
        text = f.read()
    assert 'prestige()' in text


def test_age_triggers_prestige():
    path = os.path.join('js', 'main.js')
    with open(path) as f:
        text = f.read()
    assert 'State.age.max' in text
    assert 'SaveSystem.prestige()' in text


def test_prestige_bonus_applied():
    path = os.path.join('js', 'main.js')
    with open(path) as f:
        text = f.read()
    assert 'applyPrestigeBonuses()' in text


def test_prestige_soft_cap_bonus_updates_caps_only():
    script = textwrap.dedent(
        """
        const { State, ResourceSystem, StatSystem, setState, PRESTIGE_MAP } = require('./js/state.js');
        global.State = State;
        global.ResourceSystem = ResourceSystem;
        global.StatSystem = StatSystem;
        global.setState = setState;
        global.PRESTIGE_MAP = PRESTIGE_MAP;
        global.STAT_KEYS = ['strength'];
        const { SoftCapSystem } = require('./js/soft_cap.js');
        global.SoftCapSystem = SoftCapSystem;
        global.BonusEngine = { statMultipliers: {} };

        const { applyPrestigeBonuses } = require('./js/prestige.js');

        State.stats = { strength: StatSystem.create(0, 50, 'strength') };
        State.stats.strength.maxMultipliers = [0];
        State.prestige = { constitution: StatSystem.create(5, Infinity, 'constitution') };

        SoftCapSystem.recalculateCaps();
        const beforeSoftCap = SoftCapSystem.getStatCap('strength');
        const beforeRawCap = StatSystem.max(State.stats.strength);
        const beforeMultipliers = (State.stats.strength.maxMultipliers || []).slice();

        applyPrestigeBonuses();

        const afterSoftCap = SoftCapSystem.getStatCap('strength');
        const afterRawCap = StatSystem.max(State.stats.strength);
        const afterMultipliers = (State.stats.strength.maxMultipliers || []).slice();
        const bonusMultiplier = BonusEngine.statMultipliers.strength;

        console.log(JSON.stringify({
            beforeSoftCap,
            afterSoftCap,
            beforeRawCap,
            afterRawCap,
            beforeMultipliers,
            afterMultipliers,
            bonusMultiplier
        }));
        """
    )
    data = _run_node(script)
    assert data['beforeSoftCap'] == data['beforeRawCap']
    assert round(data['afterSoftCap'], 6) == round(data['beforeSoftCap'] * 1.1, 6)
    assert data['afterRawCap'] == data['beforeRawCap']
    assert data['beforeMultipliers'] == data['afterMultipliers'] == [0]
    assert round(data['bonusMultiplier'], 6) == round(1 + 5 * 0.05, 6)


def test_prestige_summary_removed():
    path = os.path.join('js', 'ui.js')
    with open(path) as f:
        text = f.read()
    assert 'PrestigeUI' not in text
    assert 'mastery-points' not in text

    with open('index.html') as f:
        html = f.read()
    assert 'prestige-block' not in html
    assert 'id="mastery-points"' not in html


def test_adventure_defaults_present():
    with open(os.path.join('js', 'state.js')) as f:
        text = f.read()
    assert "currentAdventure: 'forest'" in text
    assert "adventureLevels: { forest: 1 }" in text
    with open(os.path.join('js', 'save_system.js')) as f:
        mtext = f.read()
    assert "setState('currentAdventure', 'forest')" in mtext
    assert "setState('adventureLevels', { forest: 1 })" in mtext


def test_prestige_resets_adventure_levels():
    path = os.path.join('js', 'save_system.js')
    with open(path) as f:
        text = f.read()
    assert text.count("setState('adventureLevels', { forest: 1 })") >= 1


def test_prestige_keeps_action_slots():
    path = os.path.join('js', 'main.js')
    with open(path) as f:
        text = f.read()
    assert 's.actionId = null' not in text


def test_prestige_resets_action_progress():
    path = os.path.join('js', 'save_system.js')
    with open(path) as f:
        text = f.read()
    assert 'progress: 0' in text


def test_research_persists_through_prestige():
    path = os.path.join('js', 'save_system.js')
    with open(path) as f:
        text = f.read()
    assert text.count("setState('researchCompleted'") == 1


def test_mastery_persists_through_save_load():
    script = textwrap.dedent(
        """
        const fs = require('fs');
        const vm = require('vm');
        const stateModule = require('./js/state.js');
        global.State = stateModule.State;
        global.ResourceSystem = stateModule.ResourceSystem;
        global.mergeState = stateModule.mergeState;
        global.setState = stateModule.setState;
        global.VERSION = 2;
        global.ensureMastery = stateModule.ensureMastery;
        global.ensureResource = () => {};
        global.ensureStat = () => {};
        global.RESOURCE_KEYS = [];
        global.STAT_KEYS = [];
        global.actions = {};
        global.Encounter = function() {};
        global.localStorage = {
            store: {},
            getItem(k) { return this.store[k] || null; },
            setItem(k, v) { this.store[k] = v; },
            removeItem(k) { delete this.store[k]; }
        };
        vm.runInThisContext(fs.readFileSync('./js/save_system.js', 'utf8'));
        State.mastery.value = 15;
        SaveSystem.save();
        State.mastery = { value: 0 };
        SaveSystem.load();
        console.log(JSON.stringify({
            masteryValue: State.mastery.value,
            hasAdditions: Array.isArray(State.mastery.maxAdditions),
            hasMultipliers: Array.isArray(State.mastery.maxMultipliers)
        }));
        """
    )
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True,
        text=True,
        check=True,
    )
    data = json.loads(result.stdout.strip())
    assert data['masteryValue'] == 15
    assert data['hasAdditions'] is True
    assert data['hasMultipliers'] is True


