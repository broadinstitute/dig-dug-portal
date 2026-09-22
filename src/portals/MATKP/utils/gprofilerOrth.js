const GPROFILER_ORTH_URL =
    "https://biit.cs.ut.ee/gprofiler/api/orth/orth/";
const NA = "N/A";

export async function fetchOrthologRow(query, organism, target) {
    const trimmed = String(query || "").trim();

    if (!trimmed) {
        return null;
    }

    let body = JSON.stringify({
            organism,
            target,
            query: [trimmed],
        });
    const response = await fetch(GPROFILER_ORTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
    });

    if (!response.ok) {
        return null;
    }

    let data = await response.json();
    const rows = data.result || [];

    return (
        rows.find(
            (row) =>
                row.incoming === trimmed ||
                row.incoming?.toUpperCase() === trimmed.toUpperCase()
        ) || rows[0] || null
    );
}

export async function fetchOrthologSymbol(query, organism, target) {
    const row = await fetchOrthologRow(query, organism, target);
    
    if (!row?.name || row.n_result < 1) {
        return null;
    }

    return row.name;
}

export async function resolveCanonicalHumanGene(query, searchSpecies) {
    const trimmed = String(query || "").trim();

    if (!trimmed) {
        return null;
    }

    if (searchSpecies === "human") {
        return trimmed.toUpperCase();
    }

    const row = await fetchOrthologRow(trimmed, "mmusculus", "hsapiens");

    if (row?.name && row.n_result >= 1) {
        return row.name.toUpperCase();
    }

    return null;
}

export async function resolveHumanMouseSymbols(query, searchSpecies) {
    const trimmed = String(query || "").trim();

    if (!trimmed) {
        return { human: null, mouse: null };
    }

    if (searchSpecies === "human") {
        const human = trimmed.toUpperCase();
        const mouse =
            (await fetchOrthologSymbol(human, "hsapiens", "mmusculus")) ||
            human;
        if (mouse === NA){
            const mouseToHuman = await fetchOrthologRow(human, "mmusculus", "hsapiens");
            if (mouseToHuman.converted !== NA){
                let formatMouseName = mouseToHuman.incoming;
                formatMouseName = formatMouseName.slice(0,1).concat(formatMouseName.slice(1).toLowerCase());
                return { human: mouseToHuman.name, mouse: formatMouseName}
            }
        }
        return { human, mouse };
    }

    const row = await fetchOrthologRow(trimmed, "mmusculus", "hsapiens");

    if (row?.name && row.n_result >= 1) {
        return {
            human: row.name.toUpperCase(),
            mouse: row.incoming || trimmed,
        };
    }

    return {
        human: null,
        mouse: trimmed,
    };
}
