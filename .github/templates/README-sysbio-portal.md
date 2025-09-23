# SysBio Portal Code

This repository contains the code for the SysBio Portal, automatically synced from the source repository.

**Please do not make direct edits here.** Changes should be made in the source repository. If hotfixes are needed, please do PRs. Contact the maintainers for any questions. This is WIP repo, and depends on how things progress, auto-sync might be disabled in favor of manual review in the future if needed.

To change the default data sources, you can change its environment variables. For example, if you want to change the volcano plot to a different data source (in the gene expression browser), you can set the environment variable `VUE_APP_VOLCANO_DATASET_URL` to desired path at runtime.

For a list of all available environment variables, see [Environment Variables](DOCKER_README.md#environment-variables).

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

## 🤝 Contributing Process

1. **Fork this repository** `SysBio-FAIRPlex/sysbio-portal`. If you already have write access, you can skip this step.
2. **Create your feature branch** from `main`
3. **Make your changes**
4. **Submit a PR** to `SysBio-FAIRPlex/sysbio-portal`
5. **After your PR is merged**, tag a maintainer to sync back to main repo
6. **(Optionally)** If your changes are time sensitive, you can also build from your fork/branch, and deploy it directly, before making a PR.

### Getting Your Changes to Main Repository

After your PR is merged here:

- Comment: `@maintainers please sync to main repository`
- Your changes will be reverse synced and reviewed again in the main repository
- Once approved there, they become part of the official codebase
- Changes automatically sync back here
