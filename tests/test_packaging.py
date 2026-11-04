import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent


class PluginPackagingTests(unittest.TestCase):
    def test_package_contains_runtime_but_no_development_checkout(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "plugin"
            result = subprocess.run([sys.executable, str(ROOT / "tools/package-plugin.py"), "--output", str(output)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            manifest = json.loads((output / "orca-plugin.json").read_text())
            self.assertTrue((output / manifest["main"]).is_file())
            self.assertTrue((output / "src/orcarchy/palette.py").is_file())
            self.assertTrue((output / "plugin/convert.py").is_file())
            self.assertFalse((output / "build").exists())
            self.assertFalse((output / ".git").exists())
            self.assertFalse((output / "tests").exists())

    def test_existing_output_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as folder:
            marker = Path(folder) / "owned.txt"
            marker.write_text("keep me")
            result = subprocess.run([sys.executable, str(ROOT / "tools/package-plugin.py"), "--output", folder], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            self.assertEqual(marker.read_text(), "keep me")
            self.assertFalse((Path(folder) / "orca-plugin.json").exists())


if __name__ == "__main__":
    unittest.main()
