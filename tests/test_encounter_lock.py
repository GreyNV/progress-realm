import os

def test_random_encounter_checks_locked():
    with open(os.path.join('js', 'encounter.js')) as f:
        text = f.read()
    assert 'e.locked' in text
