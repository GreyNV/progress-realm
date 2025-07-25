import os


def test_section_component_script_included():
    with open('index.html') as f:
        html = f.read()
    assert 'js/ui/section_component.js' in html


def test_section_component_defined():
    path = os.path.join('js', 'ui', 'section_component.js')
    with open(path) as f:
        text = f.read()
    assert 'const SectionComponent' in text
    assert 'initAll()' in text
