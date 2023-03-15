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
						<h2>
							{{ $parent.diseaseGroup.description }} KP Help
							Resources
						</h2>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<div class="row">
						<div class="col-md-12">
							<resources-section
								:resources="$parent.resources"
								:nid="$parent.nid"
							></resources-section>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
