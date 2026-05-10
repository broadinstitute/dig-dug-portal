#!/bin/sh
set -e

LISTEN_PORT="${PORT:-8080}"
BASE_PATH="${BASE_URL:-/}"

# Ensure BASE_PATH has a trailing slash
case "$BASE_PATH" in
    */) ;;
    *) BASE_PATH="${BASE_PATH}/" ;;
esac

# Coerce SHOW_LOGIN to a JS boolean literal
case "${SHOW_LOGIN:-false}" in
    true|TRUE|True|1|yes) SHOW_LOGIN_VAL=true ;;
    *) SHOW_LOGIN_VAL=false ;;
esac

# Generate runtime-config.js from environment variables
cat <<EOF > /usr/share/nginx/html/runtime-config.js
window.__RUNTIME_CONFIG__ = {
  BASE_URL: "${BASE_PATH}",
  BIOINDEX_HOST: "${BIOINDEX_HOST:-https://bioindex.hugeamp.org}",
  BIOINDEX_HOST_PRIVATE: "${BIOINDEX_HOST_PRIVATE:-https://bioindex.hugeamp.org}",
  DATASET_ASSOC_URL: "${DATASET_ASSOC_URL:-}",
  DEFAULT_PORTAL: "${DEFAULT_PORTAL:-}",
  GA4_ID: "${GA4_ID:-G-D3G6XZYGBR}",
  SYSBIO_HOST: "${SYSBIO_HOST:-https://sysbio.hugeampkpnbi.org}",
  ENRICHR_HOST: "${ENRICHR_HOST:-https://matkp.hugeampkpnbi.org}",
  SHOW_LOGIN: ${SHOW_LOGIN_VAL},
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
