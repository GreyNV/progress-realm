import json
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


def test_resources_exceed_soft_cap_with_diminishing_returns():
    script = textwrap.dedent(
        """
        const { State, ResourceSystem, StatSystem, setState } = require('./js/state.js');
        global.State = State;
        global.ResourceSystem = ResourceSystem;
        global.StatSystem = StatSystem;
        global.setState = setState;
        const { SoftCapSystem } = require('./js/soft_cap.js');

        State.resources.energy = ResourceSystem.create(0, 20, 'energy');
        SoftCapSystem.recalculateCaps();
        const cap = SoftCapSystem.getResourceCap('energy');
        ResourceSystem.add(State.resources.energy, 30);
        const afterFirst = State.resources.energy.value;
        const beforeSecond = State.resources.energy.value;
        ResourceSystem.add(State.resources.energy, 10);
        const afterSecond = State.resources.energy.value;
        const gainSecond = afterSecond - beforeSecond;
        const beforeThird = State.resources.energy.value;
        ResourceSystem.add(State.resources.energy, 10);
        const gainThird = State.resources.energy.value - beforeThird;

        console.log(JSON.stringify({ cap, afterFirst, gainSecond, gainThird }));
        """
    )
    data = _run_node(script)
    assert data['cap'] == 20
    assert data['afterFirst'] > data['cap']
    assert 0 < data['gainSecond'] < 10
    assert 0 < data['gainThird'] < data['gainSecond']


def test_stats_exceed_soft_cap_with_diminishing_returns():
    script = textwrap.dedent(
        """
        const { State, ResourceSystem, StatSystem, setState } = require('./js/state.js');
        global.State = State;
        global.ResourceSystem = ResourceSystem;
        global.StatSystem = StatSystem;
        global.setState = setState;
        const { SoftCapSystem } = require('./js/soft_cap.js');

        State.stats.strength = StatSystem.create(0, 50, 'strength');
        SoftCapSystem.recalculateCaps();
        const cap = SoftCapSystem.getStatCap('strength');
        StatSystem.add(State.stats.strength, 70);
        const afterFirst = State.stats.strength.value;
        const beforeSecond = State.stats.strength.value;
        StatSystem.add(State.stats.strength, 10);
        const afterSecond = State.stats.strength.value;
        const gainSecond = afterSecond - beforeSecond;
        const beforeThird = State.stats.strength.value;
        StatSystem.add(State.stats.strength, 10);
        const gainThird = State.stats.strength.value - beforeThird;

        console.log(JSON.stringify({ cap, afterFirst, gainSecond, gainThird }));
        """
    )
    data = _run_node(script)
    assert data['cap'] == 50
    assert data['afterFirst'] > data['cap']
    assert 0 < data['gainSecond'] < 10
    assert 0 < data['gainThird'] < data['gainSecond']
