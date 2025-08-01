import os


def test_adventure_list_exists():
    with open('index.html') as f:
        html = f.read()
    assert 'adventure-list' in html


def test_adventure_ui_expandable():
    path = os.path.join('js', 'ui', 'adventure.js')
    with open(path) as f:
        text = f.read()
    assert 'expand-arrow' in text and 'expandable' in text


def test_retreat_stops_adventure():
    with open(os.path.join('js', 'adventure_engine.js')) as f:
        text = f.read()
    assert 'AdventureEngine.cancel();' in text
    assert 'State.defaultActionId' in text


def test_adventure_slot_updates_action_slot():
    path = os.path.join('js', 'slotSetup.js')
    with open(path) as f:
        text = f.read()
    assert 'const actionEl' in text
    assert 'updateSlotUI(i)' in text
