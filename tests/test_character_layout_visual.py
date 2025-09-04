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
EXPECTED_DESKTOP = "192f40d1503a21a2d277185a92f1cb68d4a7f6c4e2b163f78acc8a2fe1edb180"
EXPECTED_MOBILE = "172207dc7642c41470ba437cab837cfdb69dfbfd5e10dd503cb7681ac22014e6"


def test_character_layout_desktop(tmp_path):
    new_file = tmp_path / 'desktop.png'
    _capture(800, 400, new_file)
    assert _hash(new_file) == EXPECTED_DESKTOP


def test_character_layout_mobile(tmp_path):
    new_file = tmp_path / 'mobile.png'
    _capture(375, 600, new_file)
    assert _hash(new_file) == EXPECTED_MOBILE
