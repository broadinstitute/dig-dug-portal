/** Default cfde-reveal interactive API host (shared by client + devServer proxy). */
const DEFAULT_REVEAL_KG_API_BASE_URL =
    "http://ec2-3-210-5-42.compute-1.amazonaws.com";

function normalizeApiBase(value) {
    return String(value || "")
        .trim()
        .replace(/~+$/, "")
        .replace(/\/+$/, "");
}

module.exports = {
    DEFAULT_REVEAL_KG_API_BASE_URL,
    REVEAL_KG_API_TARGET: normalizeApiBase(
        process.env.VUE_APP_REVEAL_KG_API_BASE_URL || DEFAULT_REVEAL_KG_API_BASE_URL
    ),
};
