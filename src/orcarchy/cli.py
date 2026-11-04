"""Local bundle generation; installation and application settings stay untouched."""

import argparse
import json
import os
from pathlib import Path
import sys
import tomllib

from . import __version__
from .palette import load_palette
from .themes import bundle


def default_palette() -> Path:
    state = Path(os.environ.get("XDG_STATE_HOME") or Path.home() / ".local/state")
    return state / "omarchy/current/theme/colors.toml"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate an Orca theme plugin from Omarchy colors.")
    parser.add_argument("--version", action="version", version=__version__)
    parser.add_argument("--palette", type=Path, default=default_palette(), help="source colors.toml")
    parser.add_argument("--output", type=Path, default=Path("build/orcarchy"), help="new plugin directory (must not exist)")
    parser.add_argument("--dry-run", action="store_true", help="print the bundle as JSON without writing files")
    args = parser.parse_args(argv)
    try:
        documents = bundle(load_palette(args.palette))
        serialized = {name: json.dumps(doc, indent=2) + "\n" for name, doc in documents.items()}
        for name, text in serialized.items():
            if name.startswith("themes/") and len(text.encode()) > 16 * 1024:
                raise ValueError(f"{name} exceeds Orca's 16 KiB limit")
        if args.dry_run:
            print(json.dumps(documents, indent=2))
            return 0
        # Refuse overwrites in the foundation release; transactional sync comes later.
        args.output.mkdir(parents=True, exist_ok=False)
        for name, text in serialized.items():
            target = args.output / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")
    except (OSError, ValueError, tomllib.TOMLDecodeError) as error:
        print(f"orcarchy: {error}", file=sys.stderr)
        return 1
    print(f"Generated plugin: {args.output}")
    return 0
