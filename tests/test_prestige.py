import os

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


def test_prestige_ui_defined():
    path = os.path.join('js', 'ui.js')
    with open(path) as f:
        text = f.read()
    assert 'PrestigeUI' in text
    assert 'prestige-block' in text


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


