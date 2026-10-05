// Aggregate private samples-info records for the Gene summary cards.
// Responses contain counts only; no sample identifiers or individual metadata.
const crypto = require("crypto");
const cookie = require("cookie");
const MAX_PAGES = 100;
const SAMPLE_CONCURRENCY = 12;
const MAX_GENE_CACHE = 5;
const MAX_SAMPLE_CACHE = 1000;
const GENE_BATCH_SIZE = 120;
const SAMPLE_REQUEST_TIMEOUT_MS = 20000;
const DEBUG_SAMPLE_LOOKUPS = process.env.PB_GENE_CARRIER_DEBUG === "1";

function first(row, keys) {
    for (const key of keys) {
        if (row && row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    }
    return null;
}

function variantId(row) {
    const chrom = String(first(row, ["chromosome", "CHROM", "chrom"]) || "").replace(/^chr/i, "");
    const position = Number(first(row, ["position", "POS", "pos"]));
    const ref = String(first(row, ["reference", "REF", "ref"]) || "");
    const alt = String(first(row, ["alt", "ALT", "alternate"]) || "");
    if (!/^(?:[0-9]{1,2}|X|Y|M|MT)$/i.test(chrom) || !Number.isSafeInteger(position) || position < 1 ||
        !/^[ACGTN*.-]+$/i.test(ref) || !/^[ACGTN*.,-]+$/i.test(alt)) return null;
    return `chr${chrom}:${position}:${ref}:${alt}`;
}

function display(value) {
    return value === null || value === undefined || String(value).trim() === "" ? null : String(value).trim();
}

function affectedLabel(value) {
    const normalized = String(value == null ? "" : value).trim().toLowerCase();
    if (["y", "yes", "true", "1", "affected"].includes(normalized)) return "Yes";
    if (["n", "no", "false", "0", "unaffected"].includes(normalized)) return "No";
    return null;
}

function normalizedAge(row) {
    for (const key of ["age_at_enrollment", "age_for_portal", "age", "age_band"]) {
        const text = display(row[key]);
        if (!text || !/^\d+(?:\.\d+)?$/.test(text)) continue;
        const age = Number(text);
        if (Number.isFinite(age) && age >= 0 && age <= 100) return String(age);
    }
    return "Unknown";
}

function ageBand(value) {
    const age = Number(value);
    if (value === "Unknown" || !Number.isFinite(age) || age < 0 || age > 100) return "Unknown";
    if (age < 1) return "0";
    if (age < 3) return "1-2";
    if (age < 6) return "3-5";
    if (age < 10) return "6-9";
    if (age < 14) return "10-13";
    if (age < 18) return "14-17";
    return "18+";
}

function normalizeInfo(row, queriedId) {
    if (!row || typeof row !== "object") return null;
    const vcfId = display(row.SampleInVCF);
    const canonicalId = display(row.sample_id);
    if (vcfId && vcfId !== queriedId) return null;
    if (!vcfId && canonicalId && canonicalId !== queriedId.replace(/_G38$/i, "")) return null;
    return {
        age: normalizedAge(row),
        sex: display(first(row, ["sex", "gender"])),
        investigator: display(first(row, ["investigator", "cohort", "study", "study_code"])),
        project: display(first(row, ["Project", "project", "project_name", "clean_name"])),
        affected: affectedLabel(first(row, ["initial_study_affected", "affected_flag", "affected", "is_affected"])),
        proband: String(first(row, ["family_relationship"]) || "").trim().toLowerCase() === "proband",
        genes: Array.isArray(row.genes)
            ? [...new Set(row.genes.filter(value => typeof value === "string" && /^[A-Z0-9.-]{1,40}$/i.test(value)).map(value => value.toUpperCase()))]
            : [],
    };
}

function rowsFromCounts(map, key) {
    return [...map].map(([label, count]) => ({ [key]: label, count }))
        .sort((a, b) => b.count - a.count || String(a[key]).localeCompare(String(b[key])));
}

function createSummary(gene, carrierTotal) {
    const age = new Map();
    const sex = new Map();
    const investigator = new Map();
    const project = new Map();
    const affected = new Map();
    const genes = new Map();
    const add = (map, value) => { if (value) map.set(value, (map.get(value) || 0) + 1); };
    let matchedMetadataCount = 0;
    return {
        add(info) {
            if (!info) return;
            matchedMetadataCount += 1;
            add(age, ageBand(info.age));
            add(sex, info.sex);
            add(investigator, info.investigator);
            add(project, info.project);
            add(affected, info.affected);
            for (const symbol of info.genes) {
                if (symbol !== gene) add(genes, symbol);
            }
        },
        snapshot() {
            return {
                carrierTotal,
                matchedMetadataCount,
                geneCarrierDemographics: {
                    byAge: ["0", "1-2", "3-5", "6-9", "10-13", "14-17", "18+", "Unknown"]
                        .filter(band => age.has(band))
                        .map(band => ({ band, count: age.get(band) })),
                    byInvestigator: rowsFromCounts(investigator, "inv"),
                    byProject: rowsFromCounts(project, "project"),
                    bySex: rowsFromCounts(sex, "label"),
                    byAffected: rowsFromCounts(affected, "label"),
                },
                coCarrierGenes: rowsFromCounts(genes, "gene").map(row => ({ ...row, denominator: carrierTotal })),
            };
        },
    };
}

module.exports = function registerGeneCarrierSummaryEndpoint(app, bioIndexBase) {
    const geneCache = new Map();
    const sampleCache = new Map();
    const jobs = new Map();
    const highQueue = [];
    const lowQueue = [];
    let active = 0;

    function accessScope(accessToken) {
        return accessToken
            ? crypto.createHash("sha256").update(accessToken).digest("hex").slice(0, 24)
            : "anonymous";
    }

    async function read(path, params, timeoutMs = 60000, accessToken = "") {
        const url = new URL(path, `${bioIndexBase.replace(/\/$/, "")}/`);
        for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
                ...(accessToken ? { "x-bioindex-access-token": accessToken } : {}),
            },
            signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) throw new Error(`BioIndex ${response.status} at ${path}`);
        return response.json();
    }

    async function readSample(id, accessToken) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const payload = await read("/api/bio/query/samples-info",
                    { q: id, limit: 5 }, SAMPLE_REQUEST_TIMEOUT_MS, accessToken);
                const rows = Array.isArray(payload.data) ? payload.data : [];
                const row = rows.find(candidate => normalizeInfo(candidate, id)) || null;
                const info = normalizeInfo(row, id);
                if (DEBUG_SAMPLE_LOOKUPS && !info) {
                    console.warn(`[gene-carrier-summary] samples-info ${row ? "ID mismatch" : "no row"}`);
                }
                if (info || attempt === 2) return info;
                await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
            } catch (error) {
                if (DEBUG_SAMPLE_LOOKUPS) {
                    console.warn(`[gene-carrier-summary] samples-info request failed: ${error.name || "Error"}${error.cause && error.cause.code ? ` (${error.cause.code})` : ""}`);
                }
                if (attempt === 2) throw error;
                await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
            }
        }
    }

    function carriersForGene(gene, accessToken) {
        const cacheKey = `${accessScope(accessToken)}|${gene}`;
        if (geneCache.has(cacheKey)) return geneCache.get(cacheKey);
        const pending = (async () => {
            const all = new Set();
            const byVariant = new Map();
            let page = await read("/api/bio/query/gene-variants-crdc", { q: gene }, 60000, accessToken);
            let pageNumber = 0;
            while (page) {
                if (++pageNumber > MAX_PAGES || !Array.isArray(page.data)) throw new Error("Invalid gene variant pagination");
                for (const row of page.data) {
                    const id = variantId(row);
                    if (!id || !Array.isArray(row.samples)) continue;
                    const samples = byVariant.get(id) || new Set();
                    for (const sample of row.samples) {
                        if (typeof sample !== "string" || !sample) continue;
                        samples.add(sample);
                        all.add(sample);
                    }
                    byVariant.set(id, samples);
                }
                page = page.continuation ? await read("/api/bio/cont", { token: page.continuation }, 60000, accessToken) : null;
            }
            return { all, byVariant };
        })();
        geneCache.set(cacheKey, pending);
        pending.catch(() => geneCache.delete(cacheKey));
        if (geneCache.size > MAX_GENE_CACHE) geneCache.delete(geneCache.keys().next().value);
        return pending;
    }

    function drain() {
        while (active < SAMPLE_CONCURRENCY && (highQueue.length || lowQueue.length)) {
            const task = highQueue.shift() || lowQueue.shift();
            active += 1;
            task.started = true;
            readSample(task.id, task.accessToken)
                .then(task.resolve, task.reject)
                .finally(() => { active -= 1; drain(); });
        }
    }

    function sampleInfo(id, highPriority, accessToken) {
        const cacheKey = `${accessScope(accessToken)}|${id}`;
        const cached = sampleCache.get(cacheKey);
        if (cached) {
            if (highPriority && cached.task && !cached.task.started) {
                const index = lowQueue.indexOf(cached.task);
                if (index >= 0) {
                    lowQueue.splice(index, 1);
                    highQueue.push(cached.task);
                }
            }
            return cached.promise;
        }
        let resolve;
        let reject;
        const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
        const task = { id, accessToken, resolve, reject, started: false };
        const entry = { promise, task };
        sampleCache.set(cacheKey, entry);
        promise.then(info => {
            if (!info && sampleCache.get(cacheKey) === entry) sampleCache.delete(cacheKey);
        }, () => {
            if (sampleCache.get(cacheKey) === entry) sampleCache.delete(cacheKey);
        });
        (highPriority ? highQueue : lowQueue).push(task);
        if (sampleCache.size > MAX_SAMPLE_CACHE) sampleCache.delete(sampleCache.keys().next().value);
        drain();
        return promise;
    }

    function startJob(key, gene, requestedVariant, accessToken, refreshAttemptCount = 0) {
        const job = {
            status: "loading", completed: 0, total: 0, result: null, error: null,
            summary: null, snapshot: null, snapshotCompleted: -1,
            carrierSets: null, filterInfo: requestedVariant ? null : new Map(), refreshAttemptCount,
        };
        jobs.set(key, job);
        (async () => {
            const carrierSets = await carriersForGene(gene, accessToken);
            if (!requestedVariant) job.carrierSets = carrierSets;
            const ids = requestedVariant ? carrierSets.byVariant.get(requestedVariant) : carrierSets.all;
            if (!ids) throw new Error("Variant is unavailable for this gene");
            const sampleIds = [...ids];
            job.total = sampleIds.length;
            job.summary = createSummary(gene, sampleIds.length);
            for (let offset = 0; offset < sampleIds.length; offset += GENE_BATCH_SIZE) {
                await Promise.all(sampleIds.slice(offset, offset + GENE_BATCH_SIZE).map(id =>
                    sampleInfo(id, Boolean(requestedVariant), accessToken).then(info => {
                        job.summary.add(info);
                        if (job.filterInfo) job.filterInfo.set(id, info && {
                            age: info.age, sex: info.sex, investigator: info.investigator,
                            project: info.project, affected: info.affected, proband: info.proband,
                        });
                        job.completed += 1;
                    })));
            }
            job.result = job.summary.snapshot();
            job.summary = null;
            job.snapshot = null;
            job.status = "ready";
        })().catch(error => {
            job.error = String(error && error.message ? error.message : error);
            job.status = "error";
        });
        return job;
    }

    app.get("/__gene_carrier_summary__", (request, response) => {
        response.set("Cache-Control", "private, no-store");
        response.set("X-Content-Type-Options", "nosniff");
        const gene = String(request.query.gene || "").trim().toUpperCase();
        const variant = request.query.variant == null ? "" : String(request.query.variant).trim();
        if (!/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene) ||
            (variant && !/^chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.,-]+$/i.test(variant))) {
            response.status(400).json({ error: "Enter a valid gene and variant." });
            return;
        }
        if (!bioIndexBase) {
            response.status(503).json({ error: "Private BioIndex is not configured." });
            return;
        }
        const accessToken = cookie.parse((request.headers && request.headers.cookie) || "").session || "";
        const scope = accessScope(accessToken);
        const key = `${scope}|${gene}|${variant.toLowerCase()}`;
        const previous = jobs.get(key);
        const requestedRefreshCount = Math.max(0, Math.min(2, Number(request.query.refresh) || 0));
        const refreshIncomplete = variant && requestedRefreshCount > 0 && previous &&
            previous.status === "ready" && requestedRefreshCount > previous.refreshAttemptCount &&
            previous.refreshAttemptCount < 2 &&
            previous.result.matchedMetadataCount < previous.result.carrierTotal;
        if (refreshIncomplete) {
            jobs.delete(key);
        }
        const refreshAttemptCount = refreshIncomplete ? previous.refreshAttemptCount + 1 : 0;
        const job = jobs.get(key) || startJob(key, gene, variant, accessToken, refreshAttemptCount);
        if (job.status === "loading" && job.summary && job.completed && job.snapshotCompleted !== job.completed) {
            job.snapshot = job.summary.snapshot();
            job.snapshotCompleted = job.completed;
        }
        response.json({ status: job.status, completed: job.completed, total: job.total,
            ...(job.status === "ready" ? job.result : job.snapshot || {}),
            ...(job.status === "error" ? { error: job.error } : {}) });
        if (job.status === "error") jobs.delete(key);
    });

    app.get("/__gene_locus_filter__", (request, response) => {
        response.set("Cache-Control", "private, no-store");
        response.set("X-Content-Type-Options", "nosniff");
        const gene = String(request.query.gene || "").trim().toUpperCase();
        const start = Number(request.query.start);
        const end = Number(request.query.end);
        const bins = Number(request.query.bins || 60);
        const layout = String(request.query.layout || "public");
        const scope = String(request.query.scope || "All");
        const age = String(request.query.age || "All ages");
        const investigator = String(request.query.investigator || "All investigators");
        const project = String(request.query.project || "All projects");
        const sex = String(request.query.sex || "All");
        const accessToken = cookie.parse((request.headers && request.headers.cookie) || "").session || "";
        const tokenScope = accessScope(accessToken);
        if (!/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene) ||
            !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end <= start ||
            !Number.isSafeInteger(bins) || bins < 1 || bins > 120 ||
            !["pb", "public"].includes(layout) ||
            !["All", "Affected", "Proband"].includes(scope) ||
            !["All", "Female", "Male", "n/a"].includes(sex) ||
            age.length > 50 || investigator.length > 160 || project.length > 160) {
            response.status(400).json({ error: "Invalid locus filter." });
            return;
        }
        if (!bioIndexBase) {
            response.status(503).json({ error: "Private BioIndex is not configured." });
            return;
        }
        const key = `${tokenScope}|${gene}|`;
        const job = jobs.get(key) || startJob(key, gene, "", accessToken);
        if (job.status === "error") {
            jobs.delete(key);
            response.status(502).json({ error: job.error || "Carrier metadata unavailable." });
            return;
        }
        if (!job.carrierSets || !job.filterInfo || !job.filterInfo.size) {
            response.json({ status: "loading", completed: job.completed, total: job.total });
            return;
        }
        const matches = info => {
            if (!info) return false;
            if (scope === "Affected" && info.affected !== "Yes") return false;
            if (scope === "Proband" && !info.proband) return false;
            if (age !== "All ages" && ageBand(info.age) !== age) return false;
            if (layout === "pb" && investigator !== "All investigators" && info.investigator !== investigator) return false;
            if (layout === "public" && project !== "All projects" && info.project !== project) return false;
            const sampleSex = String(info.sex || "").trim().toLowerCase();
            if (sex === "Female" && sampleSex !== "f" && sampleSex !== "female") return false;
            if (sex === "Male" && sampleSex !== "m" && sampleSex !== "male") return false;
            if (sex === "n/a" && sampleSex && !["unknown", "na", "n/a", "unavailable"].includes(sampleSex)) return false;
            return true;
        };
        const densitySets = Array.from({ length: bins }, () => new Set());
        const inView = new Set();
        const variantCounts = {};
        for (const [id, sampleIds] of job.carrierSets.byVariant) {
            const position = Number(id.split(":")[1]);
            if (position < start || position > end) continue;
            const span = end - start + (layout === "public" ? 1 : 0);
            const bin = Math.min(bins - 1, Math.floor((position - start) / span * bins));
            let count = 0;
            for (const sampleId of sampleIds) {
                if (!matches(job.filterInfo.get(sampleId))) continue;
                count += 1;
                inView.add(sampleId);
                densitySets[bin].add(sampleId);
            }
            variantCounts[id] = count;
        }
        response.json({ status: job.status === "ready" ? "ready" : "partial",
            completed: job.completed, total: job.total, distinctCarriers: inView.size,
            carrierDensity: densitySets.map(set => set.size), variantCounts });
    });
};
