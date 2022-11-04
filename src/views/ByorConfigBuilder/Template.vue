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
                    Coming soon!
                    <data-pastebox></data-pastebox>
                </div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
