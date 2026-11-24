"""Move a finished clip from the Mac work copy to the external SSD T7 (Arman's rule: work on the Mac, keep results on the T7).

usage: python3 scripts/to_t7.py <name>            copy out/<name> and projects/<name>/audio to the T7, check every file,
                                                  and copy the code (src, scripts, projects, docs) into the T7 project
       python3 scripts/to_t7.py <name> --clean    the same, then delete the Mac copies of the checked output files
Targets: /Volumes/T7/Claud-clips/out/<name>, /Volumes/T7/Claud-clips/projects/<name>/audio and the code project
/Volumes/T7/claud-clips-local/Claud-clips (T7_ROOT / T7_CODE override). Nothing on the T7 is deleted. macOS writes
._ files on the exFAT T7; they are never copied back.
"""
from __future__ import annotations
import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
T7_ROOT = Path(os.environ.get("T7_ROOT", "/Volumes/T7/Claud-clips"))
T7_CODE = Path(os.environ.get("T7_CODE", "/Volumes/T7/claud-clips-local/Claud-clips"))


def rsync(src: Path, dst: Path, *extra: str) -> None:
    dst.mkdir(parents=True, exist_ok=True)
    subprocess.run(["rsync", "-a", "--exclude", "._*", "--exclude", ".DS_Store", *extra, f"{src}/", f"{dst}/"], check=True)


def same(a: Path, b: Path) -> bool:
    return b.exists() and a.stat().st_size == b.stat().st_size


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--clean", action="store_true", help="delete the Mac copies of the outputs after the check")
    a = ap.parse_args()
    if not T7_ROOT.parent.exists():
        sys.exit("the T7 is not mounted")
    moved: list[Path] = []
    for src, dst in [(ROOT / "out" / a.name, T7_ROOT / "out" / a.name), (ROOT / "projects" / a.name / "audio", T7_ROOT / "projects" / a.name / "audio")]:
        if not src.exists() or src.is_symlink():
            continue
        rsync(src, dst, "--checksum")
        files = [p for p in src.rglob("*") if p.is_file()]
        bad = [p for p in files if not same(p, dst / p.relative_to(src))]
        if bad:
            sys.exit(f"check failed for {len(bad)} files, e.g. {bad[0]}; nothing deleted")
        print(f"ok  {len(files)} files  {src.relative_to(ROOT)} -> {dst}")
        moved += files
    if T7_CODE.exists():
        rsync(ROOT, T7_CODE, "--exclude", "node_modules", "--exclude", "out", "--exclude", ".git", "--exclude", "projects/*/audio")
        print(f"ok  code -> {T7_CODE}")
    if a.clean:
        for p in moved:
            p.unlink()
        print(f"deleted {len(moved)} checked output files on the Mac")
    else:
        print("the Mac copies are still there (run again with --clean to delete them)")


if __name__ == "__main__":
    main()
