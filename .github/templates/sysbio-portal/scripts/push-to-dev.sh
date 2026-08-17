#!/bin/bash
# Build, push, and deploy a service image in the dev project.
#
# This script handles the dev environment end-to-end. It does NOT touch
# staging, demo, or prod — those are handled by the env-deployer chain
# (see cicd/env-deployer/README.md), kicked off by tagging the dev artifact
# with `release-staging-*`.
#
# Usage:
#   ./push-to-dev.sh <service> [dockerfile]
#   ./push-to-dev.sh <service> [dockerfile] --no-deploy
#
# Required env (or .env file in the repo root):
#   DEV_PROJECT          GCP dev project ID, e.g. sysbio-tools-dev
# Optional:
#   REGION               default: us-central1
#   REPO                 Artifact Registry repo name, default: dev
#   CLOUD_RUN_SERVICE    Cloud Run service name, default: same as <service>
#   GCP_SERVICE_ACCOUNT_KEY  Path to a key file (otherwise uses gcloud auth)
#
# Example:
#   ./push-to-dev.sh query-proxy services/query-proxy/Dockerfile
#   ./push-to-dev.sh sysbio-portal Dockerfile --no-deploy
#
# Output tags:
#   <REGION>-docker.pkg.dev/<DEV_PROJECT>/<REPO>/<service>:<short-sha>
#   <REGION>-docker.pkg.dev/<DEV_PROJECT>/<REPO>/<service>:dev-latest

set -euo pipefail

SERVICE=""
DOCKERFILE="Dockerfile"
DEPLOY=true

# Parse args: <service> [dockerfile] [--no-deploy]
POSITIONAL=()
while [ $# -gt 0 ]; do
  case "$1" in
    --no-deploy) DEPLOY=false; shift ;;
    --help|-h)
      sed -n '2,28p' "$0"
      exit 0
      ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [ ${#POSITIONAL[@]} -ge 1 ]; then SERVICE="${POSITIONAL[0]}"; fi
if [ ${#POSITIONAL[@]} -ge 2 ]; then DOCKERFILE="${POSITIONAL[1]}"; fi

if [ -z "$SERVICE" ]; then
  echo "Usage: $0 <service> [dockerfile] [--no-deploy]" >&2
  exit 1
fi

# Load .env from current dir if present. Use a tolerant parser that handles
# unquoted multi-word values (e.g. RAS_SCOPE="a b c" without quotes) without
# treating the trailing words as commands the way `. ./.env` would.
if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line//[[:space:]]/}" ]] && continue
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      # Strip optional surrounding single or double quotes
      [[ "$value" =~ ^\"(.*)\"$ ]] && value="${BASH_REMATCH[1]}"
      [[ "$value" =~ ^\'(.*)\'$ ]] && value="${BASH_REMATCH[1]}"
      export "${key}=${value}"
    fi
  done < .env
fi

DEV_PROJECT="${DEV_PROJECT:?DEV_PROJECT is required (e.g. sysbio-tools-dev)}"
REGION="${REGION:-us-central1}"
REPO="${REPO:-dev}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-$SERVICE}"

if [ -n "${GCP_SERVICE_ACCOUNT_KEY:-}" ] && [ -f "$GCP_SERVICE_ACCOUNT_KEY" ]; then
  echo "🔐 Authenticating with service account key: $GCP_SERVICE_ACCOUNT_KEY"
  gcloud auth activate-service-account --key-file="$GCP_SERVICE_ACCOUNT_KEY"
fi

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

if ! git rev-parse --short HEAD >/dev/null 2>&1; then
  echo "❌ Not in a git repo — cannot derive a SHA tag." >&2
  exit 1
fi
SHA=$(git rev-parse --short HEAD)
if ! git diff --quiet HEAD 2>/dev/null; then
  SHA="${SHA}-dirty"
fi

REGISTRY="${REGION}-docker.pkg.dev/${DEV_PROJECT}/${REPO}"
IMAGE="${REGISTRY}/${SERVICE}"

echo "================================================"
echo "Building ${SERVICE}"
echo "  Project:           ${DEV_PROJECT}"
echo "  Region:            ${REGION}"
echo "  Repo:              ${REPO}"
echo "  Dockerfile:        ${DOCKERFILE}"
echo "  Tag:               ${SHA}"
echo "  Cloud Run service: ${CLOUD_RUN_SERVICE}"
echo "  Deploy after push: ${DEPLOY}"
echo "================================================"

docker build \
  --platform linux/amd64 \
  --build-arg "BUILD_SHA=${SHA}" \
  --build-arg "BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -t "${IMAGE}:${SHA}" \
  -f "${DOCKERFILE}" \
  .

docker tag "${IMAGE}:${SHA}" "${IMAGE}:dev-latest"

echo "📤 Pushing ${IMAGE}:${SHA}"
docker push "${IMAGE}:${SHA}"

echo "📤 Pushing ${IMAGE}:dev-latest"
docker push "${IMAGE}:dev-latest"

if [ "$DEPLOY" = true ]; then
  echo
  echo "🚀 Deploying ${CLOUD_RUN_SERVICE} to Cloud Run in ${DEV_PROJECT}..."
  gcloud run deploy "${CLOUD_RUN_SERVICE}" \
    --image="${IMAGE}:${SHA}" \
    --region="${REGION}" \
    --project="${DEV_PROJECT}"
fi

cat <<EOF

✅ Pushed:
   ${IMAGE}:${SHA}
   ${IMAGE}:dev-latest
EOF

if [ "$DEPLOY" = true ]; then
  echo "✅ Deployed ${CLOUD_RUN_SERVICE} to dev Cloud Run."
else
  echo "ℹ️  Skipped Cloud Run deploy (--no-deploy)."
fi

cat <<EOF

To promote this exact build into staging, tag it here in the dev AR:

  gcloud artifacts docker tags add \\
    ${IMAGE}:${SHA} \\
    ${IMAGE}:release-staging-\$(date +%Y%m%d-%H%M)

The chain takes over from there:
  staging → tag in staging AR with :release-demo-* → demo deploys + validates
  demo    → tag in demo AR    with :release-prod-* → prod deploys + validates
EOF
