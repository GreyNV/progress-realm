import json
import os


def test_update_replaces_encounter():
    path = os.path.join('data', 'updates.json')
    with open(path) as f:
        data = json.load(f)
    update = next(u for u in data if u['id'] == 'lumberSupervision')
    assert 'replaceEncounters' in update
    assert update['replaceEncounters'].get('chopWood') == 'overseeLumberTeam'


def test_affordable_class_defined():
    with open(os.path.join('css', 'styles.css')) as f:
        text = f.read()
    assert '.affordable' in text


def test_affordable_used_in_ui():
    files = [
        os.path.join('js', 'ui', 'furniture.js'),
        os.path.join('js', 'ui', 'home.js'),
        os.path.join('js', 'ui', 'updates.js'),
        os.path.join('js', 'ui', 'research.js'),
    ]
    for path in files:
        with open(path) as f:
            text = f.read()
        assert 'affordable' in text
