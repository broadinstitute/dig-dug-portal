/* Used by several of the default data sources.
 */
export const HUMAN_GENOME_BUILD_VERSION = 'GRCh37';

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

/* Default panel options.
 */
export const DEFAULT_PANEL_OPTIONS = {
    'association': {
        proportional_height: 1,
        height: 200,
        min_height: 200,
    },
    'genes': {
        proportional_height: 1,
        height: 50,
        min_height: 50,
    },
};
