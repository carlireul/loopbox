#!/usr/bin/env bash
#
# Shared helpers for scripts/ci/*. Scripts take inputs from named env vars
# (documented in each header) and never read CI-platform context directly, so
# the workflow YAML stays a thin manifest and the scripts also run by hand.
#
# Source this after `set -euo pipefail`:
#   source "$(dirname "$0")/lib.sh"

log() { printf '\033[1m▸ %s\033[0m\n' "$*" >&2; }

die() {
  if [ -n "${GITHUB_ACTIONS:-}" ]; then printf '::error::%s\n' "$*" >&2; fi
  printf 'error: %s\n' "$*" >&2
  exit 1
}

# Usage: need IMAGE PRIMARY_TAG SHA_TAG
need() {
  local missing=() name
  for name in "$@"; do
    if [ -z "${!name:-}" ]; then missing+=("$name"); fi
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    die "missing required env var(s): ${missing[*]}"
  fi
}
