<template>
	<div style="display:flex; flex-direction: column; min-height:100vh">
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body" style="flex:1">
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
                <LigerBrowser :config="$parent.liger_config" />
            </div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
