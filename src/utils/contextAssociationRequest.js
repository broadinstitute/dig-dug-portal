// Keep slow calculation/response downloads bounded instead of leaving an
// indefinite loading state. The deadline also covers reading the JSON body.
async function fetchContextAssociations(payload, fetcher = fetch, timeoutMs = 120000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetcher('/phenotype-analyzer-api/co-gene-associations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        if (!response.ok) throw new Error(`CRDC gene analysis returned ${response.status}. Please retry.`);
        return await response.json();
    } catch (error) {
        if (controller.signal.aborted) throw new Error('Gene association calculation timed out after 2 minutes. Please retry.');
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = { fetchContextAssociations };
