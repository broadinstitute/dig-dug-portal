<template>
	<div id="app">
		<!-- KP Header -->
		<page-header
			v-if="$parent.displayOnKP == true"
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>

		<!--  Research page Header -->
		<research-page-header
			:class="
				$parent.displayOnKP == true
					? 'research-portal-header-compact'
					: 'research-portal-header'
			"
			:researchMenu="$parent.researchMenu"
			:headerLogo="
				$parent.displayOnKP == true || $parent.headerLogo == false
					? null
					: $parent.headerLogo
			"
		></research-page-header>

		<!-- Body -->
		<div
			class="container-fluid mdkp-body"
			v-if="$parent.researchMode == 'no_set'"
		>
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<h3>
							Sorry, this page is not published yet. Please come
							back later.
						</h3>
					</div>
				</div>
			</div>
		</div>

		<div
			class="container-fluid mdkp-body"
			v-if="$parent.researchMode == 'dev' && $parent.researchPage == null"
		>
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<div class="filtering-ui-wrapper">
							<div class="filtering-ui-content row">
								<div class="col">
									<div class="label">Reviewer ID</div>
									<div>
										<input
											type="text"
											class="form-control"
											v-model="$parent.devID"
										/>
									</div>
								</div>
								<div class="col">
									<div class="label">Reviewer P/W</div>
									<div>
										<input
											type="password"
											class="form-control"
											v-model="$parent.devPW"
										/>
									</div>
								</div>
								<div class="col">
									<div class="label">&nbsp;</div>
									<div>
										<button
											type="button"
											class="btn btn-primary"
											@click="$parent.fetchDevPage()"
										>
											Load page
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			class="container-fluid mdkp-body"
			v-if="$parent.researchPage != null"
		>
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-8">
						<h3 v-html="$parent.pageTitle"></h3>
						<div
							v-if="
								!!$parent.apiParameters &&
								!!$parent.apiParameters[
									'parameters in sub header'
								]
							"
							id="rpSubHeader"
							class="rp-sub-header"
						></div>
						
					</div>
					<div class="col-md-4 text-right" v-if="!!$parent.sectionConfigs && !!$parent.sectionConfigs['is multi section']">
						<button class="btn btn-sm btn-primary" @click="$parent.utilsBox.uiUtils.showHideElement('captured_data_panel')" title="Show / hide captured data list"><b-icon
													icon="images"
												></b-icon></button>
					</div>
				</div>
			</div>

			<div id="captured_data_panel" class="card mdkp-card hidden">
				<div class="row card-body">
					<div class="col-md-12">
						<h4>Captured data</h4>
						<table class="table table-sm research-data-table">
							<thead>
								<tr>
									<th>Section / Parameters</th><th>Save section data in CSV</th><th>Save section data in JSON</th><th>Remove section data</th>
								</tr>
							</thead>
							<tbody>
	<tr v-for="data  in $store.state.capturedData">
		
								<td v-html="data.title"></td>
								<td>
									<button class="btn btn-sm btn-primary save-remove-section-data" @click="$parent.saveCapturedData('csv', data.title)">Save CSV</button>
									</td>
									<td>
										<button class="btn btn-sm btn-primary save-remove-section-data" @click="$parent.saveCapturedData('json', data.title)">Save JSON</button>
										</td>
									<td>
									<button class="btn btn-sm btn-warning" @click="$store.dispatch('capturedData', {action:'remove',title:data.title})">Remove</button>
								</td>
							</tr>
							</tbody>
						</table>
						
						<div class="col-md-12 text-center">
							<button class="btn btn-primary" @click="$parent.utilsBox.uiUtils.saveJson($store.state.capturedData, $parent.pageTitle+' sections data')">Save all (JSON)</button>
						</div>
						
					</div>
				</div>
			</div>

			<div class="card mdkp-card" v-if="$parent.pageDescription != null">
				<div class="row card-body">
					<div class="col-md-12">
						<research-page-description
							:content="$parent.pageDescription"
							:utils="$parent.utilsBox"
						></research-page-description>
					</div>
				</div>
			</div>

			<!-- tabs nav -->
			<div
				class="kp-tabs-wrapper"
				v-if="$parent.researchMethodID != null"
			>
				<ul class="kp-tabs" id="rp_tabs">
					<li
						id="view_data"
						class="kp-tab active"
						@click="
							$parent.showTabContent(
								'view_data',
								'view_data_content',
								'rp_tabs',
								'rp_tabs_contents'
							)
						"
					>
						<a>View Data</a>
					</li>
					<li
						id="research_method"
						@click="
							$parent.showTabContent(
								'research_method',
								'research_method_content',
								'rp_tabs',
								'rp_tabs_contents'
							)
						"
						class="kp-tab"
					>
						<a>Research Method</a>
					</li>
				</ul>
			</div>
			<!-- tabs content -->

			<div class="kp-tabs-contents" id="rp_tabs_contents">
				<div class="kp-tab-content active" id="view_data_content">
					<div class="row">
						<template
							v-if="
								!!$store.state.bioPortal.phenotypes &&
								$store.state.bioPortal.phenotypes.length > 0 &&
								$parent.dataFilesLabels != null
							"
						>
							<div
								class="col-md-12"
								v-if="
									($parent.dataFilters != null &&
										$parent.researchData != null) ||
									$parent.dataFiles.length > 1 ||
									$parent.apiParameters != null
								"
							>
								<research-page-filters
									:dataFiles="$parent.dataFiles"
									:filesListLabels="$parent.dataFilesLabels"
									:apiParameters="$parent.apiParameters"
									:dataComparisonConfig="
										$parent.dataComparisonConfig
									"
									:dataType="$parent.dataType"
									:isAPI="$parent.isAPI"
									:uid="$parent.uid"
									:filters="$parent.dataFilters"
									:filterWidth="$parent.filterWidth"
									:dataset="$store.state.filteredData"
									:unfilteredDataset="
										$store.state.unfilteredData
									"
									:utils="$parent.utilsBox"
								></research-page-filters>
							</div>
						</template>
						<!-- plots -->
						<div
							class="col-md-12 zoom-ui-wrapper"
							v-if="
								!!$parent.plotConfig &&
								!!$parent.plotConfig.zoom &&
								$parent.plotConfig.zoom == 'true'
							"
						>
							<span>Zoom plots</span>

							<form class="zoom-radio-wrapper">
								<span
									class="zoom-radio-number"
									@click="
										$parent.regionZoom -=
											$parent.regionZoom != 0 ? 10 : 0
									"
									><b-icon icon="zoom-out"></b-icon
								></span>

								<input
									v-for="value in [
										0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
									]"
									type="radio"
									name="regionZoom"
									:value="value"
									@click="$parent.regionZoom = value"
									:class="
										$parent.regionZoom == value
											? 'zoom-radio checked'
											: 'zoom-radio'
									"
									:key="value"
								/>

								<span
									class="zoom-radio-number"
									@click="
										$parent.regionZoom +=
											$parent.regionZoom != 90 ? 10 : 0
									"
									><b-icon icon="zoom-in"></b-icon
								></span>
							</form>

							<span>Move viewing area</span>
							<form class="zoom-radio-wrapper">
								<span
									class="zoom-radio-number"
									@click="
										$parent.regionViewArea -=
											$parent.regionViewArea != -100 &&
											$parent.regionZoom != 0
												? 20
												: 0
									"
									><b-icon icon="arrow-left-circle"></b-icon
								></span>
								<input
									v-for="value in [
										-100, -80, -60, -40, -20, 0, 20, 40, 60,
										80, 100,
									]"
									type="radio"
									name="regionViewArea"
									:value="value"
									@click="
										$parent.regionZoom != 0
											? ($parent.regionViewArea = value)
											: ''
									"
									:class="
										$parent.regionViewArea == value
											? 'zoom-radio checked'
											: value == 0
											? 'zoom-radio center'
											: 'zoom-radio'
									"
									:key="value"
								/>
								<span
									class="zoom-radio-number"
									@click="
										$parent.regionViewArea +=
											$parent.regionViewArea != 100 &&
											$parent.regionZoom != 0
												? 20
												: 0
									"
									><b-icon icon="arrow-right-circle"></b-icon
								></span>
							</form>
						</div>
						<div
							:class="'col-md-12 ' + $parent.plotClass"
							v-if="$store.state.filteredData != ''"
						>
							<div
								class="plot-legend"
								v-html="$parent.plotLegend"
							></div>
							<!--v-if="$parent.plotType == 'm_plot'"-->
							<research-m-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] ==
										'manhattan plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
								:utils="$parent.utilsBox"
								sectionId=""
							></research-m-plot>
							<!--v-if="$parent.plotType == 'mbm_plot'"-->
							<research-m-bitmap-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] ==
										'manhattan bitmap plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:compareGroupColors="$parent.colors.moderate"
								:utils="$parent.utilsBox"
								sectionId=""
							></research-m-bitmap-plot>
							<!--v-if="$parent.plotType == 'mbm_plot'"-->
							<research-m-qq-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] ==
										'manhattan qq plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:compareGroupColors="$parent.colors.moderate"
								:utils="$parent.utilsBox"
								sectionId=""
							></research-m-qq-plot>
							<!--v-if="$parent.plotType == 'region_plot'"-->
							<research-region-plot
								v-if="
									!!$parent.plotConfig &&
									$parent.plotConfig['type'] == 'region plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
								:searchParameters="
									$store.state.searchParameters
								"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:region="$store.state.searchingRegion"
								:plotMargin="$parent.plotMargin"
								:compareGroupColors="$parent.colors.moderate"
								:regionZoom="$parent.regionZoom"
								:regionViewArea="$parent.regionViewArea"
								:pkgData="$store.state.pkgData"
								:pkgDataSelected="$store.state.pkgDataSelected"
								:utils="$parent.utilsBox"
								sectionId=""
							></research-region-plot>
							<!--v-if="$parent.plotType == 'score_plot'"-->
							<research-score-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'score plot'
								"
								:plotData="$parent.filteredData"
								:renderConfig="$parent.plotConfig"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:region="$store.state.searchingRegion"
								:searchParameters="
									$store.state.searchParameters
								"
								:utils="$parent.utilsBox"
								sectionId=""
							></research-score-plot>

							<research-genes-track
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] !=
										'gem package' &&
									!!$parent.plotConfig['genes track'] &&
									$store.state.codingGenesData != null
								"
								:region="$store.state.searchingRegion"
								:genesData="$store.state.codingGenesData"
								:plotConfig="$parent.plotConfig"
								:plotType="$parent.plotConfig['type']"
								:plotMargin="$parent.plotMargin"
								:regionZoom="$parent.regionZoom"
								:regionViewArea="$parent.regionViewArea"
								:utils="$parent.utilsBox"
								sectionId=""
							></research-genes-track>
							<!--v-if="$parent.plotType == 'volcano_plot'"-->
							<research-volcano-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'volcano plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
								:utils="$parent.utilsBox"
								sectionId=""
							></research-volcano-plot>
							<!--v-if="$parent.plotType == 'h_map'"-->
							<research-heatmap
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'heat map'
								"
								:heatmapData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
								:utils="$parent.utilsBox"
								sectionId=""
							></research-heatmap>
							<!--v-if="$parent.plotType == 'h_map'"-->
							<research-phewas-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'phewas plot'
								"
								:phenotypesData="$store.state.filteredData"
								:phenotypeMap="
									$store.state.bioPortal.phenotypeMap
								"
								:colors="$parent.colors.extraBold"
								:plotMargin="$parent.plotMargin"
								:renderConfig="$parent.plotConfig"
								:pkgData="null"
								:pkgDataSelected="null"
								:utils="$parent.utilsBox"
								canvasId=""
							></research-phewas-plot>
							<!--v-if="
									$parent.plotType == 'custom_pkg' &&
									$parent.customPlotType == 'gem package'
								"-->
							<kp-gem-pkg
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'gem package'
								"
								:pkgConfig="$parent.plotConfig"
								:pkgData="$store.state.pkgData"
								:pkgDataSelected="$store.state.pkgDataSelected"
								:sharedPlotXpos="$store.state.sharedPlotXpos"
								:plotMargin="$parent.plotMargin"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:colors="$parent.colors"
								:regionZoom="$parent.regionZoom"
								:regionViewArea="$parent.regionViewArea"
								:utils="$parent.utilsBox"
								
							></kp-gem-pkg>
						</div>
						<div
							class="col-md-12"
							v-if="
								$store.state.filteredData != '' &&
								$parent.dataTableFormat != null
							"
						>
							<research-data-table
								v-if="
									!$parent.dataTableFormat['custom table'] &&
									!!$store.state.bioPortal.phenotypeMap
								"
								:pageID="$parent.pageID"
								:dataset="$parent.filteredData"
								:tableFormat="$parent.dataTableFormat"
								:initPerPageNumber="$parent.tablePerPageNumber"
								:tableLegend="$parent.tableLegend"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:searchParameters="
									$store.state.searchParameters
								"
								:pkgData="$store.state.pkgData"
								:pkgDataSelected="$store.state.pkgDataSelected"
								:phenotypeMap="
									$store.state.bioPortal.phenotypeMap
								"
								:utils="$parent.utilsBox"
							>
							</research-data-table>
							<research-gem-data-table
								v-if="
									!!$parent.dataTableFormat['custom table'] &&
									$parent.dataTableFormat['custom table']
										.name == 'gem package'
								"
								:pageID="$parent.pageID"
								:dataset="$parent.filteredData"
								:tableFormat="$parent.dataTableFormat"
								:initPerPageNumber="$parent.tablePerPageNumber"
								:tableLegend="$parent.tableLegend"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:searchParameters="
									$store.state.searchParameters
								"
								:pkgData="$store.state.pkgData"
								:pkgDataSelected="$store.state.pkgDataSelected"
								:region="$store.state.searchingRegion"
								:regionZoom="$parent.regionZoom"
								:regionViewArea="$parent.regionViewArea"
								:utils="$parent.utilsBox"
							>
							</research-gem-data-table>
						</div>
						<!-- multi section test-->
						<div class="col-md-12" v-if="!!$parent.sectionConfigs && !!$parent.sectionConfigs['is multi section']">

							<research-multi-sections-search 
							v-if="!!$parent.multiSectionsSearchParameters"
								:searchParameters="$parent.multiSectionsSearchParameters"
								:phenotypesInUse="$parent.phenotypesInSession"
								:sections="$parent.sectionConfigs.sections"
								:utils="$parent.utilsBox"
								:searchVisible="!!$parent.sectionConfigs['search parameters']? true:false"
								>
							</research-multi-sections-search>
							<template v-if="!!$parent.sectionConfigs['tab groups']">
								<template v-for="group, groupIndex in $parent.sectionConfigs['tab groups']">
									<div class="tab-ui-wrapper" :id="'tabUiGroup'+ groupIndex">
										<div v-for="tab, tabIndex in group" :id="'tabUi'+tab.section" class="tab-ui-tab" :class="tabIndex == 0?'active':''"
											@click="$parent.utilsBox.uiUtils.setTabActive('tabUi' + tab.section, 'tabUiGroup' + groupIndex,
												'tabContent' + tab.section,'tabContentGroup' + groupIndex)">
											{{ tab.label }}
										</div>
									</div>
									<div :id="'tabContentGroup'+groupIndex">
										<template v-for="tab, tabIndex in group">
											<div v-for="config, index in $parent.sectionConfigs.sections" 
												v-if="config['section id'] == tab.section"
												:id="'tabContent' + tab.section"
												class="tab-content-wrapper"
												:class="(tabIndex == 0)?'':'hidden-content'"
												>
												<research-section
													:sectionIndex="'section-' + index"
													:uId="$parent.uid"
													:sectionConfig="config"
													:description="!!$parent.sectionDescriptions? 
														$parent.sectionDescriptions[config['section id']]:''"
													:phenotypeMap="$parent.phenotypeMap"
													:phenotypesInUse="$parent.phenotypesInSession"
													:colors="$parent.colors"
													:plotMargin="$parent.plotMargin"
													:plotLegend="$parent.multiPlotLegends"
													:tableLegend="$parent.multiTableLegends"
													:utils="$parent.utilsBox"
													:key="index"
													:starItems="$parent.starItems"
													@on-star="$parent.starColumn">
												</research-section>
										</div>
										</template>
									</div>
								</template>
								<template v-for="config, index in $parent.sectionConfigs.sections">
									<research-section
										v-if="$parent.isInTabGroups(config['section id']) == false"
										:sectionIndex="'section-' + index"
										:uId="$parent.uid"
										:sectionConfig="config"
										:description="!!$parent.sectionDescriptions ?
											$parent.sectionDescriptions[config['section id']] : ''"
										:phenotypeMap="$parent.phenotypeMap"
										:phenotypesInUse="$parent.phenotypesInSession"
										:colors="$parent.colors"
										:plotMargin="$parent.plotMargin"
										:plotLegend="$parent.plotLegend"
										:tableLegend="$parent.tableLegend"
										:utils="$parent.utilsBox"
										:key="index"
										:starItems="$parent.starItems"
										@on-star="$parent.starColumn"
										>
									</research-section>	
								</template>
							</template>
							<template v-else>
								<research-section
									v-for="config, index in $parent.sectionConfigs.sections"
									:sectionIndex="'section-' + index"
									:uId="$parent.uid"
									:sectionConfig="config"
									:description="!!$parent.sectionDescriptions ?
										$parent.sectionDescriptions[config['section id']] : ''"
									:phenotypeMap="$parent.phenotypeMap"
									:phenotypesInUse="$parent.phenotypesInSession"
									:colors="$parent.colors"
									:plotMargin="$parent.plotMargin"
									:plotLegend="$parent.plotLegend"
									:tableLegend="$parent.tableLegend"
									:utils="$parent.utilsBox"
									:key="index"
									:starItems="$parent.starItems"
									@on-star="$parent.starColumn">
								</research-section>	
							</template>
							
	            		</div>
					</div>
				</div>

				<div
					v-if="
						$parent.isLandingPage != true &&
						$parent.researchMethodID != null
					"
					class="kp-tab-content"
					id="research_method_content"
				>
					<div class="row">
						<div
							class="col-md-12"
							v-html="$parent.researchMethod"
						></div>
					</div>
				</div>
				<div
					class="data-loading-indicator"
					v-if="
						$parent.dataPoints != false &&
						$parent.dataType != 'direct_csv' &&
						$parent.dataType != 'direct_json'
					"
					v-html="
						$store.state.initialSearch == 1 && $parent.isAPI == true
							? 'Start search'
							: 'Loading data...'
					"
				></div>
			</div>
		</div>

		<div
			class="no-data-warning"
			id="noDataWarning"
			v-if="
				!!$parent.researchDataEmpty && $parent.researchDataEmpty == true
			"
		>
			No data is available for the last search. Please try a new search.
		</div>

		<div id="plotLegend" v-html="$parent.plotLegend" style="display:none;"></div>
		<div id="tableLegend" v-html="$parent.tableLegend" style="display:none;"></div>

		<!-- Research portal Footer-->
		<research-page-footer
			v-if="$parent.displayOnKP == null"
		></research-page-footer>

		<!-- KP Footer-->
		<page-footer
			v-if="$parent.displayOnKP == true"
			:disease-group="$parent.diseaseGroup"
		></page-footer>
	</div>
</template>

<style>
@import url("/css/effectorGenes.css");
@import url("/css/tooltipDocumentation.css");
html {
	font-size: 14px !important;
}
.card.hidden {
	display: none !important;
}
.no-data-warning {
	background-color: #ffaaaa;
	position: fixed;
	z-index: 10010;
	bottom: 30px;
	right: 30px;
	width: 300px;
	padding: 20px 20px;
	border: solid 1px #dd6666;
	border-radius: 5px;
	color: #ffffff;
}

.alert-pop-up {
	position: fixed;
	z-index: 200;
	width: 400px;
	top: 50%;
	left: calc(50% - 200px);
	background-color: #ffefef;
	padding: 15px 30px;
	border: solid 1px #ff8888;
	border-radius: 5px;
	font-size: 1.15em;
	box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}

.section-alert-pop-up {
	position: fixed;
	z-index: 200;
	width: 400px;
	right: 15px;
	background-color: #ffefef;
	padding: 15px 30px;
	border: solid 1px #ff8888;
	border-radius: 5px;
	font-size: 1.15em;
	box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}

.zoom-ui-wrapper {
	font-size: 13px;
	font-weight: 700;
	text-align: right;
	margin-bottom: 15px;
}
.zoom-radio-wrapper {
	width: auto;
	display: inline-block;
	font-size: 15px;
	font-weight: 300;
	border: solid 1px #ddd;
	padding: 3px 7px 0 7px;
	border-radius: 15px;
	margin: 0 10px 0 5px;
}
.zoom-radio {
	box-sizing: border-box;
	appearance: none;
	background: #eeeeee;
	outline: none;
	border: none;
	width: 8px;
	height: 15px;
	margin: 0 1px;
}
.zoom-radio.center {
	background: #bbbbbb;
}
.zoom-radio:hover {
	background: #666666;
	cursor: pointer;
}

.zoom-radio.checked {
	background: #05bd02;
}

.zoom-radio-number {
	display: inline-block;
	vertical-align: 2px;
	color: #000000;
	margin: 0 2px;
}

.zoom-radio-number:hover {
	color: #3388ff;
	cursor: pointer;
}

.direction-positive {
	color: #0066ff;
}
.direction-negative {
	color: #ff0000;
}

.rp-sub-header {
	position: relative;
	border-top: solid 1px #dddddd;
	font-size: 16px;
	margin-top: 15px;
}

.rp-sub-header-label {
	display: block;
	position: absolute;
	font-size: 10px;
	color: #eeeeee;
	top: -1px;
	background-color: #666666;
	padding: 0 5px;
	right: 0;
}

.rp-sub-header span.rp-sub-header-search-param-label,
.rp-sub-header span.rp-sub-header-search-param {
	display: inline-block;
}
.rp-sub-header span.rp-sub-header-search-param-label:first-letter {
	text-transform: uppercase;
}

.rp-sub-header span.rp-sub-header-search-param {
	font-size: 20px;
	margin-right: 20px;
}

.research-data-table td.multi-value-td > span {
	height: 27px !important;
}

.tab-ui-wrapper {
	border-bottom: solid 1px #ddd;
    margin: 25px 0;
    padding: 0 25px;
}

.tab-ui-wrapper .tab-ui-tab {
	padding: 10px 15px;
    border: solid 1px #ddd;
    display: inline-block;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    margin-right: 5px;
    background-color: #eee;
    margin-bottom: -1px;
	color: #0069d9;
}

.tab-ui-wrapper .tab-ui-tab:hover {
	cursor: pointer;
}

.tab-ui-wrapper .tab-ui-tab.active {
	border-bottom: solid 1px #fff;
	background-color: #fff;
}
</style>
