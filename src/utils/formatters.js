
function alleleFormatter(reference, alt) {
    if (reference.length > 3) {
        reference = reference.substr(0, 3) + "...";
    }

    if (alt.length > 3) {
        alt = alt.substr(0, 3) + "...";
    }

    return `${reference}/${alt}`;
}

function annotationFormatter(s) {
    return s.replace(/([a-z])([A-Z0-9])/g, (m, p1, p2) => `${p1} ${p2}`);
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

function locusFormatter(chromosome, position, end) {
    if (!!end) {
        return `${chromosome}:${position}-${end}`;
    }
    return `${chromosome}:${position}`;
}

function phenotypeFormatter(phenotype) {
    return !!phenotype ? phenotype.description : '-';
}

function tissueFormatter(tissue) {
    return !!tissue ? tissue.description : '-';
}

export default {
    alleleFormatter,
    annotationFormatter,
    dbSNPFormatter,
    floatFormatter,
    intFormatter,
    locusFormatter,
    phenotypeFormatter,
    tissueFormatter,
}
