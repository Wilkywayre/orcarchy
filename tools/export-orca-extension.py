"""Export the isolated source change as a reproducible patch; never push or commit."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys


def git(root: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(root), *args], text=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Export the local Orca appearance extension.")
    parser.add_argument("--source", type=Path, default=Path("build/orca-source"))
    parser.add_argument("--output", type=Path, default=Path("upstream"))
    parser.add_argument("--base", default=None, help="Upstream base commit (default: merge-base with origin/main).")
    args = parser.parse_args(argv)
    try:
        source = args.source.resolve(strict=True)
        try:
            base = args.base or git(source, "merge-base", "origin/main", "HEAD").strip()
        except subprocess.CalledProcessError:
            base = git(source, "rev-parse", "HEAD").strip()
        committed = git(source, "diff", "--name-only", f"{base}..HEAD").splitlines()
        tracked = git(source, "diff", "--name-only", "HEAD").splitlines()
        new = git(source, "ls-files", "--others", "--exclude-standard").splitlines()
        permitted = (
            "src/main/plugins/", "src/shared/plugins/", "docs/schemas/plugins/",
            "src/main/startup/main-process-plugins.ts", "resources/plugins/types/orca-host.d.ts",
            "docs/reference/plugin-host-api.md", "docs/reference/plugin-manifest.md", "docs/reference/plugin-catalog.md",
            "skill-guides/orca-plugin-authoring/references/host-api.md",
            "skill-guides/orca-plugin-authoring/references/manifest.md",
            "src/cli/bundled-skill-guides.ts",
        )
        files = sorted(set(committed + tracked + new))
        if not files:
            raise ValueError("the source checkout has no extension changes")
        unexpected = [file for file in files if not any(file == prefix or (prefix.endswith("/") and file.startswith(prefix)) for prefix in permitted)]
        if unexpected:
            raise ValueError(f"refusing to export unrelated source changes: {', '.join(unexpected)}")
        parts = []
        if committed:
            parts.append(git(source, "diff", "--binary", f"{base}..HEAD", "--", *committed))
        if tracked:
            parts.append(git(source, "diff", "--binary", "HEAD", "--", *tracked))
        patch = "".join(parts)
        for file in new:
            result = subprocess.run(["git", "diff", "--no-index", "--binary", "--", "/dev/null", file], cwd=source, text=True, capture_output=True)
            if result.returncode != 1:
                raise ValueError(f"could not export new source file: {file}: {result.stderr}")
            patch += result.stdout
        metadata = {
            "schemaVersion": 1,
            "upstream": git(source, "remote", "get-url", "origin").strip(),
            "baseCommit": base,
            "branch": git(source, "branch", "--show-current").strip(),
            "patch": "orca-appearance-provider.patch",
            "patchSha256": hashlib.sha256(patch.encode()).hexdigest(),
            "files": files,
            "status": "experimental-source-extension-not-installed-not-upstreamed",
        }
        args.output.mkdir(parents=True, exist_ok=True)
        (args.output / metadata["patch"]).write_text(patch, encoding="utf-8")
        (args.output / "orca-source.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"export-orca-extension: {error}", file=sys.stderr)
        return 1
    print(f"Exported {len(files)} source files against {metadata['baseCommit']} to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
