import os

def test_state_queue_fields():
    with open(os.path.join('js', 'state.js')) as f:
        text = f.read()
    assert 'queuedEncounterId' in text
    assert 'queuedActionId' in text

def test_action_engine_queue():
    with open(os.path.join('js', 'action_engine.js')) as f:
        text = f.read()
    assert 'queuedActionId' in text
    assert 'allResourcesFull' in text

def test_adventure_engine_resume():
    with open(os.path.join('js', 'adventure_engine.js')) as f:
        text = f.read()
    assert 'queuedEncounterId' in text
    assert 'allResourcesFull' in text
