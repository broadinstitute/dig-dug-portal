# Portal Docker Setup

This document explains how to build and run the Portal using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier management)

## Building and Running with Docker

### Option 1: Using Docker Compose (Recommended)

1. Build and start the container:

   ```bash
   docker-compose up -d
   ```

2. The application will be available at http://localhost:8080

3. To stop the container:
   ```bash
   docker-compose down
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

- `PORT`: Port on which the Nginx server will listen (default: 8080)
- `BIOINDEX_DEV`: Set to `1` to use the development BioIndex server instead of production
- `VUE_APP_VOLCANO_DATASET_URL`: URL to the volcano plot dataset (for the gene expression viewer)
- `VUE_APP_DATASET_ASSOC`: Dataset associations endpoint (for the genetic studies browser)

### Setting Build-Time Environment Variables

Vue.js environment variables (those prefixed with `VUE_APP_`) must be set at build time:

```bash
# Using Docker directly
docker build --build-arg VUE_APP_VOLCANO_DATASET_URL=https://example.com/data.csv.gz -t sysbio-portal .

# Using Docker Compose
# Edit the docker-compose.yml file to include:
# build:
#   args:
#     VUE_APP_VOLCANO_DATASET_URL: https://example.com/data.csv.gz
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

If you're building from the SysBio-FAIRPlex/sysbio-portal repository (where vue.config.js has already been replaced by the sysbio-code-sync workflow), you can simply:

```powershell
docker build -t sysbio-portal .
```

Remember to also update the output directory path if using a different portal configuration:

```dockerfile
COPY --from=build-stage /app/portals/YourPortal /usr/share/nginx/html
```

## Troubleshooting

- If you encounter issues with the Nginx configuration, check the `nginx.conf` file.
- For build issues, check the Node.js version in the Dockerfile (currently using Node 16).
