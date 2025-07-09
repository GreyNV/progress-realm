import os


def test_age_system_events():
    path = os.path.join('js', 'age_system.js')
    with open(path) as f:
        text = f.read()
    assert 'const AgeSystem' in text
    assert "age:advanced" in text
    assert "age:maxReached" in text
