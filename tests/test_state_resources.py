import json
import subprocess
import textwrap


def test_max_handles_missing_arrays():
    script = textwrap.dedent(
        """
        const { ResourceSystem, StatSystem } = require('./js/state.js');
        const res = { value: 0, baseMax: 12 };
        const stat = { value: 0, baseMax: 7 };
        console.log(JSON.stringify({
            resMax: ResourceSystem.max(res),
            statMax: StatSystem.max(stat)
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
    assert data['resMax'] == 12
    assert data['statMax'] == 7

