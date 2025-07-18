import os


def test_pubsub_unlock_events_present():
    with open(os.path.join('js', 'story.js')) as f:
        text = f.read()
    assert "PubSub.publish('unlock:" in text


def test_pubsub_modal_events_present():
    with open(os.path.join('js', 'pubsub.js')) as f:
        text = f.read()
    assert "modal:open" in text and "modal:close" in text


def test_pubsub_item_events_present():
    with open(os.path.join('js', 'items.js')) as f:
        text = f.read()
    assert "item:added" in text and "item:consumed" in text


def test_inventory_ui_subscribes_to_changes():
    with open(os.path.join('js', 'ui', 'inventory.js')) as f:
        text = f.read()
    assert "inventory:changed" in text


def test_furniture_ui_updates_on_inventory_change():
    with open(os.path.join('js', 'ui', 'furniture.js')) as f:
        text = f.read()
    assert "inventory:changed" in text


def test_engine_publishes_update_events():
    with open(os.path.join('js', 'engine.js')) as f:
        text = f.read()
    assert "resources:updated" in text and "stats:updated" in text
