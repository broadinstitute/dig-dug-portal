/* Used by several of the default data sources.
 */
const HUMAN_GENOME_BUILD_VERSION = 'GRCh37';

/* The available data sources available to bind.
 */
export const LZ_TYPE = Object.freeze({
    assoc: 'assoc',
    gene: 'gene',
    recomb: 'recomb',
    ld: 'ld',
    constraint: 'constraint',
    intervals: 'intervals',
    phewas: 'phewas',
});

export default {
    [LZ_TYPE.gene]: ["GeneLZ", {
        url:
            'https://portaldev.sph.umich.edu/api/v1/annotation/genes/',
        params: {
            build: HUMAN_GENOME_BUILD_VERSION,
        }
    }],
    [LZ_TYPE.ld]: ["LDLZ2", {
        url: 'https://portaldev.sph.umich.edu/ld/',
        params: {
            source: '1000G',
            build: HUMAN_GENOME_BUILD_VERSION,
            population: 'ALL'
        }
    }],
    [LZ_TYPE.recomb]: ["RecombLZ", {
        url: 'https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/',
        params: {
            build: HUMAN_GENOME_BUILD_VERSION,
        }
    }],
    [LZ_TYPE.constraint]: ["GeneConstraintLZ",
        {
            url: 'http://gnomad.broadinstitute.org/api',
            params: {
                build: HUMAN_GENOME_BUILD_VERSION,
            }
        }],
    // [LZ_TYPE.intervals]: ["IntervalLZ",
    //     {
    //         url: 'https://portaldev.sph.umich.edu/api/v1/annotation/intervals/results/',
    //         params: {
    //             source: 19,
    //             build: HUMAN_GENOME_BUILD_VERSION,
    //         }
    //     }],
}
