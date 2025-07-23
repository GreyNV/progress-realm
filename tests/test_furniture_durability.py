import os


def test_furniture_durability_event():
    path = os.path.join('js', 'furniture.js')
    with open(path) as f:
        text = f.read()
    assert 'furniture:durabilityChanged' in text


def test_lock_action_clears_slot():
    path = os.path.join('js', 'pubsub.js')
    with open(path) as f:
        text = f.read()
    assert 'State.slots.forEach' in text


def test_purchase_replaces_existing_furniture():
    path = os.path.join('js', 'furniture.js')
    with open(path) as f:
        text = f.read()
    assert '.shift()' in text and 'furnitureSlots' in text
