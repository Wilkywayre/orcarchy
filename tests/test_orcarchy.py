import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from orcarchy.cli import default_palette, main
from orcarchy.palette import contrast, load_palette
from orcarchy.themes import app_theme, bundle, terminal_theme

FIXTURES = Path(__file__).parent / "fixtures"


class PaletteTests(unittest.TestCase):
    def test_light_and_dark(self):
        for mode in ("light", "dark"):
            with self.subTest(mode=mode):
                palette = load_palette(FIXTURES / f"{mode}.toml")
                self.assertEqual(palette.mode, mode)
                self.assertEqual(app_theme(palette)["base"], mode)
                tokens = app_theme(palette)["tokens"]
                for name in ("card", "popover", "secondary", "muted", "accent", "sidebar", "worktree-sidebar", "primary"):
                    self.assertGreaterEqual(contrast(tokens[f"--{name}"], tokens[f"--{name}-foreground"]), 4.5)
                for rule in app_theme(palette)["tokenColors"]:
                    self.assertGreaterEqual(contrast(rule["settings"]["foreground"], tokens["--background"]), 3)

    def test_minimal_palette_and_inferred_mode(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "colors.toml"
            for bg, fg, mode in (("#000000", "#FFFFFF", "dark"), ("#ffffff", "#000000", "light")):
                path.write_text(f'background = "{bg}"\nforeground = "{fg}"\n')
                palette = load_palette(path)
                self.assertEqual(palette.mode, mode)
                self.assertEqual(terminal_theme(palette)["terminal"]["red"], fg.lower())

    def test_invalid_palettes(self):
        cases = ('background = "red"\nforeground = "#ffffff"',
                 'background = "#ffffff"\nforeground = "#eeeeee"',
                 'background = "#000000"\nforeground = "#ffffff"\nmode = "auto"',
                 'background = "#000000"',
                 'background = "#000000"\nforeground = "#ffffff"\naccent = 42')
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "colors.toml"
            for text in cases:
                with self.subTest(text=text):
                    path.write_text(text)
                    with self.assertRaises((ValueError, KeyError)):
                        load_palette(path)

    def test_terminal_bright_colors(self):
        terminal = terminal_theme(load_palette(FIXTURES / "dark.toml"))["terminal"]
        self.assertEqual(terminal["brightBlue"], "#aaccff")
        self.assertEqual(terminal["brightGreen"], terminal["green"])
        self.assertEqual(len(terminal), 20)

    def test_bundle_paths_and_data_only_manifest(self):
        documents = bundle(load_palette(FIXTURES / "dark.toml"))
        manifest = documents["orca-plugin.json"]
        self.assertEqual(manifest["execution"], "data")
        self.assertNotIn("main", manifest)
        self.assertNotIn("pluginApi", manifest)
        for family in manifest["contributes"].values():
            for contribution in family:
                self.assertIn(contribution["path"], documents)


class CliTests(unittest.TestCase):
    def run_cli(self, *args):
        with contextlib.redirect_stdout(io.StringIO()) as out, contextlib.redirect_stderr(io.StringIO()) as err:
            result = main(list(args))
        return result, out.getvalue(), err.getvalue()

    def test_xdg_path(self):
        with patch.dict("os.environ", {"XDG_STATE_HOME": "/custom/state"}):
            self.assertEqual(default_palette(), Path("/custom/state/omarchy/current/theme/colors.toml"))

    def test_generate_and_refuse_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "plugin"
            args = ("--palette", str(FIXTURES / "dark.toml"), "--output", str(output))
            self.assertEqual(self.run_cli(*args)[0], 0)
            before = (output / "themes/app.json").read_bytes()
            self.assertEqual(self.run_cli(*args)[0], 1)
            self.assertEqual((output / "themes/app.json").read_bytes(), before)
            self.assertEqual(json.loads(before)["base"], "dark")

    def test_dry_run_does_not_write(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "plugin"
            result, text, _ = self.run_cli("--palette", str(FIXTURES / "dark.toml"), "--output", str(output), "--dry-run")
            self.assertEqual(result, 0)
            self.assertIn("orca-plugin.json", json.loads(text))
            self.assertFalse(output.exists())

    def test_invalid_input_does_not_create_output(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "invalid.toml"
            output = Path(folder) / "plugin"
            for content in ('mode = [', 'background = "#000000"'):
                path.write_text(content)
                result, _, error = self.run_cli("--palette", str(path), "--output", str(output))
                self.assertEqual(result, 1)
                self.assertTrue(error)
                self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
