const config = window.__RUNTIME_CONFIG__ || {};

export const BASE_URL = config.BASE_URL || "/";
export const BIOINDEX_HOST =
    config.BIOINDEX_HOST || "https://bioindex.hugeamp.org";
export const BIOINDEX_HOST_PRIVATE =
    config.BIOINDEX_HOST_PRIVATE || "https://bioindex.hugeamp.org";
export const VOLCANO_DATASET_URL = config.VOLCANO_DATASET_URL || "";
export const DATASET_ASSOC_URL = config.DATASET_ASSOC_URL || "";
export const DEFAULT_PORTAL = config.DEFAULT_PORTAL || "";
export const GA4_ID = config.GA4_ID || "";
export const SYSBIO_HOST =
    config.SYSBIO_HOST || "https://sysbio.hugeampkpnbi.org";
export const MOTRPAC_AUTH = config.MOTRPAC_AUTH || "";

export default config;
