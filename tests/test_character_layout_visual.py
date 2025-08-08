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


EXPECTED_DESKTOP = "a68e4ce1298595f115a0271da5fdf4fe3157258af16ebab1b81ae881da990477"
EXPECTED_MOBILE = "30c175693870051d592602a78d1f5bd195c72597364a2ccd9193baed7de69d16"


def test_character_layout_desktop(tmp_path):
    new_file = tmp_path / 'desktop.png'
    _capture(800, 400, new_file)
    assert _hash(new_file) == EXPECTED_DESKTOP


def test_character_layout_mobile(tmp_path):
    new_file = tmp_path / 'mobile.png'
    _capture(375, 600, new_file)
    assert _hash(new_file) == EXPECTED_MOBILE
