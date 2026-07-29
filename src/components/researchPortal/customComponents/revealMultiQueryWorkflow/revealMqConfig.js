/**
 * Env-var-driven runtime config for Multi Query REVEAL (hybrid-search / biolink proxy URLs,
 * query-helper factor endpoint template, client-embedding flag).
 */

/**
 * TEMPORARY: full POST URL for hybrid-search while exercising a local backend.
 * Set to null (or "") before merging / deploying; production then uses hybridSearchBaseUrl + /api/reveal/hybrid-search.
 * When set, VUE_APP_REVEAL_HYBRID_SEARCH_URL still wins if defined at build time.
 */
const TEMP_HYBRID_SEARCH_ENDPOINT_URL = null;

function resolveRevealMqRuntimeConfig() {
    const hybridSearchBaseUrl = (typeof process !== "undefined" && process.env && process.env.VUE_APP_REVEAL_HYBRID_BASE_URL)
        ? String(process.env.VUE_APP_REVEAL_HYBRID_BASE_URL).replace(/\/$/, "")
        : "https://search.hugeamp.org";

    const hybridSearchEndpointUrl = (() => {
        const env =
            typeof process !== "undefined" && process.env && process.env.VUE_APP_REVEAL_HYBRID_SEARCH_URL
                ? String(process.env.VUE_APP_REVEAL_HYBRID_SEARCH_URL).trim()
                : "";
        if (env) return env.replace(/\/$/, "");
        const temp =
            TEMP_HYBRID_SEARCH_ENDPOINT_URL != null ? String(TEMP_HYBRID_SEARCH_ENDPOINT_URL).trim() : "";
        if (temp) return temp.replace(/\/$/, "");
        return null;
    })();

    const queryHelperPigeanFactorUrlTemplate =
        typeof process !== "undefined" && process.env && process.env.VUE_APP_REVEAL_QUERY_HELPER_FACTOR_URL_TEMPLATE
            ? String(process.env.VUE_APP_REVEAL_QUERY_HELPER_FACTOR_URL_TEMPLATE).trim()
            : "https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-factor?q=$phenotype,cfde";

    const revealBiolinkProxyBaseUrl = (typeof process !== "undefined" && process.env && process.env.VUE_APP_REVEAL_BIOLINK_PROXY_BASE_URL)
        ? String(process.env.VUE_APP_REVEAL_BIOLINK_PROXY_BASE_URL).replace(/\/$/, "")
        : (typeof process !== "undefined" && process.env && process.env.VUE_APP_REVEAL_HYBRID_BASE_URL)
            ? String(process.env.VUE_APP_REVEAL_HYBRID_BASE_URL).replace(/\/$/, "")
        : "https://search.hugeamp.org";

    const hybridSearchUseClientEmbedding =
        (typeof process !== "undefined" && process.env && process.env.VUE_APP_HYBRID_CLIENT_EMBEDDING === "true");

    const ollamaEmbedUrl = (typeof process !== "undefined" && process.env && process.env.VUE_APP_OLLAMA_EMBED_URL)
        ? String(process.env.VUE_APP_OLLAMA_EMBED_URL)
        : "http://127.0.0.1:11434/api/embed";

    return {
        hybridSearchBaseUrl,
        hybridSearchEndpointUrl,
        queryHelperPigeanFactorUrlTemplate,
        revealBiolinkProxyBaseUrl,
        hybridSearchUseClientEmbedding,
        ollamaEmbedUrl,
    };
}

export { resolveRevealMqRuntimeConfig };
