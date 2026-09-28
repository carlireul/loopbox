#!/usr/bin/env bash
#
# Build the image and push the moving PRIMARY_TAG plus an immutable per-commit
# SHA_TAG (for rollback). Runs on the server's runner, so PRIMARY_TAG is already
# in the local daemon for deploy-compose.sh; the push is for history.
#
# Inputs (env):
#   IMAGE        registry image, e.g. registry.carly.zone/loopbox
#   PRIMARY_TAG  moving tag (latest)
#   SHA_TAG      immutable per-commit tag (<sha>)
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/../.."

need IMAGE PRIMARY_TAG SHA_TAG

log "Building $IMAGE:$PRIMARY_TAG and $IMAGE:$SHA_TAG"
docker build --platform linux/amd64 -t "$IMAGE:$PRIMARY_TAG" -t "$IMAGE:$SHA_TAG" .

log "Pushing $IMAGE:$PRIMARY_TAG and $IMAGE:$SHA_TAG"
docker push "$IMAGE:$PRIMARY_TAG"
docker push "$IMAGE:$SHA_TAG"
