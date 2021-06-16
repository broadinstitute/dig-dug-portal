import {
    MISSING_VALUES,
    has,
    parseAlleleFrequency,
    parseMarker,
    parsePvalToLog,
} from './parser_utils';


/**
 * Specify how to parse a GWAS file, given certain column information.
 * Outputs an object with fields in portal API format.
 * @param [marker_col]
 * @param [chrom_col]
 * @param [pos_col]
 * @param [ref_col]
 * @param [alt_col]
 * @param [rsid_col]
 * @param pvalue_col
 * @param [beta_col]
 * @param [stderr_beta_col]
 * @param [allele_freq_col]
 * @param [allele_count_col]
 * @param [n_samples_col]
 * @param [is_alt_effect=true]
 * @param [is_neg_log_pvalue=false]
 * @param [delimiter='\t']
 * @return {function(*): {chromosome: *, position: number, ref_allele: *,
 *          log_pvalue: number, variant: string}}
 */
function makeParser(
    {
        // Required fields
        marker_col, // position
        chrom_col,
        pos_col,
        ref_col,
        alt_col,
        rsid_col,
        pvalue_col, // pvalue
        // Optional fields
        beta_col,
        stderr_beta_col,
        allele_freq_col, // Frequency: given directly, OR in terms of counts
        allele_count_col,
        n_samples_col,
        is_alt_effect = true, // whether effect allele is oriented towards alt
        is_neg_log_pvalue = false,
        delimiter = '\t',
    } = {},
) {
    // Column IDs should be 1-indexed (human friendly)
    if (has(marker_col) && has(chrom_col) && has(pos_col)) {
        throw new Error('Must specify either marker OR chr + pos');
    }
    if (!(has(marker_col) || (has(chrom_col) && has(pos_col)))) {
        throw new Error('Must specify how to locate marker');
    }

    if (has(allele_count_col) && has(allele_freq_col)) {
        throw new Error('Allele count and frequency options are mutually exclusive');
    }
    if (has(allele_count_col) && !has(n_samples_col)) {
        throw new Error('To calculate allele frequency from counts, you must also provide n_samples');
    }


    return (line) => {
        const fields = line.split(delimiter);
        let chr;
        let pos;
        let ref;
        let alt;
        let rsid = null;

        let freq;
        let beta = null;
        let stderr_beta = null;
        let alt_allele_freq = null;
        let allele_count;
        let n_samples;

        if (has(marker_col)) {
            [chr, pos, ref, alt] = parseMarker(fields[marker_col - 1], false);
        } else if (has(chrom_col) && has(pos_col)) {
            chr = fields[chrom_col - 1].replace(/^chr/g, '');
            pos = fields[pos_col - 1];
        } else {
            throw new Error('Must specify all fields required to identify the variant');
        }

        chr = chr.toUpperCase();
        if (chr.startsWith('RS')) {
            throw new Error(`Invalid chromosome specified: value "${chr}" is an rsID`);
        }

        if (has(ref_col)) {
            ref = fields[ref_col - 1];
        }

        if (has(alt_col)) {
            alt = fields[alt_col - 1];
        }

        if (has(rsid_col)) {
            rsid = fields[rsid_col - 1];
        }

        if (MISSING_VALUES.has(ref)) {
            ref = null;
        }
        if (MISSING_VALUES.has(alt)) {
            alt = null;
        }

        if (MISSING_VALUES.has(rsid)) {
            rsid = null;
        } else if (rsid) {
            rsid = rsid.toLowerCase();
            if (!rsid.startsWith('rs')) {
                rsid = `rs${rsid}`;
            }
        }

        const log_pval = parsePvalToLog(fields[pvalue_col - 1], is_neg_log_pvalue);
        ref = ref || null;
        alt = alt || null;

        if (has(allele_freq_col)) {
            freq = fields[allele_freq_col - 1];
        }
        if (has(allele_count_col)) {
            allele_count = fields[allele_count_col - 1];
            n_samples = fields[n_samples_col - 1];
        }

        if (has(beta_col)) {
            beta = fields[beta_col - 1];
            beta = MISSING_VALUES.has(beta) ? null : (+beta);
        }

        if (has(stderr_beta_col)) {
            stderr_beta = fields[stderr_beta_col - 1];
            stderr_beta = MISSING_VALUES.has(stderr_beta) ? null : (+stderr_beta);
        }

        if (allele_freq_col || allele_count_col) {
            alt_allele_freq = parseAlleleFrequency({
                freq,
                allele_count,
                n_samples,
                is_alt_effect,
            });
        }
        const ref_alt = (ref && alt) ? `_${ref}/${alt}` : '';
        return {
            chromosome: chr,
            position: +pos,
            ref_allele: ref ? ref.toUpperCase() : null,
            alt_allele: alt ? alt.toUpperCase() : null,
            variant: `${chr}:${pos}${ref_alt}`,
            rsid,
            log_pvalue: log_pval,
            beta,
            stderr_beta,
            alt_allele_freq,
        };
    };
}

// Preconfigured parser with defaults for a standard file format
const standard_gwas_parser = makeParser({
    chrom_col: 1,
    pos_col: 2,
    ref_col: 3,
    alt_col: 4,
    pvalue_col: 5,
    beta_col: 6,
    stderr_beta_col: 7,
    is_neg_log_pvalue: true,
    delimiter: '\t',
});

export { makeParser, standard_gwas_parser };