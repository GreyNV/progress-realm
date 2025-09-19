import subprocess
import os
import hashlib

BASE_URL = f"file://{os.path.abspath('index.html')}"


def _capture(width, height, path):
    subprocess.run([
        'wkhtmltoimage',
        '--enable-local-file-access',
        '--width', str(width),
        '--height', str(height),
        '--format', 'png',
        BASE_URL,
        str(path)
    ], check=True)


def _hash(path):
    sha = hashlib.sha256()
    with open(path, 'rb') as f:
        sha.update(f.read())
    return sha.hexdigest()

# Baseline screenshot hashes; update only when layout changes
EXPECTED_DESKTOP = "767d428396ddaf8d804f5e634dc324e67c280fcef7145bf1bc53e2e74d1a1bd0"
EXPECTED_MOBILE = "a618cefd7ec17223177969674d6676dbee15e3964849e433dd37ec43cac89024"



def test_character_layout_desktop(tmp_path):
    new_file = tmp_path / 'desktop.png'
    _capture(800, 400, new_file)
    assert _hash(new_file) == EXPECTED_DESKTOP


def test_character_layout_mobile(tmp_path):
    new_file = tmp_path / 'mobile.png'
    _capture(375, 600, new_file)
    assert _hash(new_file) == EXPECTED_MOBILE
