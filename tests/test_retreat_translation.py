import os

def test_retreat_uses_lang_resource():
    path = os.path.join('js', 'adventure_engine.js')
    with open(path) as f:
        text = f.read()
    assert 'Lang.resource(resourceName)' in text
