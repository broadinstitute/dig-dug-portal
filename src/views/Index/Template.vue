<template>
	<div class="front-page-body">
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
		></page-header>

		<!-- Body -->
		<div v-if="$parent.diseaseGroup">
			<div class="fluid">
				<div
					:class="
						'front-top-banner-' +
						$parent.diseaseGroup.name +
						'kp front-top-banner'
					"
				>
					<div class="container">
						<div class="row">
							<div class="col-md-12">
								<div class="a2f-front-logo-wrapper">
									<img
										class="a2f-front-logo-img"
										v-if="
											$parent.frontContents
												.field_front_logo
										"
										:src="
											'https://kp4cd.org/sites/default/files/vueportal/' +
											$parent.frontContents
												.field_front_logo
										"
									/>
									<br />
									<span class="a2f-front-tagline"
										>Transforming Data into Knowledge</span
									>
								</div>
							</div>
							{{ $parent.kpDiseasePair }}

							<div class="disease-systems-trees-wrapper">
								<div class="disease-systems-tree-header">
									Select a disease
								</div>

								<div class="disease-systems-tree">
									<template
										v-for="(
											system, systemIndex
										) in $parent.diseaseSystems"
									>
										<div
											class="disease-system"
											v-if="systemIndex < 6"
											:key="system"
											@mouseover="
												$parent.feedDiseaseOptions(
													system
												)
											"
											@mouseleave="
												$parent.emptyDiseaseOptions(
													system
												)
											"
										>
											<img
												:src="
													'https://kp4cd.org/sites/default/files/images/disease_systems/' +
													system
														.toLowerCase()
														.split(' ')[0] +
													'.svg'
												"
											/>
											<div>{{ system }}</div>
											<div
												class="disease-system-options"
												:id="system + '_options'"
											></div>
										</div>
									</template>
								</div>
								<div class="disease-systems-tree">
									<template
										v-for="(
											system, systemIndex
										) in $parent.diseaseSystems"
									>
										<div
											class="disease-system"
											v-if="systemIndex >= 6"
											:key="system"
											@mouseover="
												$parent.feedDiseaseOptions(
													system + '_options'
												)
											"
											@mouseleave="
												$parent.emptyDiseaseOptions(
													system + '_options'
												)
											"
										>
											<img
												:src="
													'https://kp4cd.org/sites/default/files/images/disease_systems/' +
													system
														.toLowerCase()
														.split(' ')[0] +
													'.svg'
												"
											/>
											<div>{{ system }}</div>
										</div>
									</template>
									<div class="disease-system">
										<img
											src="https://kp4cd.org/sites/default/files/images/disease_systems/search.svg"
										/>
										<span>Search</span>
									</div>
								</div>
							</div>
							<!--<h4 class="single-search-header">
								Search gene, variant, region or phenotype
							</h4>-->
							<div class="single-search-wrapper">
								<div class="single-search-header">Search</div>
								<research-single-search
									:singleSearchConfig="null"
									:phenotypes="$parent.phenotypes"
								></research-single-search>
								<div
									class="
										region-search-examples
										a2f-region-search-examples
									"
								>
									<documentation
										name="home.example"
										:group="cmd"
									></documentation>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="container static-content-section">
				<div class="row">
					<div
						class="col-md-8"
						v-if="!!$parent.kPortals"
						style="margin-left: -30px; margin-right: 30px"
					>
						<h2>Community Knowledge Portals</h2>
						<p></p>
						<div class="row">
							<div
								class="k-portal"
								v-for="portal in $parent.kPortals"
								:key="portal.title"
							>
								<div v-html="portal.body"></div>
								<div
									class="kp-title"
									v-html="portal.title"
								></div>
								<div>
									<a :href="portal.field_portal_address"
										>Visit portal</a
									>
								</div>
							</div>
						</div>
						<h2>
							What's new
							<span style="font-size: 16px"
								><a href="/news.html" target="_blank"
									>View news archive ></a
								></span
							>
						</h2>

						<news-feed-section
							:disease-group="$parent.diseaseGroup"
							:news-feed="$store.state.kp4cd.newsFeed"
						></news-feed-section>
					</div>
					<div class="col-md-4">
						<research-page-description
							v-if="$parent.pageDescription != null"
							:content="$parent.pageDescription"
						></research-page-description>
						<!--<h5>Phenotypes by groups</h5>
						<research-page-description
							v-if="
								$parent.datasetsDescription != null &&
								$parent.phenotypesDescription != null
							"
							:content="$parent.phenotypesDescription"
						></research-page-description>-->
						<about-project-section
							:front-contents="$parent.frontContents"
						></about-project-section>
					</div>
				</div>
				<!--<div class="row">
					<div class="col-md-7">
						<about-portal-section
							:front-contents="$parent.frontContents"
						></about-portal-section>
					</div>
					<div class="col-md-5">
						<news-feed-section
							:disease-group="$parent.diseaseGroup"
							:news-feed="$store.state.kp4cd.newsFeed"
						></news-feed-section>
					</div>
				</div>-->
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
<style>
.a2f-front-logo-wrapper {
	margin-left: auto;
	margin-right: auto;
	width: 900px;
	text-align: center;
}

.a2f-front-logo-img {
	width: 500px;
}
.a2f-front-tagline {
	font-size: 32px;
	font-weight: 100;
	color: #fff;
}

.disease-systems-trees-wrapper {
	position: relative;
	text-align: center;
	width: 100%;
	margin: 75px 0 75px 0;
}

.single-search-header,
.disease-systems-tree,
.disease-systems-tree-header {
	text-align: center;
	display: block;
	width: 100%;
	color: #fff;
	margin-top: 30px;
}

.disease-systems-tree {
	margin-top: 10px;
	position: relative;
}

.disease-systems-tree-header {
	position: absolute;
	transform: rotate(-90deg);
	border-radius: 15px;
	font-size: 12px;
	width: 280px;
	top: 35%;
	border: solid 1px #fff;
	left: 40px;
}

.single-search-wrapper {
	position: relative;
	text-align: center;
	width: 100%;
}

.single-search-header {
	position: absolute;
	transform: rotate(-90deg);
	border-radius: 15px;
	font-size: 12px;
	width: 120px;
	top: 0%;
	border: solid 1px #fff;
	left: 120px;
}

.a2f-region-search-examples {
	text-align: center;
	color: #fff;
	margin-top: 10px;
	width: 100%;
}

.k-portal {
	width: 20%;
	text-align: center;
	font-size: 14px;
	border: solid 1px #eeeeee;
	border-bottom: none;
	border-top: none;
	margin-bottom: 25px;
	margin-right: -1px;
	padding: 5px 10px;
}

.k-portal .kp-title {
	font-size: 16px;
	line-height: 1.25em;
	font-weight: 500;
}

.k-portal img {
	height: 110px;
}
.a2fkp-footer {
	margin-top: 50px;
}
.disease-system {
	width: 100px;
	text-align: center;
	font-size: 14px;
	display: inline-block;
	vertical-align: top;
	margin: 0 10px 0px 10px;
}

.disease-system.row-first:after {
	content: "\a";
	white-space: pre;
}

.disease-system img {
	width: 100px;
	height: 100px;
}

.byor-single-search-wrapper input {
	width: 680px !important;
}
</style>
