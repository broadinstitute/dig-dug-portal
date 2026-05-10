#!/usr/bin/env node
//
// Predeploy guard for the SysBio portal: ensures the committed CMS cache
// snapshot exists before the build starts. The portal serves /cmsdata/...
// from this directory at runtime when USE_REMOTE_CMS is unset (the default).
//
// If the cache is missing, fail loudly with instructions rather than ship
// a portal that 404s on every CMS-backed page.
//
// Skipped for non-SysBio builds (other portals don't use the cache).

"use strict";

const fs = require("fs");
const path = require("path");

const cfg = process.env.VUE_CLI_SERVICE_CONFIG_PATH || "";
if (cfg && !/SysBio/i.test(cfg)) {
    process.exit(0);
}

const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(repoRoot, "public", "cmsdata", "manifest.json");

if (!fs.existsSync(manifestPath)) {
    console.error("");
    console.error(
        "[cmsdata] ERROR: public/cmsdata/manifest.json is missing."
    );
    console.error(
        "[cmsdata] The SysBio build serves /cmsdata/ from a committed snapshot."
    );
    console.error("[cmsdata] To populate or refresh it:");
    console.error("[cmsdata]   npm run fetch:cmsdata");
    console.error(
        "[cmsdata] then review and commit the resulting public/cmsdata/ tree."
    );
    console.error("");
    process.exit(1);
}

try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const generated = manifest.generatedAt || "unknown";
    const counts = manifest.counts || {};
    console.log(
        `[cmsdata] using snapshot from ${generated} (${counts.json || 0} JSON, ${counts.assets || 0} assets)`
    );
} catch (e) {
    console.error("[cmsdata] ERROR: manifest.json is not valid JSON:", e.message);
    process.exit(1);
}
