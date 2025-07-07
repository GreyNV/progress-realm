import importlib.util
import os


def test_simple_server_importable():
    path = os.path.join('scripts', 'simple_server.py')
    spec = importlib.util.spec_from_file_location('simple_server', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert hasattr(module, 'run')
