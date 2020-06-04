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

/*
 */
export const BASE_PANEL_OPTIONS = {
    // proportional_height: 1,
    height: 240,
    dashboard: {
        components: [
            {
                type: "resize_to_data",
                position: "right"
            },
            {
                type: "region_scale",
                position: "left"
            }
        ]
    }
}

/* panel options by panel type
 */
export const PANEL_OPTIONS = {
    'association': { min_height: 240, height: 240 },
    'genes': { min_height: 240, height: 240 },
};
