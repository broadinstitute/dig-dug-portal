// Reuse the private Gene/Variant samples-info provider for Sample match labels
// and full-population project summaries. Never send the full scoring roster to
// the browser, and never substitute local cohort/Investigator labels for Project.
const express = require('express');
const canonical = value => String(value || '').replace(/_[EG]38$/i, '');
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);

function quantile(sorted, p) {
    const at = (sorted.length - 1) * p, low = Math.floor(at);
    return sorted[low] + (sorted[Math.ceil(at)] - sorted[low]) * (at - low);
}

async function projectResults(result, provider, token) {
    const inputs = result._project_inputs;
    if (!Array.isArray(inputs) || inputs.length !== result.eligible_sample_count || inputs.length > 50000
        || !validId(result.sample_id) || inputs.some(row => !validId(row.sample_id)
            || !validId(row.vcf_sample_id) || canonical(row.vcf_sample_id) !== row.sample_id
            || row.residual !== null && !Number.isFinite(row.residual)) || new Set(inputs.map(row => row.sample_id)).size !== inputs.length
        || !Array.isArray(result.phenotypeMatches) || result.phenotypeMatches.length !== inputs.length) {
        throw Error('Invalid project aggregation inputs.');
    }
    const reference = result._reference_vcf_sample_id;
    if (!validId(reference) || canonical(reference) !== result.sample_id) throw Error('Invalid reference sample.');
    const requested = [...inputs, {sample_id: result.sample_id, vcf_sample_id: reference}];
    const metadata = new Map();
    let next = 0;
    await Promise.all(Array.from({length: Math.min(12, requested.length)}, async () => {
        while (next < requested.length) {
            const row = requested[next++], explicit = /_[EG]38$/i.test(row.vcf_sample_id);
            const keys = explicit ? [row.vcf_sample_id] : [`${row.sample_id}_E38`, `${row.sample_id}_G38`];
            let info = null;
            for (const key of keys) {
                info = await provider.sampleInfo(key, token);
                if (info) break;
            }
            metadata.set(row.sample_id, info);
        }
    }));
    const project = id => (metadata.get(id) || {}).project || 'Unavailable';
    const referenceProject = project(result.sample_id), groups = new Map(), investigators = new Map();
    for (const row of inputs) {
        if (row.residual === null) continue;
        const label = project(row.sample_id);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(row.residual);
        const investigator = (metadata.get(row.sample_id) || {}).investigator;
        if (!investigators.has(label)) investigators.set(label, new Set());
        if (investigator) investigators.get(label).add(investigator);
    }
    const summaries = [...groups].map(([label, values]) => {
        values.sort((a, b) => a - b);
        const q1 = quantile(values, .25), q3 = quantile(values, .75);
        return {project: label, medianResidual: quantile(values, .5), q1, q3,
            iqr: `${q1.toFixed(2)}–${q3.toFixed(2)}`, n: values.length,
            investigators: [...investigators.get(label)].sort((a, b) => a.localeCompare(b)),
            currentGroup: label !== 'Unavailable' && label === referenceProject};
    }).sort((a, b) => b.medianResidual - a.medianResidual || a.project.localeCompare(b.project));
    const {_project_inputs, _reference_vcf_sample_id, ...publicResult} = result;
    return {...publicResult,
        phenotypeMatches: result.phenotypeMatches.map(row => {
            const info = metadata.get(row.sampleId) || {};
            return {...row, project: project(row.sampleId), investigator: info.investigator || 'Unavailable',
                recordedHpoCount: Array.isArray(info.observedHpoIds) ? new Set(info.observedHpoIds).size : row.recordedHpoCount};
        }),
        projectPhenotypeSummary: summaries.map((row, index) => ({...row, rank: index + 1})),
        project_metadata_source: 'BioIndex samples-info',
    };
}

module.exports = function registerSampleMatchProjects(app, provider, options = {}) {
    const base = options.profileBase || `http://127.0.0.1:${process.env.PB_PHENOTYPE_PROFILE_PORT || 8093}`;
    // The scorer's full candidate vector is for this backend join only.
    app.post('/__pb_phenotype_profile__/sample-match-inputs', (_request, response) => response.status(404).end());
    app.post('/__pb_phenotype_profile__/sample-matches', express.json({limit: '16kb'}), async (request, response) => {
        response.set('Cache-Control', 'private, no-store');
        const sampleId = request.body && request.body.sample_id;
        if (!validId(sampleId)) { response.status(400).json({detail: 'Enter a valid sample ID.'}); return; }
        const candidate = request.body.candidate_id;
        const page = request.body.gene_page == null ? 1 : request.body.gene_page;
        const gene = request.body.gene;
        if (candidate != null && (!validId(candidate) || !Number.isInteger(page) || page < 1 || page > 10000
            || gene != null && (typeof gene !== 'string' || !/^[A-Za-z0-9.-]{1,40}$/.test(gene)))) {
            response.status(400).json({detail: 'Enter a valid comparison sample and gene page.'}); return;
        }
        try {
            const upstream = await fetch(new URL('/phenotype-analyzer-api/sample-match-inputs', base), {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({sample_id: sampleId, ...(candidate == null ? {} : {candidate_id: candidate, gene_page: page, ...(gene == null ? {} : {gene})})}), signal: AbortSignal.timeout(180000),
            });
            const result = await upstream.json();
            if (!upstream.ok) { response.status(upstream.status).json(result); return; }
            if (result.sample_id !== canonical(sampleId)) throw Error('Sample response ID mismatch.');
            if (candidate != null && result.candidate_id !== canonical(candidate)) throw Error('Comparison response ID mismatch.');
            response.json(candidate == null ? await projectResults(result, provider, provider.accessToken(request))
                : await detailResult(result, provider, provider.accessToken(request)));
        } catch (_) {
            response.status(502).json({detail: 'Sample project metadata is unavailable from BioIndex. Please retry.'});
        }
    });
};

async function detailResult(result, provider, token) {
    let info = null;
    for (const suffix of ['_E38', '_G38']) {
        info = await provider.sampleInfo(result.candidate_id + suffix, token);
        if (info) break;
    }
    if (!info || !Array.isArray(info.observedHpoIds)) return result;
    const recorded = new Set(info.observedHpoIds);
    return {...result, candidate_recorded_hpo_count: recorded.size,
        hpo_matches: result.hpo_matches.map(row => ({...row,
            matchType: row.matched == null ? 'unavailable' : row.matched ? recorded.has(row.id) ? 'recorded' : 'parent-expanded' : 'unmatched'}))};
}
module.exports.projectResults = projectResults;
module.exports.detailResult = detailResult;
