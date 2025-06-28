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
