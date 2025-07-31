import os


def test_furniture_destroyed_event_in_furniture_system():
    with open(os.path.join('js', 'furniture.js')) as f:
        text = f.read()
    assert 'furniture:destroyed' in text


def test_pubsub_handles_furniture_destroyed():
    with open(os.path.join('js', 'pubsub.js')) as f:
        text = f.read()
    assert 'furniture:destroyed' in text


def test_prestige_triggers_furniture_cleanup():
    with open(os.path.join('js', 'save_system.js')) as f:
        text = f.read()
    assert 'furniture:destroyed' in text
