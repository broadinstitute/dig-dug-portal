/**
 * Interactive API client for cfde-reveal routes (`/api/interactive/*`).
 * Same-origin in the portal; dig-dug-server proxies to cfde-reveal in local dev.
 */

const INTERACTIVE_API_PREFIX = "/api/interactive";

export const REQUEST_TIMEOUT_MS = 2 * 60 * 1000;

export const DEFAULT_REVEAL_KG_API_BASE_URL =
    "http://ec2-3-210-5-42.compute-1.amazonaws.com";

let apiBaseUrl = normalizeApiBase(process.env.VUE_APP_REVEAL_KG_API_BASE_URL || "");

function normalizeApiBase(value) {
    return String(value || "")
        .trim()
        .replace(/~+$/, "")
        .replace(/\/+$/, "");
}

export function setRevealKgApiBaseUrl(url) {
    apiBaseUrl = normalizeApiBase(url);
}

export function getRevealKgApiBaseUrl() {
    return apiBaseUrl;
}

function buildApiUrl(path) {
    if (/^https?:\/\//.test(path)) {
        return path;
    }
    return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function createRequestAbortSignal(timeoutMs, externalSignal) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
        timeoutController.abort(
            new DOMException(
                `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`,
                "TimeoutError"
            )
        );
    }, timeoutMs);

    if (!externalSignal) {
        return {
            signal: timeoutController.signal,
            clear: () => clearTimeout(timeoutId),
        };
    }

    const linkedController = new AbortController();
    if (externalSignal.aborted) {
        clearTimeout(timeoutId);
        linkedController.abort(externalSignal.reason);
        return { signal: linkedController.signal, clear: () => {} };
    }

    const onAbort = (source) => {
        linkedController.abort(source.reason);
        clearTimeout(timeoutId);
    };
    externalSignal.addEventListener("abort", () => onAbort(externalSignal), { once: true });
    timeoutController.signal.addEventListener(
        "abort",
        () => onAbort(timeoutController.signal),
        { once: true }
    );

    return { signal: linkedController.signal, clear: () => clearTimeout(timeoutId) };
}

function formatRequestError(path, error, timeoutMs) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        const timedOut =
            error?.name === "TimeoutError" ||
            String(error?.message || "")
                .toLowerCase()
                .includes("timed out");
        if (timedOut) {
            return new Error(
                `Request timed out after ${Math.round(timeoutMs / 1000)} seconds (${path})`
            );
        }
        return new Error(`Request was aborted (${path})`);
    }
    return error;
}

async function requestJson(path, options = {}) {
    const {
        timeoutMs = REQUEST_TIMEOUT_MS,
        signal: externalSignal,
        ...fetchOptions
    } = options;
    const { signal, clear } = createRequestAbortSignal(timeoutMs, externalSignal);

    try {
        const response = await fetch(buildApiUrl(path), {
            headers: {
                "Content-Type": "application/json",
                ...(fetchOptions.headers || {}),
            },
            ...fetchOptions,
            signal,
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Request failed: ${response.status}`);
        }
        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();
        if (!contentType.includes("application/json")) {
            throw new Error(
                `Expected JSON from ${path}, got ${contentType || "unknown content type"}`
            );
        }
        try {
            return JSON.parse(text);
        } catch (parseError) {
            throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 160)}`);
        }
    } catch (error) {
        throw formatRequestError(path, error, timeoutMs);
    } finally {
        clear();
    }
}

export function getInteractiveHealth() {
    return requestJson(`${INTERACTIVE_API_PREFIX}/health`);
}

export function classifyInteractiveCandidates(payload) {
    return requestJson(`${INTERACTIVE_API_PREFIX}/classify-candidates`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export default {
    REQUEST_TIMEOUT_MS,
    DEFAULT_REVEAL_KG_API_BASE_URL,
    setRevealKgApiBaseUrl,
    getRevealKgApiBaseUrl,
    getInteractiveHealth,
    classifyInteractiveCandidates,
};
