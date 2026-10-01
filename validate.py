"""Compatibility entry point; canonical tests use Node + Playwright."""
from pathlib import Path
import subprocess
subprocess.run(["node", "validate.cjs"], cwd=Path(__file__).parent, check=True)
