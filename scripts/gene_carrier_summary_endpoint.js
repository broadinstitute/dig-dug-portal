// Aggregate private samples-info records for the Gene summary cards.
// Responses contain aggregate counts and project-level investigator labels;
// no sample identifiers or individual metadata.
const crypto = require("crypto");
const cookie = require("cookie");
const express = require("express");
const os = require('os');
const path = require('path');
const { openCarrierDiskCache } = require('./gene_carrier_disk_cache');
const MAX_PAGES = 100;
const SAMPLE_CONCURRENCY = 12;
const MAX_GENE_CACHE = 5;
const MAX_SAMPLE_CACHE = 5000;
const MAX_SAMPLE_CACHE_BYTES = 32 * 1024 * 1024;
const SAMPLE_CACHE_TTL_MS = 15 * 60 * 1000;
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
        project: display(first(row, ["clean_name", "Project", "project", "project_name"])),
        affected: affectedLabel(first(row, ["initial_study_affected", "affected_flag", "affected", "is_affected"])),
        proband: String(first(row, ["family_relationship"]) || "").trim().toLowerCase() === "proband",
        geneListAvailable: Array.isArray(row.genes),
        hpoIds: Array.isArray(row.phenotypes)
            ? [...new Set(row.phenotypes.map(term => String(typeof term === "string" ? term : term && (term.hpo_id || term.hpoId || term.id) || "").toUpperCase()).filter(id => /^HP:\d{7}$/.test(id)))]
            : null,
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
    const projectInvestigators = new Map();
    const affected = new Map();
    const genes = new Map();
    const hpos = new Map();
    const add = (map, value) => { if (value) map.set(value, (map.get(value) || 0) + 1); };
    let matchedMetadataCount = 0;
    let phenotypeMetadataCount = 0;
    let geneListMetadataCount = 0;
    return {
        add(info) {
            if (!info) return;
            matchedMetadataCount += 1;
            if (info.geneListAvailable) geneListMetadataCount += 1;
            if (info.hpoIds !== null) {
                phenotypeMetadataCount += 1;
                for (const id of info.hpoIds) add(hpos, id);
            }
            add(age, ageBand(info.age));
            add(sex, info.sex);
            add(investigator, info.investigator);
            add(project, info.project);
            if (info.project && info.investigator) {
                if (!projectInvestigators.has(info.project)) projectInvestigators.set(info.project, new Set());
                projectInvestigators.get(info.project).add(info.investigator);
            }
            add(affected, info.affected);
            for (const symbol of info.genes) {
                if (symbol !== gene) add(genes, symbol);
            }
        },
        snapshot() {
            return {
                carrierTotal,
                matchedMetadataCount,
                phenotypeMetadataCount,
                geneListMetadataCount,
                observedPhenotypes: rowsFromCounts(hpos, "hpoId").map(row => ({ ...row, denominator: phenotypeMetadataCount })),
                geneCarrierDemographics: {
                    byAge: ["0", "1-2", "3-5", "6-9", "10-13", "14-17", "18+", "Unknown"]
                        .filter(band => age.has(band))
                        .map(band => ({ band, count: age.get(band) })),
                    byInvestigator: rowsFromCounts(investigator, "inv"),
                    byProject: rowsFromCounts(project, "project"),
                    projectInvestigators: Object.fromEntries([...projectInvestigators].map(([name, investigators]) => [name, [...investigators].sort()])),
                    bySex: rowsFromCounts(sex, "label"),
                    byAffected: rowsFromCounts(affected, "label"),
                },
                coCarrierGenes: rowsFromCounts(genes, "gene").map(row => ({ ...row, denominator: carrierTotal })),
            };
        },
    };
}

module.exports = function registerGeneCarrierSummaryEndpoint(app, bioIndexBase, options = {}) {
    const geneCache = new Map();
    const sampleCache = new Map();
    const jobs = new Map();
    const selectedJobs = new Map();
    const diskContexts = new Map();
    const highQueue = [];
    const lowQueue = [];
    let active = 0;
    let sampleCacheBytes = 0;

    require('./gene_variant_hpo_counts_endpoint')(app, {
        accessToken: request => cookie.parse((request.headers && request.headers.cookie) || '').session || '',
        carriersForGene,
        sampleInfo: (id, token) => sampleInfo(id, true, token),
    });

    function removeCachedSample(key, entry) {
        if (sampleCache.get(key) !== entry) return;
        sampleCache.delete(key);
        sampleCacheBytes -= entry.bytes || 0;
    }

    function trimSampleCache() {
        // Keep in-flight lookups until they settle so a high-priority variant
        // can reuse/promote the same request instead of fetching it twice.
        for (const [key, entry] of sampleCache) {
            if (sampleCache.size <= MAX_SAMPLE_CACHE && sampleCacheBytes <= MAX_SAMPLE_CACHE_BYTES) break;
            if (entry.ready) removeCachedSample(key, entry);
        }
    }

    function accessScope(accessToken) {
        return accessToken
            ? crypto.createHash("sha256").update(accessToken).digest("hex").slice(0, 24)
            : "anonymous";
    }

    function diskCache(accessToken) {
        if (options.diskCache === false) return Promise.resolve(null);
        const scope=accessScope(accessToken);
        if (!diskContexts.has(scope)) {
            const pending=(async()=>{
                const indexes=await read('/api/bio/indexes',{},10000,accessToken);
                const sources=['samples-info','gene-variants-crdc'].map(name=>{
                    const row=(indexes.data||[]).find(value=>value.index===name);
                    if(!row || !row.built)throw new Error('Cannot verify carrier cache source version');
                    return [name,row.built,row.schema];
                });
                const namespace=crypto.createHash('sha256').update(JSON.stringify([bioIndexBase,scope,sources])).digest('hex');
                return openCarrierDiskCache(process.env.PB_GENE_CARRIER_CACHE_DIR || path.join(os.tmpdir(),'pb-gene-carrier-cache-v1'),namespace);
            })().catch(()=>null);
            diskContexts.set(scope,pending);
        }
        return diskContexts.get(scope);
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
        const disk=await diskCache(accessToken);
        const stored=disk && disk.getSample(id);
        if(stored)return stored;
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
                if (info || attempt === 2) { if(info && disk)disk.putSample(id,info); return info; }
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
            const disk=await diskCache(accessToken);
            const stored=disk && await disk.getCarriers(gene);
            if(stored)return stored;
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
            const result={ all, byVariant };
            if(disk)disk.putCarriers(gene,result);
            return result;
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
        let cached = sampleCache.get(cacheKey);
        if (cached && cached.ready && cached.expiresAt <= Date.now()) {
            removeCachedSample(cacheKey, cached);
            cached = null;
        }
        if (cached) {
            sampleCache.delete(cacheKey);
            sampleCache.set(cacheKey, cached);
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
        const entry = { promise, task, ready: false, bytes: 0, expiresAt: 0 };
        sampleCache.set(cacheKey, entry);
        promise.then(info => {
            if (!info) { removeCachedSample(cacheKey, entry); return; }
            if (sampleCache.get(cacheKey) !== entry) return;
            entry.ready = true;
            entry.bytes = Buffer.byteLength(JSON.stringify(info), 'utf8');
            entry.expiresAt = Date.now() + SAMPLE_CACHE_TTL_MS;
            sampleCacheBytes += entry.bytes;
            trimSampleCache();
        }, () => {
            removeCachedSample(cacheKey, entry);
        });
        (highPriority ? highQueue : lowQueue).push(task);
        trimSampleCache();
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
            const disk=await diskCache(accessToken);
            const stored=!requestedVariant && !refreshAttemptCount && disk && await disk.getSummary(gene);
            if(stored && stored.carrierTotal===sampleIds.length && stored.matchedMetadataCount===sampleIds.length &&
                sampleIds.every(id=>disk.getSample(id))) {
                job.result=stored;job.completed=sampleIds.length;job.status='ready';
                for(const id of sampleIds) { const info=disk.getSample(id); if(info)job.filterInfo.set(id,info); }
                return;
            }
            job.summary = createSummary(gene, sampleIds.length);
            let nextSample = 0;
            const workers = Array.from({ length: Math.min(SAMPLE_CONCURRENCY * 2, sampleIds.length) }, async () => {
                while (nextSample < sampleIds.length && job.status === 'loading') {
                    const id = sampleIds[nextSample++];
                    const info = await sampleInfo(id, Boolean(requestedVariant), accessToken);
                    job.summary.add(info);
                    if (job.filterInfo) job.filterInfo.set(id, info && {
                        age: info.age, sex: info.sex, investigator: info.investigator,
                        project: info.project, affected: info.affected, proband: info.proband,
                    });
                    job.completed += 1;
                }
            });
            await Promise.all(workers);
            job.result = job.summary.snapshot();
            job.summary = null;
            job.snapshot = null;
            job.status = "ready";
            if(!requestedVariant && disk && job.result.matchedMetadataCount===job.total)disk.putSummary(gene,job.result);
        })().catch(error => {
            job.error = String(error && error.message ? error.message : error);
            job.status = "error";
        });
        return job;
    }

    app.post("/__gene_carrier_demographics__", express.json({ limit: "1mb" }), (request, response) => {
        response.set("Cache-Control", "private, no-store");
        response.set("X-Content-Type-Options", "nosniff");
        const gene = String((request.body || {}).gene || "").trim().toUpperCase();
        const requested = (request.body || {}).variant_ids;
        if (!/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene) || !Array.isArray(requested) || requested.length > 20000 ||
            requested.some(id => typeof id !== 'string' || !/^chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.,-]+$/i.test(id))) {
            response.status(400).json({ error: "Enter a valid gene and variant selection." });
            return;
        }
        if (!bioIndexBase) { response.status(503).json({ error: "Private BioIndex is not configured." }); return; }
        const variants = [...new Set(requested)].sort();
        if (!variants.length) {
            const empty = createSummary(gene, 0).snapshot();
            response.json({ status: 'ready', completed: 0, total: 0, carrierTotal: 0, matchedMetadataCount: 0, geneCarrierDemographics: empty.geneCarrierDemographics });
            return;
        }
        const accessToken = cookie.parse((request.headers && request.headers.cookie) || "").session || "";
        const scope = accessScope(accessToken);
        const key = `${scope}|${gene}|${crypto.createHash('sha256').update(JSON.stringify(variants)).digest('hex')}`;
        let job = selectedJobs.get(key);
        if (!job) {
            job = { status: 'loading', completed: 0, total: 0, summary: null, error: null };
            selectedJobs.set(key, job);
            if (selectedJobs.size > 20) selectedJobs.delete(selectedJobs.keys().next().value);
            (async () => {
                const carrierSets = await carriersForGene(gene, accessToken);
                const selected = new Set();
                for (const id of variants) {
                    const carriers = carrierSets.byVariant.get(id);
                    if (!carriers) throw new Error('A selected variant is unavailable for this gene.');
                    for (const sample of carriers) selected.add(sample);
                }
                const ids = [...selected];
                job.total = ids.length;
                job.summary = createSummary(gene, ids.length);
                let next = 0;
                await Promise.all(Array.from({ length: Math.min(SAMPLE_CONCURRENCY * 2, ids.length) }, async () => {
                    while (next < ids.length && job.status === 'loading') {
                        const id = ids[next++];
                        const geneJob = jobs.get(`${scope}|${gene}|`);
                        const cached = geneJob && geneJob.filterInfo;
                        const info = cached && cached.has(id) ? cached.get(id) : await sampleInfo(id, true, accessToken);
                        // Only demographics are aggregated. Reuse gene-level metadata when present;
                        // the union above counts a person once even if they carry several selected variants.
                        job.summary.add(info && { ...info, genes: [], hpoIds: null });
                        job.completed += 1;
                    }
                }));
                job.status = 'ready';
            })().catch(error => { job.error = String(error.message || error); job.status = 'error'; });
        }
        const snapshot = job.summary && job.summary.snapshot();
        response.json({ status: job.status, completed: job.completed, total: job.total,
            ...(snapshot ? { carrierTotal: snapshot.carrierTotal, matchedMetadataCount: snapshot.matchedMetadataCount, geneCarrierDemographics: snapshot.geneCarrierDemographics } : {}),
            ...(job.error ? { error: job.error } : {}) });
        if (job.status === 'error') selectedJobs.delete(key);
    });

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
