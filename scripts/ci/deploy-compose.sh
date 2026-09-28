#!/usr/bin/env bash
#
# Recreate the loopbox service from the image build-push.sh just put in the
# local daemon. The service definition lives in the homeserver compose file.
#
# Inputs (env):
#   COMPOSE_DIR   directory holding the deployed docker-compose.yaml + .env
#   SERVICE       compose service to recreate (default: loopbox)
#   DEPLOY_LOCK   host-wide lock shared with other projects' deploys
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/../.."

need COMPOSE_DIR
SERVICE="${SERVICE:-loopbox}"

# Same host-wide lock as the other projects' deploys, so compose runs never overlap.
exec 9>"${DEPLOY_LOCK:-/tmp/homeserver-deploy.lock}"
flock -w 900 9 || die "timed out waiting for the deploy lock (another deploy held it >15m)"

log "Deploying $SERVICE from $COMPOSE_DIR"
cd "$COMPOSE_DIR"
docker compose up -d --no-deps "$SERVICE"
docker image prune -f
