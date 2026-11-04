"""Pure conversion from an Omarchy palette to Orca theme documents."""

from . import __version__
from .palette import Palette, readable


def manifest() -> dict:
    return {
        "$schema": "https://raw.githubusercontent.com/stablyai/orca/main/docs/schemas/plugins/orca-plugin.v2.schema.json",
        "manifestVersion": 2,
        "execution": "data",
        "id": "orcarchy",
        "name": "Orcarchy — Omarchy Sync",
        "version": __version__,
        "description": "Omarchy colors for Orca's interface, editor, and terminals.",
        "author": {"name": "wilkywayre"},
        "repository": "https://github.com/wilkywayre/orcarchy",
        "license": "MIT",
        "engines": {"orca": ">=1.4.246"},
        "contributes": {
            "themes": [{"id": "omarchy-sync", "title": "Omarchy Sync", "path": "themes/app.json"}],
            "terminalThemes": [{"id": "omarchy-sync", "title": "Omarchy Sync", "path": "themes/terminal.json"}],
        },
    }


def app_theme(palette: Palette) -> dict:
    p = palette
    bg, fg = p.colors["background"], p.colors["foreground"]
    surface = p.get("lighter_background", bg)
    selection = p.get("selection", surface)
    primary = p.get("accent", fg)
    tokens = {"--background": bg, "--foreground": fg, "--editor-surface": bg}
    for name, fill in (("card", surface), ("popover", surface), ("secondary", surface),
                       ("muted", surface), ("accent", selection), ("sidebar", surface),
                       ("worktree-sidebar", surface), ("primary", primary)):
        tokens[f"--{name}"] = fill
        tokens[f"--{name}-foreground"] = readable(fg, fill)
    # Muted foreground is also used on the editor canvas and tabs.
    muted = p.get("muted", fg)
    if readable(muted, bg) != muted or readable(muted, surface) != muted:
        muted = readable(fg, surface)
        if readable(muted, bg) != muted:
            muted = fg
    tokens["--muted-foreground"] = muted
    tokens["--ring"] = primary
    tokens["--text-link"] = readable(primary, bg)
    scopes = (
        ("comment", "muted"), ("keyword", "magenta"), ("storage", "magenta"),
        ("string", "green"), ("constant.numeric", "orange"),
        ("entity.name.function", "blue"), ("entity.name.type", "cyan"),
        ("invalid", "red"), ("markup.heading", "accent"),
    )
    return {
        "schemaVersion": 1,
        "base": p.mode,
        "tokens": tokens,
        "tokenColors": [
            {"scope": scope, "settings": {"foreground": readable(p.get(key, fg), bg, 3)}}
            for scope, key in scopes
        ],
    }


def terminal_theme(palette: Palette) -> dict:
    p = palette
    bg, fg = p.colors["background"], p.colors["foreground"]
    terminal = {"background": bg, "foreground": fg, "cursor": fg,
                "selectionBackground": p.get("selection", p.get("lighter_background", bg))}
    terminal["black"] = p.get("black", bg)
    terminal["white"] = p.get("white", fg)
    terminal["brightBlack"] = p.get("bright_black", p.get("muted", fg))
    terminal["brightWhite"] = p.get("bright_white", p.get("bright_foreground", fg))
    for key in ("red", "green", "yellow", "blue", "magenta", "cyan"):
        terminal[key] = p.get(key, fg)
        terminal[f"bright{key.title()}"] = p.get(f"bright_{key}", terminal[key])
    return {"schemaVersion": 1, "mode": p.mode, "terminal": terminal}


def bundle(palette: Palette) -> dict[str, dict]:
    return {"orca-plugin.json": manifest(), "themes/app.json": app_theme(palette),
            "themes/terminal.json": terminal_theme(palette)}
