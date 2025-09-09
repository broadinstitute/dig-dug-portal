# SysBio Portal Code

This repository contains the code for the SysBio Portal, automatically synced from the source repository.

**Please do not make direct edits here.** Changes should be made in the source repository. Contact the maintainers for any questions. This is WIP repo, and depends on how things progress, auto-sync might be disabled in favor of manual review in the future if needed.

To set the volcano plot to a different data source (in the gene expression browser), you can set the environment variable `VUE_APP_VOLCANO_DATASET_URL` to desired path at runtime.

To run: `npm install`, then `npm run deploy`

The output will be in the `portals/SysBio` directory, ready to be served by any webserver.

## Docker Support

This repository includes Docker support for easy deployment:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run with Docker directly
docker build -t sysbio-portal .
docker run -p 8080:8080 sysbio-portal
```

The application will be available at http://localhost:8080

### Build-time Configuration

Environment variables can be set at build time:

```bash
# Using Docker build args
docker build --build-arg VUE_APP_VOLCANO_DATASET_URL=https://example.com/data.csv.gz -t sysbio-portal .

# Using Docker Compose
# Edit docker-compose.yml to include your desired build args
```

For more detailed Docker instructions, see `DOCKER_README.md`.
