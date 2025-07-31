import os
import re

def test_default_action_unblocked_on_reset():
    with open(os.path.join('js', 'action_engine.js')) as f:
        text = f.read()
    pattern = r"slot\.actionId = State\.defaultActionId;\s*slot\.blocked = false;"
    matches = re.findall(pattern, text)
    # three situations should un-block when resetting to default
    assert len(matches) >= 3

