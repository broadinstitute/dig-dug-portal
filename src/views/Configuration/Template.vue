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
						<h2 v-html="$parent.pageTitle"></h2>
					</div>
				</div>
			</div>
			<div id="page_features_wrapper"></div>
		</div>
		<div id="collectionOfFeatures">
			<!--<div class="card mdkp-card">-->
			<div class="card-body" id="feature1">
				<div class="col-md-12">
					<h2>Feature 1 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature1'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature1']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature1'][
										'pHtml'
								  ]
								: 'Feature 1 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature2">
				<div class="col-md-12">
					<h2>Feature 2 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature2'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature2']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature2'][
										'pHtml'
								  ]
								: 'Feature 2 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature3">
				<div class="col-md-12">
					<h2>Feature 3 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature3'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature3']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature3'][
										'pHtml'
								  ]
								: 'Feature 3 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature4">
				<div class="col-md-12">
					<h2>Feature 4 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature4'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature4']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature4'][
										'pHtml'
								  ]
								: 'Feature 4 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature5">
				<div class="col-md-12">
					<h2>Feature 5 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature5'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature5']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature5'][
										'pHtml'
								  ]
								: 'Feature 5 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature6">
				<div class="col-md-12">
					<h2>Feature 6 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature6'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature6']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature6'][
										'pHtml'
								  ]
								: 'Feature 6 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature7">
				<div class="col-md-12">
					<h2>Feature 7 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature7'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature7']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature7'][
										'pHtml'
								  ]
								: 'Feature 7 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature8">
				<div class="col-md-12">
					<h2>Feature 8 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature8'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature8']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature8'][
										'pHtml'
								  ]
								: 'Feature 8 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature9">
				<div class="col-md-12">
					<h2>Feature 9 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature9'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature9']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature9'][
										'pHtml'
								  ]
								: 'Feature 9 content'
						"
					></p>
				</div>
			</div>
			<div class="card-body" id="feature10">
				<div class="col-md-12">
					<h2>Feature 10 title</h2>
					<p
						v-if="$parent.featureConfiguration != null"
						v-html="
							!!$parent.featureConfiguration
								.featureConfigOverride &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature10'] &&
							!!$parent.featureConfiguration
								.featureConfigOverride['feature10']['pHtml']
								? $parent.featureConfiguration
										.featureConfigOverride['feature10'][
										'pHtml'
								  ]
								: 'Feature 10 content'
						"
					></p>
				</div>
			</div>
			<!--</div>-->
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
