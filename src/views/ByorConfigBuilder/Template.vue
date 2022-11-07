<template>
	<div>
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body">

			<div class="card mdkp-card">
				<div class="row card-body">
                    <h4 class="card-title">BYOR Configuration Builder</h4>
				</div>
			</div>


			<div class="card mdkp-card">
				<div class="card-body">
                    <data-pastebox @dataready="$parent.acceptSampleData"></data-pastebox>
                </div>
				<b-card no-body>
					<b-tabs card content-class="mt-3" id="table-filter-tabs">
						<b-tab title="Table">
							<add-fields :fields="$parent.rawHeaders"></add-fields>
						</b-tab>
						<b-tab title="Filters"></b-tab>
					</b-tabs>
				</b-card>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
<style>
@import url("/css/configBuilder.css");
</style>