# Multi-stage Dockerfile for Portal

# Stage 1: Build the Vue.js application
FROM node:16 as build-stage

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the project for production
# You can change this to build or watch depending on your needs
ARG VUE_CONFIG_PATH="./configs/vue.config.SysBio.js"
ENV VUE_CLI_SERVICE_CONFIG_PATH=${VUE_CONFIG_PATH}
RUN npm run deploy

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the built app from the previous stage
COPY --from=build-stage /app/portals/SysBio /usr/share/nginx/html

# Copy custom nginx config from root directory
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Update nginx to use the PORT environment variable
RUN sed -i.bak 's/listen\(.*\)80;/listen $PORT;/' /etc/nginx/conf.d/default.conf && \
    echo 'daemon off;' >> /etc/nginx/nginx.conf

# Start Nginx server
CMD ["sh", "-c", "sed -i.bak \"s/\\$PORT/${PORT:-8080}/g\" /etc/nginx/conf.d/default.conf && nginx"]
