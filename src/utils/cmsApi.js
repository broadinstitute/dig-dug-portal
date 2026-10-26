// Single switch for the Git-backed CMS compatibility API (replaces Drupal on hugeampkpncms.org / kp4cd.org).
// Production: "https://api-prod.hugeampkpnbi.org/api/cms"
// Local cms service: "http://127.0.0.1:8787"
export const CONTENT_CMS_BASE_URL = "https://api-qa.hugeampkpnbi.org/api/cms";

const LEGACY_CMS_HOSTS = ["hugeampkpncms.org", "kp4cd.org"];
const LEGACY_API_PATH = /^\/(rest|reset|egldata|view)(\/|$)/;

export function cmsUrl(path) {
    return CONTENT_CMS_BASE_URL + path;
}

// Rewrites full legacy CMS API URLs (e.g. embedded in research page configs) to the new base; leaves everything else untouched.
export function retargetLegacyCmsApi(url) {
    if (typeof url !== "string") return url;
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const isLegacyHost = LEGACY_CMS_HOSTS.some(
            (h) => host === h || host.endsWith("." + h)
        );
        if (isLegacyHost && LEGACY_API_PATH.test(parsed.pathname)) {
            return cmsUrl(parsed.pathname + parsed.search);
        }
    } catch (e) {
        // relative or malformed URL: not a legacy absolute URL
    }
    return url;
}
