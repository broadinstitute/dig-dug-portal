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
        Mixed: "Mixed"
    };
    return ancestries[s];
}

function snakeFormatter(s) {
    if (!!s) {
        return s.replace(/(^|_|\s)([a-z])/g, (m, t, s) => `${t.length > 0 ? ' ' : ''}${s.toUpperCase()}`);
    }
}

function annotationFormatter(s) {
    return snakeFormatter(s);
}

function bioTypeFormatter(s) {
    return capitalizedFormatter(s);
}

function capitalizedFormatter(s) {
    return snakeFormatter(s);
}

function consequenceFormatter(s) {
    return capitalizedFormatter(s);
}

function consequenceMeaning(s) {
    const consequences = {
        transcript_ablation:
            "It deletes a region that includes a transcript feature.",
        splice_donor_variant:
            "It is a splice variant that changes the 2-base region at the 5' end of an intron.",
        splice_acceptor_variant:
            "It is a splice variant that changes the 2-base region at the 3' end of an intron.",
        stop_gained:
            "It is a sequence variant that introduces a stop codon, leading to a shortened transcript.",
        frameshift_variant:
            "It causes a frameshift, disrupting the translational reading frame because the number of nucleotides inserted or deleted is not a multiple of three.",
        stop_lost:
            "It is a sequence variant that changes a stop codon, resulting in an elongated transcript.",
        initiator_codon_variant: "It changes the first codon of a transcript.",
        inframe_insertion:
            "It is an inframe non-synonymous variant that inserts bases into the coding sequence.",
        inframe_deletion:
            "It is an inframe non-synonymous variant that deletes bases from the coding sequence.",
        missense_variant:
            "It results in a different amino acid sequence but preserves length.",
        transript_amplification:
            "It amplifies a region containing a transcript.",
        splice_region_variant:
            "It is a sequence variant in which a change has occurred within the region of a splice site, either within 1-3 bases of the exon or 3-8 bases of the intron.",
        incomplete_terminal_codon_variant:
            "It is a sequence variant that changes at least one base of the final codon of an incompletely annotated transcript.",
        synonymous_variant:
            "It does not cause any change to the encoded amino acid.",
        stop_retained_variant:
            "It changes the set of bases in a stop codon, but the stop codon itself remains functional.",
        coding_sequence_variant: "It changes the coding sequence.",
        mature_miRNA_variant:
            "It is a transcript variant located with the sequence of the mature miRNA.",
        "5_prime_UTR_variant": "It is found in the 5' untranslated region.",
        "3_prime_UTR_variant": "It is found in the 3' untranslated region.",
        non_coding_exon_variant: "It changes the non-coding exon sequence.",
        nc_transcript_variant:
            "It is a transcript variant of a non-coding RNA.",
        intron_variant:
            "It is a transcript variant occurring within an intron.",
        nmd_transcript_variant:
            "It falls in a transcript that is the target of nonsense-mediated decay.",
        upstream_gene_variant: "It is located upstream (5') of the gene.",
        downstream_gene_variant: "It is located downstream (3') of the gene.",
        tfbs_ablation:
            "It deletes a region that includes a transcription factor binding site.",
        tfbs_amplification:
            "It amplifies a region that includes a transcription factor binding site.",
        tf_binding_site_variant:
            "It is located within a transcription factor binding site.",
        regulatory_region_variant: "It is located within a regulatory region.",
        regulatory_region_ablation: "It deletes a regulatory region.",
        regulatory_region_amplification: "It amplifies a regulatory region.",
        feature_elongation:
            "It causes the extension of a genomic feature with regard to the reference sequence.",
        feature_truncation:
            "It causes the truncation of a genomic feature with regard to the reference sequence.",
        intergenic_variant:
            "It is located in an intergenic region (between genes)."
    };

    return consequences[s] || "Unknown";
}

function dbSNPFormatter(dbSNP) {
    return dbSNP;
}

function floatFormatter(value) {
    if (!value) {
        return "-";
    }
    return Number.parseFloat(value).toFixed(2);
}

function pValueFormatter(value) {
    if (!value) {
        return "-";
    }

    let x = Number.parseFloat(value);

    if (x < 1e-5) {
        return x.toExponential(2);
    } else {
        let num = (x.toFixed(7) * 1).toString(); // remove trailing zeroes using string hacks
        return num;
    }
}

function effectFormatter(value) {
    if (!value) {
        return "-";
    }
    return Number.parseFloat(value).toFixed(4);
}

function intFormatter(value) {
    return !!value ? Number.parseInt(value).toLocaleString() : "-";
}

function igvLocusFormatter(igvLocus) {
    const chromosome = igvLocus.chr.charAt(3);
    const start = igvLocus.start.replace(/,/g, "");
    const end = igvLocus.end.replace(/,/g, "");
    return locusFormatter(chromosome, start, end);
}

function locusFormatter(chromosome, position, end = undefined) {
    if (!!end) {
        return `${chromosome}:${intFormatter(position)}-${intFormatter(end)}`;
    }
    return `${chromosome}:${intFormatter(position)}`;
}

function phenotypeFormatter(phenotype) {
    return !!phenotype ? phenotype.description : "-";
}

function methodFormatter(method) {
    if (!method) {
        return "-";
    }

    return capitalizedFormatter(method);
}

function tissueFormatter(tissue) {
    return snakeFormatter(tissue);
}

function pValueCss(value, max) {
    if (value === max) return 100;
    const maxWidth = Math.log(-Math.log10(max));
    const barWidth = Math.log(-Math.log10(value));
    let calculated = (barWidth / maxWidth) * 100;
    return calculated > 100 ? 100 : calculated;
}

function decimalFormatter(NUM, DECIMAL) {

    let decimal = DECIMAL == 0 ? 1 : DECIMAL * 10
    let newNum = Math.round(NUM * decimal) / decimal;
    return newNum;
}

export default {
    alleleFormatter,
    ancestryFormatter,
    annotationFormatter,
    bioTypeFormatter,
    capitalizedFormatter,
    consequenceFormatter,
    consequenceMeaning,
    dbSNPFormatter,
    floatFormatter,
    intFormatter,
    locusFormatter,
    igvLocusFormatter,
    phenotypeFormatter,
    snakeFormatter,
    tissueFormatter,
    methodFormatter,
    pValueFormatter,
    effectFormatter,
    pValueCss,
    decimalFormatter
};
