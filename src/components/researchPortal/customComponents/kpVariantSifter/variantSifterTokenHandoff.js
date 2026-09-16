/**
 * GWAS-CE token handoff via cross-window postMessage.
 *
 * The GWAS-CE datasets page (`https://gwas-ce.kpndataregistry.org`) opens the
 * Variant Sifter with `window.open`, keeps the window reference, and waits for
 * a `vks:ready` message from it. The sifter, when it mounts in GWAS-CE mode and
 * has a `window.opener`, announces ready; the opener replies with the dataset
 * id (the GWAS-CE access token) addressed to this page's origin only.
 *
 * The token therefore never touches a URL, browser history, Referer header or
 * web-server log on either side. Without an opener (direct navigation,
 * bookmark, blocked popup) nothing here fires and the Welcome panel behaves as
 * before: the user pastes the token.
 *
 * The message-type strings and the origin are mirrored in dig-job-server
 * (`frontend/utils/sifter/portalHandoff.js`); keep the two in sync by hand.
 *
 * Pure: no DOM access beyond what callers pass in, so it can be exercised with
 * plain node even though the portal has no test runner.
 */

import { normalizeGwasCeToken } from "./variantSifterProjects.js";

/** Message the sifter posts to its opener once it can accept a token. */
export const VKS_HANDOFF_READY_TYPE = "vks:ready";

/** Message the opener posts back carrying the GWAS-CE token. */
export const VKS_HANDOFF_TOKEN_TYPE = "vks:gwas-ce-token";

/** The only production origin allowed to hand a token to the sifter. */
export const VKS_HANDOFF_ALLOWED_ORIGINS = ["https://gwas-ce.kpndataregistry.org"];

/** Local Nuxt dev server for the datasets page. */
const VKS_HANDOFF_LOCAL_DEV_ORIGIN = "http://localhost:3000";

/** Portal hosts on which the local dev origin is additionally accepted. */
const VKS_HANDOFF_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1", "dev.hugeamp.org"]);

/**
 * Origins allowed to send a token to this page. The production allowlist,
 * plus the local datasets dev server when the portal itself is running
 * locally or on dev.hugeamp.org.
 * @param {{hostname?: string}|null} [location]
 * @returns {string[]}
 */
export function handoffAllowedOrigins(location = null) {
    const hostname = String(location?.hostname || "").trim().toLowerCase();
    if (VKS_HANDOFF_DEV_HOSTNAMES.has(hostname)) {
        return [...VKS_HANDOFF_ALLOWED_ORIGINS, VKS_HANDOFF_LOCAL_DEV_ORIGIN];
    }
    return [...VKS_HANDOFF_ALLOWED_ORIGINS];
}

/**
 * Tell the opener this page can accept a token. Posts once per allowed origin
 * with an explicit targetOrigin; the browser silently drops the copies whose
 * targetOrigin does not match the opener, which is the desired filtering.
 * No-op without a live opener.
 * @param {{opener?: Window|null, origins?: string[], post?: Function}} options
 *   `post(opener, message, targetOrigin)` defaults to `opener.postMessage`.
 * @returns {number} number of messages posted
 */
export function announceHandoffReady({
    opener = null,
    origins = VKS_HANDOFF_ALLOWED_ORIGINS,
    post = (target, message, targetOrigin) => target.postMessage(message, targetOrigin),
} = {}) {
    if (!opener || opener.closed) {
        return 0;
    }
    let posted = 0;
    (origins || []).forEach((origin) => {
        try {
            post(opener, { type: VKS_HANDOFF_READY_TYPE }, origin);
            posted += 1;
        } catch (error) {
            // A closed or cross-origin-restricted opener; nothing to do.
        }
    });
    return posted;
}

/**
 * @typedef {object} HandoffToken
 * @property {string} token         GWAS-CE access token (dataset id)
 * @property {string|null} dataset  display name of the dataset, if sent
 * @property {string|null} ancestry LD-server ancestry code (e.g. EUR), if sent
 */

/**
 * Validate a `message` event as a token handoff. Returns the token payload or
 * null when the event must be ignored: origin not allowlisted, source is not
 * the opener, wrong message type, or empty token.
 * @param {MessageEvent|{origin?: string, source?: any, data?: any}} event
 * @param {{opener?: Window|null, origins?: string[]}} options
 * @returns {HandoffToken|null}
 */
export function parseHandoffMessage(event, { opener = null, origins = VKS_HANDOFF_ALLOWED_ORIGINS } = {}) {
    if (!event || !opener) {
        return null;
    }
    if (!(origins || []).includes(event.origin)) {
        return null;
    }
    if (event.source !== opener) {
        return null;
    }
    const data = event.data;
    if (!data || typeof data !== "object" || data.type !== VKS_HANDOFF_TOKEN_TYPE) {
        return null;
    }
    const token = normalizeGwasCeToken(data.token);
    if (!token) {
        return null;
    }
    const dataset = String(data.dataset || "").trim();
    const ancestry = String(data.ancestry || "").trim();
    return {
        token,
        dataset: dataset || null,
        ancestry: ancestry || null,
    };
}
