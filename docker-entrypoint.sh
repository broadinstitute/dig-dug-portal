#!/bin/sh
set -e

LISTEN_PORT="${PORT:-8080}"
BASE_PATH="${BASE_URL:-/}"

# Ensure BASE_PATH has a trailing slash
case "$BASE_PATH" in
    */) ;;
    *) BASE_PATH="${BASE_PATH}/" ;;
esac

# Generate runtime-config.js from environment variables
cat <<EOF > /usr/share/nginx/html/runtime-config.js
window.__RUNTIME_CONFIG__ = {
  BASE_URL: "${BASE_PATH}",
  BIOINDEX_HOST: "${BIOINDEX_HOST:-https://bioindex.hugeamp.org}",
  BIOINDEX_HOST_PRIVATE: "${BIOINDEX_HOST_PRIVATE:-https://bioindex.hugeamp.org}",
  VOLCANO_DATASET_URL: "${VOLCANO_DATASET_URL:-}",
  DATASET_ASSOC_URL: "${DATASET_ASSOC_URL:-}",
  DEFAULT_PORTAL: "${DEFAULT_PORTAL:-}",
  GA4_ID: "${GA4_ID:-G-D3G6XZYGBR}",
  SYSBIO_HOST: "${SYSBIO_HOST:-https://sysbio.hugeampkpnbi.org}",
  MOTRPAC_AUTH: "${MOTRPAC_AUTH:-}",
};
EOF

# Inject <base href> into all HTML files so the browser resolves relative URLs correctly
sed -i "s|<base href=\"/\">|<base href=\"${BASE_PATH}\">|g" /usr/share/nginx/html/*.html

# Generate nginx config
cat <<EOF > /etc/nginx/conf.d/default.conf
server {
    listen ${LISTEN_PORT};
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

exec nginx
