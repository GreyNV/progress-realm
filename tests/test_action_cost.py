import json
import os


def test_actions_use_resource_cost():
    path = os.path.join('data', 'actions.json')
    with open(path) as f:
        actions = json.load(f)
    for action in actions:
        assert 'resourceCost' in action
        assert 'resourceConsumption' not in action


def test_action_engine_references_resource_cost():
    with open(os.path.join('js', 'action_engine.js')) as f:
        text = f.read()
    assert 'resourceCost' in text
    assert 'resourceConsumption' in text
