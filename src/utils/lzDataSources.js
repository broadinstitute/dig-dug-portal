import LocusZoom from "locuszoom";

export default {
	defaultSource: {
	    gene: ["GeneLZ", {
            url:
                'https://portaldev.sph.umich.edu/api/v1/annotation/genes/',
            params: {
                build: 'GRCh37'
            }
        }],
        ld: ["LDLZ2", {
            url: 'https://portaldev.sph.umich.edu/ld/',
            params: {
                source: '1000G',
                build: 'GRCh37',
                population: 'ALL'
            }
        }],
        recomb: ["RecombLZ", {
            url:
                'https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/',
            params: {
                build: 'GRCh37'
            }
        }],
        constraint: ["GeneConstraintLZ",
            {
                url: 'https://gnomad.broadinstitute.org/api/constraint',
                params: {
                    build: 'GRCh37'
                }
            }],
        intervals: ["IntervalLZ",
            {
                url: 'https://portaldev.sph.umich.edu/api/v1/annotation/intervals/results/',
                params: {
                    source: 19,
                    build: 'GRCh37',
                }
            }],
    }
}
