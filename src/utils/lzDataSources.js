
export default {
	defaultGeneSource: ["GeneLZ", {
		url:
			'https://portaldev.sph.umich.edu/api/v1/annotation/genes/',
		params: {
			build: 'GRCh37'
		}
	}],
	defaultLDSource: ["LDLZ2", {
		url: 'https://portaldev.sph.umich.edu/ld/',
		params: {
			source: '1000G',
			build: 'GRCh37',
			population: 'ALL'
		}
	}],
	defaultRecombSource: ["RecombLZ", {
		url:
			'https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/',
		params: {
			build: 'GRCh37'
		}
	}],
	defaultConstraintSource: ["GeneConstraintLZ",
		{
			url: 'http://exac.broadinstitute.org/api/constraint'
		}],
	defaultIntervalsSource: ["IntervalLZ",
		{
			url: 'https://portaldev.sph.umich.edu/api/v1/annotation/intervals/results/',
			params: {
				source: 19
			}
		}],
}