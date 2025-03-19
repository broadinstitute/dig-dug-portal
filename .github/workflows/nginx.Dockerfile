FROM nginx:stable-alpine

ARG BUILD_PATH

# Copy the built app from the specified path
COPY ${BUILD_PATH} /usr/share/nginx/html

# Handle nginx configuration - copy if exists or create default
RUN if [ -f nginx.conf ]; then \
    cp nginx.conf /etc/nginx/conf.d/default.conf; \
    else \
    echo "Using default nginx configuration"; \
    fi

# The EXPOSE instruction is optional metadata - Cloud Run doesn't actually use it
# but it's helpful documentation to indicate the expected port

# Update nginx to use the PORT environment variable set by Cloud Run
RUN sed -i.bak 's/listen\(.*\)80;/listen $PORT;/' /etc/nginx/conf.d/default.conf && \
    # Make nginx run on foreground and use PORT environment variable
    echo 'daemon off;' >> /etc/nginx/nginx.conf

# Start Nginx server
CMD sed -i.bak "s/\$PORT/${PORT:-8080}/g" /etc/nginx/conf.d/default.conf && nginx
