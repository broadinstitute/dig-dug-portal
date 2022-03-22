<template>
	<div id="app">
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<research-annotations-plot
							:region="'1:227615-267253'"
							:phenotype="'T2D'"
							:renderConfig="{
								'annotations server': 'KP BioIndex',
								'phenotype parameter': 'phenotype',
							}"
							:plotMargin="{
								leftMargin: 75,
								rightMargin: 20,
								topMargin: 10,
								bottomMargin: 50,
								bump: 5.5,
							}"
							:compareGroupColors="[
								'#007bff75',
								'#04884575',
								'#8490C875',
								'#BF61A575',
								'#EE312475',
								'#FCD70075',
								'#5555FF75',
								'#7aaa1c75',
								'#9F78AC75',
								'#F8808475',
								'#F5A4C775',
								'#CEE6C175',
								'#cccc0075',
								'#6FC7B675',
								'#D5A76875',
								'#d4d4d475',
							]"
							:dataComparison="null"
							:pkgData="$store.state.pkgData"
							:pkgDataSelected="$store.state.pkgDataSelected"
							:regionZoom="0"
							:regionViewArea="0"
						></research-annotations-plot>
						{{ $store.state.pkgData["overlappingRegions"] }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style>
@import url("/css/effectorGenes.css");
html {
	font-size: 14px !important;
}
</style>
