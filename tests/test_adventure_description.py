import os

def test_adventure_short_description_present():
    path = os.path.join('js', 'encounter.js')
    with open(path) as f:
        text = f.read()
    assert 'shortDescription' in text


def test_adventure_ui_uses_description():
    path = os.path.join('js', 'ui', 'adventure.js')
    with open(path) as f:
        text = f.read()
    assert 'shortDescription' in text
