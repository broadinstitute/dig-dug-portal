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

## Customizing the Build

The Dockerfile uses the `npm run deploy` command by default, which builds the application for production. If you want to use a different build configuration:

1. Open the Dockerfile
2. Find the line `RUN npm run deploy`
3. Change `deploy` to either `build` for development mode or `watch` for development mode with watch

## Troubleshooting

- If you encounter issues with the Nginx configuration, check the `nginx.conf` file.
- For build issues, check the Node.js version in the Dockerfile (currently using Node 16).
