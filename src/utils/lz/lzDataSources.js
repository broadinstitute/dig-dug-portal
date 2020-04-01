import { HUMAN_GENOME_BUILD_VERSION, LZ_TYPE } from "@/utils/lz/lzUtils"

export default {
    defaultSource: {
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
            url:
                'https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/',
            params: {
                build: HUMAN_GENOME_BUILD_VERSION,
            }
        }],
        [LZ_TYPE.constraint]: ["GeneConstraintLZ",
            {
                url: 'http://exac.broadinstitute.org/api/constraint',
                params: {
                    build: HUMAN_GENOME_BUILD_VERSION,
                }
            }],
        [LZ_TYPE.intervals]: ["IntervalLZ",
            {
                url: 'https://portaldev.sph.umich.edu/api/v1/annotation/intervals/results/',
                params: {
                    source: 19,
                    build: HUMAN_GENOME_BUILD_VERSION,
                }
            }],
    }
}
