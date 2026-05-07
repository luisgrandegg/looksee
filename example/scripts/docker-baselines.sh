#!/usr/bin/env bash
# Regenerate Lost Pixel baselines inside Docker so they match CI byte-for-byte.
# --platform linux/amd64 is required on Apple Silicon.
set -euo pipefail
docker run --rm \
  --platform linux/amd64 \
  -v "$(pwd):/workdir" \
  -w /workdir \
  lostpixel/lost-pixel:latest update
