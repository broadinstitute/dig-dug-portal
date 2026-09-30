/** Default REVEAL Mechanisms API host (knowledge-gap search proxy target). */
const DEFAULT_REVEAL_MECHANISMS_API_BASE_URL =
    "https://api-qa.hugeampkpnbi.org/api/reveal";

function normalizeApiBase(value) {
    return String(value || "")
        .trim()
        .replace(/~+$/, "")
        .replace(/\/+$/, "");
}

module.exports = {
    DEFAULT_REVEAL_MECHANISMS_API_BASE_URL,
    REVEAL_MECHANISMS_API_TARGET: normalizeApiBase(
        process.env.VUE_APP_REVEAL_MECHANISMS_API_BASE_URL ||
            DEFAULT_REVEAL_MECHANISMS_API_BASE_URL
    ),
};
