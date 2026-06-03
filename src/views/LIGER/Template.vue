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
            <div v-if="$parent.pageInfo"
                class="card mdkp-card dataset-page-header"
            >
				<div class="row card-body">
					<div class="col-md-12">
						<h2>{{ $parent.pageInfo[0].title[0].value }}</h2>
					</div>
				</div>
			</div>
            <div class="card mdkp-card" style="padding:50px">
                <LigerBrowser :config="null" />
            </div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
