import os


def test_queue_property_in_state():
    with open(os.path.join('js', 'state.js')) as f:
        text = f.read()
    assert 'queue:' in text


def test_queue_slot_styles_defined():
    with open(os.path.join('css', 'styles.css')) as f:
        text = f.read()
    assert '.queue-slot' in text and '.slot-wrapper' in text
