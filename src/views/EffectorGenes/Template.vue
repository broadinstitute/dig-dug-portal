<template>
	<div>
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<h2>Effector gene predictions</h2>
					</div>
				</div>
			</div>

			<div class="card mdkp-card">
				<div class="card-body">
					<div class="row">
						<div class="col-md-12" style="font-size: 20px">
							<documentation
								name="egl.summaries.info"
							></documentation>
						</div>
					</div>
					<!--<div class="row">
						<div class="col-md-12">
							<h2 v-if="!!$parent.pageInfo[0]">
								{{ $parent.pageInfo[0].title[0].value }}
							</h2>
							<static-page-info-section
								:pageInfo="$parent.pageInfo"
							></static-page-info-section>
						</div>
					</div>-->
				</div>
			</div>

			<div class="card mdkp-card">
				<div class="card-body">
					<div class="row">
						<div class="col-md-12">
							<h2>Contributing research methods</h2>
						</div>
					</div>
					<research-page-filters
						v-if="$parent.summaryData != null"
						:dataFiles="['egl_test.json']"
						:apiParameters="null"
						:dataComparisonConfig="null"
						:dataType="'json'"
						:isAPI="'false'"
						:uid="'1'"
						:filters="[
							{
								field: 'field_phenotype_groups',
								label: 'Select an effector gene prediction list',
								type: 'dropdown',
							},
						]"
						:filterWidth="null"
						:dataset="$parent.summaryData.data"
						:unfilteredDataset="$parent.summaryData.data"
						:utils="$parent.utilsBox"
					></research-page-filters>
					<div
						class="row"
						v-if="$store.state.filteredData != ''"
						v-for="item in $store.state.filteredData"
					>
						<div class="col-md-12" v-html="item.body"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
