<template>
    <div id="analytics"></div>
</template>
<script>
const DEFAULT_GA4_ID = "G-D3G6XZYGBR";

// Accepts one or more comma-separated GA4 measurement IDs, e.g. "G-AAA,G-BBB".
function parseGa4Ids(value) {
    return String(value || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
}

// Loads gtag.js once and sends a page view to every configured property.
function initGtag(ids) {
    if (typeof window === "undefined" || window.__ga4Initialized) return;
    window.__ga4Initialized = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
        window.gtag ||
        function gtag() {
            window.dataLayer.push(arguments);
        };
    window.gtag("js", new Date());
    ids.forEach((id) => window.gtag("config", id, { send_page_view: true }));

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        ids[0]
    )}`;
    document.head.appendChild(script);
}

const ga4Ids = parseGa4Ids(process.env.VUE_APP_GA4_ID);
initGtag(ga4Ids.length ? ga4Ids : [DEFAULT_GA4_ID]);

export default {
    name: "GoogleAnalytics",
};
</script>
