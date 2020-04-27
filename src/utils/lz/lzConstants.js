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
    proportional_height: 1,
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
};
