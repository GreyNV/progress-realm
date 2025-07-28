import os


def test_homes_owned_state_defined():
    with open(os.path.join('js', 'state.js')) as f:
        text = f.read()
    assert 'homesOwned:' in text


def test_save_system_initializes_homes_owned():
    with open(os.path.join('js', 'save_system.js')) as f:
        text = f.read()
    assert "setState('homesOwned', []" in text


def test_home_system_tracks_purchase():
    with open(os.path.join('js', 'home.js')) as f:
        text = f.read()
    assert "pushState('homesOwned'" in text


def test_default_home_fallback():
    with open(os.path.join('js', 'home.js')) as f:
        text = f.read()
    assert 'currentHome' in text
    assert 'if (!currentHome && defaultHome)' in text


def test_home_system_notifies_on_load():
    path = os.path.join('js', 'home.js')
    with open(path) as f:
        text = f.read()
    assert "PubSub.publish('home:changed', State.homeId" in text

