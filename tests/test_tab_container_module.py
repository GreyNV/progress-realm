import os


def test_tab_container_script_included():
    with open('index.html') as f:
        html = f.read()
    assert 'js/ui/tab_container.js' in html


def test_tab_container_defined():
    path = os.path.join('js', 'ui', 'tab_container.js')
    with open(path) as f:
        text = f.read()
    assert 'const TabContainer' in text
    assert 'init()' in text
    assert 'translate()' in text
