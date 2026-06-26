#!/usr/bin/env bash
# Download the Town Radio playlist from URLs in scripts/radio-urls.txt
# and drop them into public/music/ with the slug-based filenames the
# `town-radio-tracks.ts` manifest expects.
#
# Usage (from anywhere in the repo):
#     bash apps/web/scripts/fetch-radio.sh
#
# Re-runs are idempotent — existing files are overwritten.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="$(cd "${HERE}/.." && pwd)"
URL_FILE="${HERE}/radio-urls.txt"
OUT_DIR="${WEB}/public/music"

SLUGS=(midnight-walk lofi-study tokyo-cafe chill-abstract good-night)

if [[ ! -f "${URL_FILE}" ]]; then
  echo "fetch-radio: ${URL_FILE} not found" >&2
  exit 1
fi

# Strip comments + blank lines.
mapfile -t URLS < <(grep -vE '^\s*(#|$)' "${URL_FILE}")

if [[ "${#URLS[@]}" -lt "${#SLUGS[@]}" ]]; then
  echo "fetch-radio: need ${#SLUGS[@]} URLs in ${URL_FILE}, found ${#URLS[@]}" >&2
  echo "fetch-radio: paste the direct-download URLs in slug order:" >&2
  for slug in "${SLUGS[@]}"; do echo "  - ${slug}" >&2; done
  exit 1
fi

mkdir -p "${OUT_DIR}"

for i in "${!SLUGS[@]}"; do
  slug="${SLUGS[$i]}"
  url="${URLS[$i]}"
  dest="${OUT_DIR}/${slug}.mp3"
  echo "fetch-radio: ${slug}.mp3 ← ${url}"
  curl -fSL --retry 2 -A 'Mozilla/5.0' "${url}" -o "${dest}"
done

echo "fetch-radio: done. ${#SLUGS[@]} tracks landed in ${OUT_DIR}"
