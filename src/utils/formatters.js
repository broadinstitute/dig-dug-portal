
function alleleFormatter(reference, alt) {
    if (reference.length > 3) {
        reference = reference.substr(0, 3) + "...";
    }

    if (alt.length > 3) {
        alt = alt.substr(0, 3) + "...";
    }

    return `${reference}/${alt}`;
}

function ancestryFormatter(s) {
    const ancestries = {
        AA: "African American",
        AF: "African",
        EA: "East Asian",
        EU: "European",
        HS: "Hispanic/Latin",
        SA: "South Asian",
    }

    return ancestries[s] || "Mixed";
}

function annotationFormatter(s) {
    return s.replace(/([a-z])([A-Z0-9])/g, (m, p1, p2) => `${p1} ${p2}`);
}

function consequenceFormatter(s) {
    return s.replace(/_/g, ' ').replace(/(^| )([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
}

function dbSNPFormatter(dbSNP) {
    return !!dbSNP ? dbSNP : '-';
}

function floatFormatter(pValue) {
    if (!pValue) {
        return '-';
    }

    let x = Number.parseFloat(pValue);

    if (x < 1e-5) {
        return x.toExponential(2);
    } else {
        return x.toFixed(5);
    }
}

function intFormatter(value) {
    return !!value ? Number.parseFloat(value).toFixed(0) : '-';
}

function locusFormatter(chromosome, position, end = undefined) {
    if (!!end) {
        return `${chromosome}:${position}-${end}`;
    }
    return `${chromosome}:${position}`;
}

function phenotypeFormatter(phenotype) {
    return !!phenotype ? phenotype.description : '-';
}

function tissueFormatter(tissue) {
    if (!tissue) {
        return '-';
    }

    return consequenceFormatter(tissue.description);
}

export default {
    alleleFormatter,
    ancestryFormatter,
    annotationFormatter,
    consequenceFormatter,
    dbSNPFormatter,
    floatFormatter,
    intFormatter,
    locusFormatter,
    phenotypeFormatter,
    tissueFormatter,
}
