#!/bin/bash

# Script to build and push SysBio Portal to GCP Artifact Registry
# Usage: ./scripts/push-to-gcp.sh [options]
#
# Options:
#   --version VERSION   Image version tag (default: latest)
#   --project PROJECT   GCP Project ID (overrides env var)
#   --region REGION     GCP Region (default: us-central1)
#   --repo REPO         Artifact Registry repository name (default: portal)
#   --service SERVICE   Cloud Run service name (default: sysbio-portal)
#   --deploy            Also redeploy the Cloud Run service after pushing
#   --help              Show this help message
#
# Environment variables (can be set in .env file):
#   GCP_PROJECT_ID           GCP Project ID
#   GCP_REGION               GCP Region (default: us-central1)
#   GCP_REPOSITORY           Artifact Registry repository name (default: portal)
#   GCP_CLOUD_RUN_SERVICE    Cloud Run service name (default: sysbio-portal)
#   GCP_SERVICE_ACCOUNT_KEY  Path to service account key file (optional)

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "📄 Loading environment variables from .env..."
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep -v '^$' | xargs)
fi

# Default configuration
VERSION="latest"
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
REPOSITORY="${GCP_REPOSITORY:-portal}"
CLOUD_RUN_SERVICE="${GCP_CLOUD_RUN_SERVICE:-portal}"
SERVICE_ACCOUNT_KEY="${GCP_SERVICE_ACCOUNT_KEY:-}"
IMAGE_NAME="sysbio-portal"
DEPLOY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            VERSION="$2"
            shift 2
            ;;
        --project)
            PROJECT_ID="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --repo)
            REPOSITORY="$2"
            shift 2
            ;;
        --service)
            CLOUD_RUN_SERVICE="$2"
            shift 2
            ;;
        --deploy)
            DEPLOY=true
            shift
            ;;
        --help)
            head -22 "$0" | tail -19
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required configuration
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: GCP Project ID is required."
    echo ""
    echo "Please provide it via one of the following methods:"
    echo "  1. Command line: ./scripts/push-to-gcp.sh --project YOUR_PROJECT_ID"
    echo "  2. Environment variable: export GCP_PROJECT_ID=YOUR_PROJECT_ID"
    echo "  3. .env file: GCP_PROJECT_ID=YOUR_PROJECT_ID"
    echo ""
    echo "Common project IDs:"
    echo "  - sysbio-tools-staging"
    echo "  - dti-diver-development"
    exit 1
fi

# Full image path
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}"

# Build timestamp
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "================================================"
echo "SysBio Portal GCP Deployment"
echo "================================================"
echo "Project:    ${PROJECT_ID}"
echo "Region:     ${REGION}"
echo "Repository: ${REPOSITORY}"
echo "Image:      ${IMAGE_NAME}"
echo "Version:    ${VERSION}"
echo "Timestamp:  ${BUILD_TIMESTAMP}"
echo "Deploy:     ${DEPLOY}"
echo "================================================"
echo ""

# Authenticate with GCP
echo "🔐 Configuring Docker authentication..."
if [ -n "$SERVICE_ACCOUNT_KEY" ] && [ -f "$SERVICE_ACCOUNT_KEY" ]; then
    echo "   Using service account key: ${SERVICE_ACCOUNT_KEY}"
    gcloud auth activate-service-account --key-file="${SERVICE_ACCOUNT_KEY}"
    gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
else
    echo "   Using gcloud CLI authentication (your current active account)"
    echo "   Run 'gcloud auth list' to see active accounts"
    echo "   Run 'gcloud config set account YOUR_EMAIL' to switch accounts"
    gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
fi
echo "   ℹ️  Note: Not changing your default GCP project. Using ${PROJECT_ID} for this deployment only."
echo ""

# Build the image
echo "🏗️  Building Docker image for linux/amd64..."
docker build --platform linux/amd64 \
    --no-cache \
    --build-arg BUILD_TIMESTAMP="${BUILD_TIMESTAMP}" \
    -t ${IMAGE_NAME}:${VERSION} \
    "$PROJECT_ROOT"

# Tag for GCP
echo ""
echo "🏷️  Tagging image for GCP Artifact Registry..."
docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_PATH}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    echo "🏷️  Also tagging as latest..."
    docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_PATH}:latest
fi

# Push to GCP
echo ""
echo "📤 Pushing to GCP Artifact Registry..."
docker push ${IMAGE_PATH}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    docker push ${IMAGE_PATH}:latest
fi

echo ""
echo "✅ Successfully pushed to GCP Artifact Registry!"
echo "   Image URL: ${IMAGE_PATH}:${VERSION}"

# Optionally redeploy Cloud Run service
if [ "$DEPLOY" = true ]; then
    echo ""
    echo "🚀 Redeploying Cloud Run service '${CLOUD_RUN_SERVICE}'..."
    gcloud run services update ${CLOUD_RUN_SERVICE} \
        --image ${IMAGE_PATH}:${VERSION} \
        --region ${REGION} \
        --project ${PROJECT_ID}

    echo ""
    echo "✅ Cloud Run service '${CLOUD_RUN_SERVICE}' redeployed!"
fi

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "Image pushed: ${IMAGE_PATH}:${VERSION}"
echo ""

if [ "$DEPLOY" = false ]; then
    echo "To update the Cloud Run service, either:"
    echo ""
    echo "1. Re-run with --deploy flag:"
    echo "   ./scripts/push-to-gcp.sh --deploy"
    echo ""
    echo "2. Use the Cloud Console:"
    echo "   https://console.cloud.google.com/run?project=${PROJECT_ID}"
    echo ""
    echo "3. Or deploy via CLI:"
    echo "   gcloud run deploy ${CLOUD_RUN_SERVICE} \\"
    echo "     --image ${IMAGE_PATH}:${VERSION} \\"
    echo "     --platform managed \\"
    echo "     --region ${REGION} \\"
    echo "     --project ${PROJECT_ID}"
    echo ""
fi
