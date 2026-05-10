#!/usr/bin/env node
//
// Build-time CMS cache populator for the SysBio portal.
//
// Reads the allowlist from scripts/cmsdata.manifest.js, fetches every
// JSON resource from hugeampkpncms.org, recursively crawls the responses
// for embedded /sites/default/files/ asset URLs, downloads those assets,
// rewrites all hugeampkpncms.org references in the cached JSON to local
// /cmsdata/ paths, and writes the result to public/cmsdata/.
//
// The whole cache is built under public/cmsdata.tmp/ and atomically renamed
// to public/cmsdata/ on success. Any fetch failure exits non-zero and leaves
// the previous cache (if any) intact.
//
// Skip when the build isn't targeting SysBio (other portals don't use this).

"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const url = require("url");

const REMOTE_HOST = "hugeampkpncms.org";
const REMOTE_BASE = `https://${REMOTE_HOST}`;
const REPO_ROOT = path.resolve(__dirname, "..");
const FINAL_DIR = path.join(REPO_ROOT, "public", "cmsdata");
const STAGE_DIR = path.join(REPO_ROOT, "public", "cmsdata.tmp");
const CONCURRENCY = 6;
const ASSET_PATH_PREFIX = "/sites/default/files/";
// URL terminator set: whitespace, quotes, angle brackets, parens, backslash,
// comma (CSV cell separator inside embedded data), semicolon (CSS), pipe.
// Trailing periods/quotes are trimmed in postprocessing.
const URL_CHARS = `[^\\s"'<>)(\\\\,;|]+`;
const ASSET_URL_RE = new RegExp(
    `https?://${REMOTE_HOST.replace(/\./g, "\\.")}${ASSET_PATH_PREFIX.replace(
        /\//g,
        "\\/"
    )}${URL_CHARS}`,
    "g"
);
const REST_URL_RE = new RegExp(
    `https?://${REMOTE_HOST.replace(/\./g, "\\.")}/rest/${URL_CHARS}`,
    "g"
);

function skipForNonSysBioBuild() {
    const cfg = process.env.VUE_CLI_SERVICE_CONFIG_PATH || "";
    if (cfg && !/SysBio/i.test(cfg)) {
        console.log(
            `[cmsdata] VUE_CLI_SERVICE_CONFIG_PATH=${cfg} is not a SysBio config; skipping fetch.`
        );
        process.exit(0);
    }
}

function httpGet(targetUrl, { binary = false, redirects = 0 } = {}) {
    return new Promise((resolve, reject) => {
        const opts = url.parse(targetUrl);
        const req = https.get(opts, (res) => {
            const status = res.statusCode || 0;
            if (status >= 300 && status < 400 && res.headers.location) {
                if (redirects >= 5) {
                    reject(
                        new Error(
                            `too many redirects fetching ${targetUrl}`
                        )
                    );
                    return;
                }
                res.resume();
                resolve(
                    httpGet(res.headers.location, {
                        binary,
                        redirects: redirects + 1,
                    })
                );
                return;
            }
            if (status < 200 || status >= 300) {
                res.resume();
                reject(
                    new Error(
                        `HTTP ${status} fetching ${targetUrl}`
                    )
                );
                return;
            }
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => {
                const buf = Buffer.concat(chunks);
                resolve(binary ? buf : buf.toString("utf8"));
            });
            res.on("error", reject);
        });
        req.on("error", reject);
        req.setTimeout(30000, () => {
            req.destroy(new Error(`timeout fetching ${targetUrl}`));
        });
    });
}

async function pool(items, worker) {
    const results = new Array(items.length);
    let next = 0;
    async function run() {
        while (true) {
            const i = next++;
            if (i >= items.length) return;
            results[i] = await worker(items[i], i);
        }
    }
    const runners = Array.from(
        { length: Math.min(CONCURRENCY, items.length) },
        run
    );
    await Promise.all(runners);
    return results;
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function rmrf(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function localJsonPath(kind, id) {
    return path.join(STAGE_DIR, "rest", kind, `${id}.json`);
}

function localAssetPath(remotePath) {
    // remotePath like "/sites/default/files/images/foo.svg"
    return path.join(STAGE_DIR, remotePath.replace(/^\/+/, ""));
}

function localAssetUrl(remotePath) {
    return `/cmsdata${remotePath}`;
}

function localJsonUrlForRemoteRest(remoteRestUrl) {
    // Map https://hugeampkpncms.org/rest/<endpoint>?<param>=<id> -> /cmsdata/rest/<endpoint>/<id>.json
    // Falls back to original URL if it doesn't match a known shape.
    const m = remoteRestUrl.match(
        /^https?:\/\/[^\/]+\/rest\/([a-zA-Z_]+)\?(?:id|project)=([^&\s"']+)/
    );
    if (!m) return null;
    return `/cmsdata/rest/${m[1]}/${m[2]}.json`;
}

function writeFileAtomic(filePath, content) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
}

function splitUrl(remoteUrl) {
    // Returns { path, tail } where path is the URL path component (no host,
    // no query, no fragment) and tail is "?query#frag" or "" — used so we
    // can write the file at <path> on disk while preserving query/fragment
    // in the rewritten reference (e.g. AMPdata.pdf#navpanes=0).
    const m = remoteUrl.match(/^https?:\/\/[^\/]+(\/[^?#]*)([?#].*)?$/);
    if (!m) return null;
    return {
        path: decodeURIComponent(m[1]),
        tail: m[2] || "",
    };
}

function extractRemotePath(remoteAssetUrl) {
    const split = splitUrl(remoteAssetUrl);
    return split ? split.path : null;
}

function rewriteString(s) {
    // CMS responses embed URLs inside string fields (HTML bodies, CSV values).
    // After JSON.parse the slashes are decoded, so plain URL regex applies.
    let out = s;
    out = out.replace(ASSET_URL_RE, (m) => {
        const split = splitUrl(m);
        return split ? `${localAssetUrl(split.path)}${split.tail}` : m;
    });
    out = out.replace(REST_URL_RE, (m) => {
        const local = localJsonUrlForRemoteRest(m);
        return local || m;
    });
    return out;
}

function walkJson(value, fn) {
    if (typeof value === "string") return fn(value);
    if (Array.isArray(value)) return value.map((v) => walkJson(v, fn));
    if (value && typeof value === "object") {
        const out = {};
        for (const k of Object.keys(value)) out[k] = walkJson(value[k], fn);
        return out;
    }
    return value;
}

function findAssetUrlsInJson(parsed) {
    const out = new Set();
    walkJson(parsed, (s) => {
        const m = s.match(ASSET_URL_RE) || [];
        for (const u of m) out.add(u);
        return s;
    });
    return out;
}

function assertManifestCoversSource(manifest) {
    // Scan src/portals/SysBio for hardcoded hugeampkpncms.org/rest/* slugs.
    // Fail if any literal slug is missing from the manifest. Drift detector.
    const src = path.join(REPO_ROOT, "src", "portals", "SysBio");
    const found = { byor_content: new Set(), news_list: new Set(), directcsv: new Set() };
    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (
                entry.isFile() &&
                /\.(js|vue|ts|json)$/.test(entry.name)
            ) {
                const text = fs.readFileSync(full, "utf8");
                const matches = text.match(REST_URL_RE) || [];
                for (const m of matches) {
                    const parsed = m.match(
                        /\/rest\/([a-zA-Z_]+)\?(?:id|project)=([^&\s"']+)/
                    );
                    if (!parsed) continue;
                    const kind = parsed[1];
                    const id = parsed[2];
                    if (kind in found) found[kind].add(id);
                }
            }
        }
    }
    walk(src);
    const missing = [];
    for (const kind of Object.keys(found)) {
        const declared = new Set(manifest[kind] || []);
        for (const id of found[kind]) {
            if (!declared.has(id)) missing.push(`${kind}: ${id}`);
        }
    }
    if (missing.length) {
        console.error(
            "[cmsdata] hardcoded CMS slugs found in source but not declared in scripts/cmsdata.manifest.js:"
        );
        for (const m of missing) console.error("  - " + m);
        console.error(
            "[cmsdata] Add them to the manifest (or remove the hardcoded URLs)."
        );
        process.exit(1);
    }
}

async function main() {
    skipForNonSysBioBuild();

    const manifest = require("./cmsdata.manifest.js");
    assertManifestCoversSource(manifest);

    rmrf(STAGE_DIR);
    ensureDir(STAGE_DIR);

    const fetched = []; // { kind, id, remoteUrl, filePath }

    async function fetchJson(kind, id) {
        let remoteUrl;
        if (kind === "byor_content")
            remoteUrl = `${REMOTE_BASE}/rest/byor_content?id=${encodeURIComponent(id)}`;
        else if (kind === "news_list")
            remoteUrl = `${REMOTE_BASE}/rest/news_list?project=${encodeURIComponent(id)}`;
        else if (kind === "news")
            remoteUrl = `${REMOTE_BASE}/rest/news?id=${encodeURIComponent(id)}`;
        else if (kind === "directcsv")
            remoteUrl = `${REMOTE_BASE}/rest/directcsv?id=${encodeURIComponent(id)}`;
        else throw new Error(`unknown kind ${kind}`);
        const text = await httpGet(remoteUrl);
        const filePath = localJsonPath(kind, id);
        writeFileAtomic(filePath, text);
        fetched.push({ kind, id, remoteUrl, filePath });
        console.log(
            `[cmsdata] fetched ${kind}/${id} (${text.length} bytes)`
        );
        return text;
    }

    // Phase 1: explicit byor_content / news_list / directcsv
    const initialJobs = [];
    for (const id of manifest.byor_content || [])
        initialJobs.push({ kind: "byor_content", id });
    for (const id of manifest.news_list || [])
        initialJobs.push({ kind: "news_list", id });
    for (const id of manifest.directcsv || [])
        initialJobs.push({ kind: "directcsv", id });

    await pool(initialJobs, ({ kind, id }) => fetchJson(kind, id));

    // Phase 2: enumerate news IDs from news_list responses, fetch each.
    const newsIds = new Set();
    for (const projectId of manifest.news_list || []) {
        const text = fs.readFileSync(
            localJsonPath("news_list", projectId),
            "utf8"
        );
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            throw new Error(
                `news_list/${projectId}.json is not valid JSON`
            );
        }
        if (!Array.isArray(parsed)) continue;
        for (const item of parsed) {
            const candidates = [
                item && item.id,
                item && item.nid,
                item && item.field_news_id,
            ].filter((v) => v != null && v !== "");
            for (const c of candidates) {
                newsIds.add(String(c));
                break;
            }
        }
    }
    if (newsIds.size) {
        await pool(Array.from(newsIds), (id) =>
            fetchJson("news", id)
        );
    }

    // Phase 3: crawl every cached JSON for /sites/default/files/ URLs
    // (walks the parsed structure so it catches URLs inside string values
    // where slashes were originally backslash-escaped on the wire).
    const assetUrls = new Set();
    for (const f of fetched) {
        const text = fs.readFileSync(f.filePath, "utf8");
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            throw new Error(
                `${f.kind}/${f.id}.json is not valid JSON`
            );
        }
        for (const u of findAssetUrlsInJson(parsed)) assetUrls.add(u);
    }
    for (const p of manifest.extraAssets || []) {
        assetUrls.add(`${REMOTE_BASE}${p.startsWith("/") ? p : "/" + p}`);
    }

    // Phase 4: download assets (binary).
    const assetList = Array.from(assetUrls);
    if (assetList.length) {
        await pool(assetList, async (assetUrl) => {
            const remotePath = extractRemotePath(assetUrl);
            if (!remotePath || !remotePath.startsWith(ASSET_PATH_PREFIX))
                throw new Error(
                    `asset URL outside ${ASSET_PATH_PREFIX}: ${assetUrl}`
                );
            const localPath = localAssetPath(remotePath);
            if (fs.existsSync(localPath)) return;
            const buf = await httpGet(assetUrl, { binary: true });
            ensureDir(path.dirname(localPath));
            fs.writeFileSync(localPath, buf);
            console.log(
                `[cmsdata] asset ${remotePath} (${buf.length} bytes)`
            );
        });
    }

    // Phase 5: rewrite URLs inside cached JSON to local paths.
    // Walk the parsed structure and rewrite string leaves so escaped-slash
    // serialization in raw bytes doesn't matter.
    for (const f of fetched) {
        const text = fs.readFileSync(f.filePath, "utf8");
        const parsed = JSON.parse(text);
        const rewrittenParsed = walkJson(parsed, (s) => rewriteString(s));
        const rewritten = JSON.stringify(rewrittenParsed);
        fs.writeFileSync(f.filePath, rewritten);
    }

    // Phase 6: count remaining hugeampkpncms.org references in cached JSON
    // (these are off-site CMS pages we don't mirror, e.g. /about/team links
    // embedded inside HTML bodies — they remain remote and click-through still works).
    let leftover = 0;
    const leftoverRe = /https?:\/\/hugeampkpncms\.org/g;
    for (const f of fetched) {
        const text = fs.readFileSync(f.filePath, "utf8");
        const matches = text.match(leftoverRe) || [];
        if (matches.length) {
            leftover += matches.length;
            console.warn(
                `[cmsdata] WARN ${f.kind}/${f.id}.json: ${matches.length} hugeampkpncms.org reference(s) outside /sites/default/files/ were left as remote links.`
            );
        }
    }

    // Phase 7: manifest.json
    const manifestPath = path.join(STAGE_DIR, "manifest.json");
    const out = {
        generatedAt: new Date().toISOString(),
        gitSha: process.env.GITHUB_SHA || null,
        counts: {
            json: fetched.length,
            assets: assetList.length,
            leftoverRemoteRefs: leftover,
        },
        urls: fetched.map((f) => ({
            kind: f.kind,
            id: f.id,
            remote: f.remoteUrl,
            local: f.filePath
                .replace(STAGE_DIR, "/cmsdata")
                .replace(/\\/g, "/"),
        })),
        assets: assetList.map((u) => extractRemotePath(u)),
    };
    fs.writeFileSync(manifestPath, JSON.stringify(out, null, 2));

    // Phase 8: atomic swap.
    rmrf(FINAL_DIR);
    fs.renameSync(STAGE_DIR, FINAL_DIR);

    console.log(
        `[cmsdata] done: ${fetched.length} JSON, ${assetList.length} assets -> ${FINAL_DIR}`
    );
}

main().catch((err) => {
    console.error("[cmsdata] FAILED:", err && err.message ? err.message : err);
    rmrf(STAGE_DIR);
    process.exit(1);
});
