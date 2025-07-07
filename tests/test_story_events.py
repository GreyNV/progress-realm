import json
import os


def test_story_events_structure():
    path = os.path.join('data', 'story_events.json')
    with open(path) as f:
        data = json.load(f)
    for ev in data:
        assert 'id' in ev
        assert 'textKey' in ev
        assert 'flag' in ev
        assert 'trigger' in ev and isinstance(ev['trigger'], dict)
