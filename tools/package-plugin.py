"""Package only runtime files; never include the nested Orca source checkout."""

import argparse
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Package the Orcarchy development plugin.")
    parser.add_argument("--output", type=Path, default=Path("dist/orcarchy"), help="new output directory; refuses overwrites")
    args = parser.parse_args(argv)
    files = {
        Path("orca-plugin.json"): ROOT / "orca-plugin.json",
        Path("LICENSE"): ROOT / "LICENSE",
        Path("README.md"): ROOT / "plugin/README.md",
    }
    for directory, pattern in (("plugin", "*.mjs"), ("plugin", "convert.py"), ("src/orcarchy", "*.py")):
        for source in sorted((ROOT / directory).glob(pattern)):
            files[source.relative_to(ROOT)] = source
    try:
        for source in files.values():
            if source.is_symlink() or not source.is_file():
                raise ValueError(f"runtime source must be a regular file: {source}")
        args.output.mkdir(parents=True, exist_ok=False)
        for target, source in files.items():
            destination = args.output / target
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
    except (OSError, ValueError) as error:
        print(f"package-plugin: {error}", file=sys.stderr)
        return 1
    print(f"Packaged {len(files)} runtime files in {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
