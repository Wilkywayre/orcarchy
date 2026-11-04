"""Read color data without executing theme files or shell commands."""

import re
import tomllib
from dataclasses import dataclass
from pathlib import Path


def color(value: object, name: str) -> str:
    """Normalize opaque RGB hex; other Omarchy metadata is not interpreted."""
    if not isinstance(value, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ValueError(f"{name} must be a six-digit hex color (#RRGGBB)")
    return value.lower()


def luminance(value: str) -> float:
    channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
              for c in channels]
    return sum(c * weight for c, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(first: str, second: str) -> float:
    low, high = sorted((luminance(first), luminance(second)))
    return (high + 0.05) / (low + 0.05)


def readable(preferred: str, background: str, minimum: float = 4.5) -> str:
    """Retain palette colors where legible, otherwise choose black or white."""
    if contrast(preferred, background) >= minimum:
        return preferred
    return max(("#000000", "#ffffff"), key=lambda c: contrast(c, background))


@dataclass(frozen=True)
class Palette:
    mode: str
    colors: dict[str, str]

    def get(self, key: str, fallback: str) -> str:
        return self.colors.get(key, fallback)


def load_palette(path: Path) -> Palette:
    with path.open("rb") as stream:
        data = tomllib.load(stream)
    for key in ("background", "foreground"):
        if key not in data:
            raise ValueError(f"missing required palette color: {key}")
    colors = {key: color(data[key], key) for key in ("background", "foreground")}
    if contrast(colors["background"], colors["foreground"]) < 4.5:
        raise ValueError("background and foreground must have at least 4.5:1 contrast")
    mode = data.get("mode")
    if mode is None:
        mode = "dark" if luminance(colors["background"]) < luminance(colors["foreground"]) else "light"
    if mode not in ("dark", "light"):
        raise ValueError("mode must be 'dark' or 'light'")
    optional = (
        "accent", "selection", "muted", "dark_background", "lighter_background",
        "dark_foreground", "bright_foreground", "red", "green", "yellow",
        "blue", "magenta", "cyan", "orange", "black", "white",
        "bright_black", "bright_white", "bright_red", "bright_green",
        "bright_yellow", "bright_blue", "bright_magenta", "bright_cyan",
    )
    colors.update({key: color(data[key], key) for key in optional if key in data})
    return Palette(mode, colors)
