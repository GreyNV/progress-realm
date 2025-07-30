import json
import os


def test_actions_include_activation_cost():
    path = os.path.join('data', 'actions.json')
    with open(path) as f:
        data = json.load(f)
    for action in data:
        assert 'activationCost' in action
        assert isinstance(action['activationCost'], dict)

