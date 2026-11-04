"""Private bridge for the approved worker; never installs or writes theme files."""

from pathlib import Path
import sys

if sys.version_info < (3, 11):
    raise SystemExit("Orcarchy requires Python 3.11 or newer")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from orcarchy.cli import main

raise SystemExit(main())
