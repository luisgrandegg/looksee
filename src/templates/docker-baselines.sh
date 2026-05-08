#!/usr/bin/env bash
# Regenerate Lost Pixel baselines inside Docker so they match CI byte-for-byte.
# Constitution principle 9: determinism above feature breadth.
# --platform linux/amd64 is required on Apple Silicon (see docs/troubleshooting.md).
set -euo pipefail
docker run --rm \
  --platform linux/amd64 \
  -v "$(pwd):/workdir" \
  -w /workdir \
  lostpixel/lost-pixel:latest update
