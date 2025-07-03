import os

IMAGES_DIR = os.path.join('assets', 'user_uploaded')


def test_uploaded_image_path_uses_forward_slashes():
    filename = "sample.png"
    file_path = os.path.join(IMAGES_DIR, filename)
    file_path = file_path.replace(os.sep, "/")
    assert "/" in file_path
    assert "\\" not in file_path

