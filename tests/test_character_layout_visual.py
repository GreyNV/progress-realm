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
EXPECTED_DESKTOP = "5fe94d001644e61b62a3bc76769e8e2e138a684e2a68e4f63b8f9656ef5dbc39"
EXPECTED_MOBILE = "d42594ddb21525eef2bc5747d5cdf7e83d32dd635a0e0e125dcf80f92d7652d2"


def test_character_layout_desktop(tmp_path):
    new_file = tmp_path / 'desktop.png'
    _capture(800, 400, new_file)
    assert _hash(new_file) == EXPECTED_DESKTOP


def test_character_layout_mobile(tmp_path):
    new_file = tmp_path / 'mobile.png'
    _capture(375, 600, new_file)
    assert _hash(new_file) == EXPECTED_MOBILE
