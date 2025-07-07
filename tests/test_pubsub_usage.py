import os


def test_pubsub_unlock_events_present():
    with open(os.path.join('js', 'story.js')) as f:
        text = f.read()
    assert "PubSub.publish('unlock:" in text


def test_pubsub_modal_events_present():
    with open(os.path.join('js', 'main.js')) as f:
        text = f.read()
    assert "modal:open" in text and "modal:close" in text
