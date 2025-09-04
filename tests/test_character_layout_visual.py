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
EXPECTED_DESKTOP = "ec9d88d2816403a555a930c2846b82323985f9ec61d0f29b010ff30774477c2b"
EXPECTED_MOBILE = "c95be88172c26083fc2b9c025a7970970e4ff9cfe8ca968bcd2e1ffcf7b4e114"


def test_character_layout_desktop(tmp_path):
    new_file = tmp_path / 'desktop.png'
    _capture(800, 400, new_file)
    assert _hash(new_file) == EXPECTED_DESKTOP


def test_character_layout_mobile(tmp_path):
    new_file = tmp_path / 'mobile.png'
    _capture(375, 600, new_file)
    assert _hash(new_file) == EXPECTED_MOBILE
