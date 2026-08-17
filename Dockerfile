# Multi-stage Dockerfile for the SysBio portal

# Stage 1: Build the Vue.js application
FROM node:24-bookworm AS build-stage

# Set working directory
WORKDIR /app

# Copy the dependency manifests separately to keep dependency installation cached
COPY package.json package-lock.json ./

# Install the exact dependency tree from package-lock.json
RUN npm ci --no-audit --no-fund --progress=false

# Copy project files
COPY . .

# Build the project for production
ARG VUE_CONFIG_PATH=./vue.config.js
RUN node scripts/check-cmsdata.js
ENV VUE_CLI_SERVICE_CONFIG_PATH=${VUE_CONFIG_PATH}
RUN npm run deploy

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the built app from the previous stage
COPY --from=build-stage /app/portals/SysBio /usr/share/nginx/html

# Expose port 8080
EXPOSE 8080

# Keep nginx in the foreground
RUN echo 'daemon off;' >> /etc/nginx/nginx.conf

# Copy and enable the entrypoint script (generates nginx config + runtime-config.js from env vars)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
