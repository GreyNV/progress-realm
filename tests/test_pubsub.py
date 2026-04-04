import os


def test_pubsub_script_included():
    with open('index.html') as f:
        html = f.read()
    assert '/src/main.ts' in html


def test_pubsub_defined():
    path = os.path.join('js', 'pubsub.js')
    with open(path) as f:
        text = f.read()
    assert 'const PubSub' in text
    assert 'subscribe(' in text
    assert 'publish(' in text
