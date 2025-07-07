import importlib.util
import os


def test_simple_server_importable():
    path = os.path.join('scripts', 'simple_server.py')
    spec = importlib.util.spec_from_file_location('simple_server', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert hasattr(module, 'run')


def test_run_uses_repo_root(monkeypatch):
    path = os.path.join('scripts', 'simple_server.py')
    spec = importlib.util.spec_from_file_location('simple_server', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    called = {}

    class DummyServer:
        def __init__(self, addr, handler):
            called['addr'] = addr
            called['handler'] = handler

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def serve_forever(self):
            called['served'] = True

    monkeypatch.setattr(module.socketserver, 'TCPServer', DummyServer)
    module.run(1234)
    assert called.get('addr') == ('', 1234)
    assert called.get('served')
