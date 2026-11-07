"""Offline validation for a packaged Orcarchy plugin directory (stdlib only).

Mirrors the checks Orca's own validator and community listing enforce, so PRs
and releases fail here first instead of at submission time:

- manifest shape: format 2, trusted worker, semver version, engine floor
- referenced main module exists
- cover/screenshots exist, are raster images, meet minimum dimensions, and
  stay within Orca's per-file and total image budgets
- no symlinks, executables, native modules, or archives in the package
"""

import argparse
import json
import os
import re
import struct
import sys
from pathlib import Path

SEMVER_RE = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:[-+].*)?$")
MIN_ENGINE = (1, 4, 251)
COVER_MIN = (800, 500)
SCREENSHOT_MIN = (1280, 800)
COVER_MAX_BYTES = 1024 * 1024
SCREENSHOT_MAX_BYTES = 1536 * 1024
IMAGES_TOTAL_MAX_BYTES = 8 * 1024 * 1024
SCREENSHOT_LIMIT = 6
FORBIDDEN_SUFFIXES = (".exe", ".node", ".so", ".dylib", ".dll", ".zip", ".tar", ".gz", ".appimage")


def fail(errors, message):
    errors.append(message)


def png_dimensions(path):
    with open(path, "rb") as handle:
        header = handle.read(26)
    if len(header) < 26 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        return None
    width, height = struct.unpack(">II", header[16:24])
    return ("png", width, height)


def jpeg_dimensions(path):
    with open(path, "rb") as handle:
        data = handle.read()
    if data[:2] != b"\xff\xd8":
        return None
    index = 2
    while index < len(data):
        if data[index] != 0xFF:
            return None
        marker = data[index + 1]
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            index += 2
            continue
        if index + 4 > len(data):
            return None
        length = struct.unpack(">H", data[index + 2 : index + 4])[0]
        if 0xC0 <= marker <= 0xC3:
            height, width = struct.unpack(">HH", data[index + 5 : index + 9])
            return ("jpeg", width, height)
        index += 2 + length
    return None


def image_info(path):
    for probe in (png_dimensions, jpeg_dimensions):
        try:
            result = probe(path)
        except OSError:
            return None
        if result is not None:
            return result
    return None


def parse_engine_floor(value):
    match = re.match(r"^>=(\d+)\.(\d+)\.(\d+)", value or "")
    if not match:
        return None
    return tuple(int(part) for part in match.groups())


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate a packaged Orcarchy plugin.")
    parser.add_argument("directory", type=Path)
    parser.add_argument("--version", default=None, help="Required manifest version (release gate).")
    args = parser.parse_args(argv)
    errors = []
    root = args.directory
    manifest_path = root / "orca-plugin.json"
    if not manifest_path.is_file():
        print(f"missing manifest: {manifest_path}", file=sys.stderr)
        return 1
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        print(f"unreadable manifest: {error}", file=sys.stderr)
        return 1

    if manifest.get("manifestVersion") != 2:
        fail(errors, "manifestVersion must be 2")
    if manifest.get("execution") != "trusted-worker":
        fail(errors, "execution must be trusted-worker")
    for field in ("id", "name", "version"):
        if not manifest.get(field):
            fail(errors, f"manifest is missing {field}")
    version = manifest.get("version", "")
    if not SEMVER_RE.match(version):
        fail(errors, f"version is not semver: {version!r}")
    if args.version is not None and version != args.version:
        fail(errors, f"manifest version {version!r} != release version {args.version!r}")

    floor = parse_engine_floor((manifest.get("engines") or {}).get("orca"))
    if floor is None:
        fail(errors, "engines.orca must be a >=x.y.z range")
    elif floor < MIN_ENGINE:
        minimum = ".".join(map(str, MIN_ENGINE))
        fail(errors, f"engines.orca floor {floor} is below the supported minimum >={minimum}")

    main_module = manifest.get("main", "")
    if not main_module or not (root / main_module).is_file():
        fail(errors, f"main module is missing: {main_module!r}")

    images = []
    cover = manifest.get("cover")
    if cover:
        images.append(("cover", cover.get("path", ""), COVER_MAX_BYTES, COVER_MIN))
    for shot in manifest.get("screenshots", []) or []:
        images.append(("screenshot", shot.get("path", ""), SCREENSHOT_MAX_BYTES, SCREENSHOT_MIN))
    if len(manifest.get("screenshots", []) or []) > SCREENSHOT_LIMIT:
        fail(errors, f"more than {SCREENSHOT_LIMIT} screenshots")
    total_bytes = 0
    for kind, rel, cap, minimum in images:
        target = root / rel
        if not rel or not target.is_file():
            fail(errors, f"{kind} file is missing: {rel!r}")
            continue
        size = target.stat().st_size
        total_bytes += size
        if size > cap:
            fail(errors, f"{kind} {rel} is {size} bytes, over the {cap} byte budget")
        info = image_info(target)
        if info is None:
            fail(errors, f"{kind} {rel} is not a readable PNG/JPEG image")
        elif (info[1], info[2]) < minimum:
            fail(errors, f"{kind} {rel} is {info[1]}x{info[2]}, below {minimum[0]}x{minimum[1]}")
    if total_bytes > IMAGES_TOTAL_MAX_BYTES:
        fail(errors, f"images total {total_bytes} bytes, over the {IMAGES_TOTAL_MAX_BYTES} budget")

    for dirpath, _dirnames, filenames in os.walk(root):
        for name in filenames:
            path = Path(dirpath) / name
            if path.is_symlink():
                fail(errors, f"package must not contain symlinks: {path.relative_to(root)}")
            elif name.lower().endswith(FORBIDDEN_SUFFIXES):
                fail(errors, f"package must not contain binaries/archives: {path.relative_to(root)}")

    if errors:
        print("package validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print(f"Package valid: {manifest.get('id')} {version} "
          f"({len(images)} images, {total_bytes} bytes).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
