# Portal Docker Setup

This document explains how to build and run the Portal using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier management)

## Building and Running with Docker

### Option 1: Using Docker Compose (Recommended)

1. Build and start the container:

   ```bash
   docker compose up -d
   ```

2. The application will be available at http://localhost:8080

3. To stop the container:
   ```bash
   docker compose down
   ```

### Option 2: Using Docker Directly

1. Build the Docker image:

   ```bash
   docker build -t sysbio-portal .
   ```

2. Run the container:

   ```bash
   docker run -p 8080:8080 -e PORT=8080 sysbio-portal
   ```

3. The application will be available at http://localhost:8080

## Environment Variables

- `PORT`: Port on which the Nginx server listens (default: `8080`)
- `BASE_URL`: Deployment base path (default: `/`)
- `BIOINDEX_HOST`: Public BioIndex URL (default: `https://bioindex.hugeamp.org`)
- `BIOINDEX_HOST_PRIVATE`: Private BioIndex URL (defaults to the public production host)
- `DATASET_ASSOC_URL`: Dataset-associations endpoint for the genetic studies browser
- `DEFAULT_PORTAL`: Default portal identifier (default: empty)
- `GA4_ID`: Google Analytics 4 measurement ID (default: `G-D3G6XZYGBR`)
- `SYSBIO_HOST`: SysBio API URL (default: `https://sysbio.hugeampkpnbi.org`)
- `ENRICHR_HOST`: Enrichr API URL (default: `https://matkp.hugeampkpnbi.org`)
- `SHOW_LOGIN`: Show login controls when set to `true` (default: `false`)
- `USE_REMOTE_CMS`: When `true`, the SysBio portal fetches CMS content live from `hugeampkpncms.org` at runtime. When unset or `false` (default), it serves the committed snapshot from `/cmsdata/` instead, eliminating outside requests. Flip to `true` to preview unpublished CMS edits without redeploying.

### Refreshing the SysBio CMS snapshot

The SysBio portal ships a committed snapshot of CMS content under `public/cmsdata/`. The build does not hit `hugeampkpncms.org` — staging and production deploy directly from this snapshot.

To refresh the snapshot when CMS content changes:

```bash
npm run fetch:cmsdata
git add public/cmsdata
git commit -m "refresh cms snapshot"
```

The fetch script reads its allowlist from `scripts/cmsdata.manifest.js`, downloads every JSON resource, recursively crawls embedded `/sites/default/files/` asset URLs, and rewrites all `hugeampkpncms.org` references in the cached JSON to `/cmsdata/...` paths. Any fetch error fails the script non-zero and leaves the existing snapshot untouched.

When adding a new `getTextContent("...")` slug, news project, or directcsv id to the codebase, also add it to `scripts/cmsdata.manifest.js` — the fetch script verifies that hardcoded slugs in source are declared and will fail the build otherwise.

### Runtime configuration

The application reads its service settings from `runtime-config.js`, which the
container entrypoint generates from environment variables each time it starts.
You do not need to rebuild the image to change them:

```bash
docker run -p 8080:8080 \
  -e DATASET_ASSOC_URL=https://example.com/dataset-associations \
  -e USE_REMOTE_CMS=false \
  sysbio-portal

# Using Docker Compose
# Add or change the value under the service's environment section.
```

## Customizing the Build

The Dockerfile uses the `npm run deploy` command by default, which builds the application for production. If you want to use a different build configuration:

1. Open the Dockerfile
2. Find the line `RUN npm run deploy`
3. Change `deploy` to either `build` for development mode or `watch` for development mode with watch

## Portal Configuration

By default, the Dockerfile is configured to build and serve the SysBio portal. You can build with a different configuration in two ways:

### Option 1: Build with a different config file

```powershell
# Build using a different Vue config file
docker build --build-arg VUE_CONFIG_PATH="./configs/vue.config.YourPortal.js" -t your-portal .
```

### Option 2: For SysBio-FAIRPlex/sysbio-portal repository

If you're building from the SysBio-FAIRPlex/sysbio-portal repository (where vue.config.js has already been updated), you can simply:

```powershell
docker build -t sysbio-portal .
```

Remember to also update the output directory path if using a different portal configuration:

```dockerfile
COPY --from=build-stage /app/portals/YourPortal /usr/share/nginx/html
```

## Troubleshooting

- If you encounter issues with the Nginx configuration, check the `nginx.conf` file.
- For build issues, check the Node.js version in the Dockerfile (currently using Node 24 LTS).
