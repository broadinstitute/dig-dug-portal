<template>
	<div>
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<h2>LZ Test</h2>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<kp-data-viewer-pkg
						v-if="this.$store.state.associationData != null"
						:pkgConfig="{
							viewers: ['kpGenesTrack', 'kpRegionViewer'],
							pkgID: 'testPkg',
							kpRegionViewer: {
								viewerConfig: {
									xAxisField: 'position',
									xAxisLabel: 'Chromosome 9',
									yAxisField: 'nLog10P',
									yAxisLabel: 'P-Value(-log10)',
									renderBy: 'ldVarID',
									plotsBy: 'phenotype',
									hoverContent: ['pValue'],
									height: 250,
									features: ['LD', 'recombination'],
									ldPopulation: { value: 'ldPopulation' },
									//ldPopulation: { ifStatic: true, value: 'ALL' }, //ifStatic->true: fixed value ifStatic not set value has to be a field name
								},
								region: {
									chr: 9,
									start: 21940000,
									end: 22190000,
								},
								data: this.$store.state.associationData,
							},
							plotLayout: {
								leftMargin: 74.5,
								rightMargin: 25.5,
								topMargin: 10.5,
								bottomMargin: 50.5,
							},
						}"
					></kp-data-viewer-pkg>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
