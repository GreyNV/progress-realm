import os

def test_prestige_button_exists():
    with open('index.html') as f:
        html = f.read()
    assert 'id="prestige-btn"' in html


def test_prestige_function_defined():
    path = os.path.join('js', 'main.js')
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


def test_prestige_ui_defined():
    path = os.path.join('js', 'ui.js')
    with open(path) as f:
        text = f.read()
    assert 'PrestigeUI' in text
    assert 'prestige-block' in text


def test_encounter_level_default_one():
    with open(os.path.join('js', 'state.js')) as f:
        text = f.read()
    assert 'encounterLevel: 1' in text
    with open(os.path.join('js', 'main.js')) as f:
        mtext = f.read()
    assert 'State.encounterLevel = 1' in mtext


def test_prestige_resets_encounter_level():
    path = os.path.join('js', 'main.js')
    with open(path) as f:
        text = f.read()
    assert text.count('State.encounterLevel = 1') >= 2


def test_prestige_keeps_action_slots():
    path = os.path.join('js', 'main.js')
    with open(path) as f:
        text = f.read()
    assert 's.actionId = null' not in text


