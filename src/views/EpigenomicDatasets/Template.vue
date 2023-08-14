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
						<h2 v-if="$parent.pageInfo[0]">
							{{ $parent.pageInfo[0].title[0].value }}
						</h2>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<div class="row">
						<div class="col-md-12">
							<static-page-info-section
								:pageInfo="$parent.pageInfo"
							></static-page-info-section>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
