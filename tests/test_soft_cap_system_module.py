import os


def test_soft_cap_script_included():
    with open('index.html') as f:
        html = f.read()
    assert '/src/main.ts' in html


def test_soft_cap_defined():
    path = os.path.join('js', 'soft_cap.js')
    with open(path) as f:
        text = f.read()
    assert 'const SoftCapSystem' in text
    assert 'recalculateCaps' in text
    assert 'apply()' in text
