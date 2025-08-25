<template>
	<!--<div class="multi-section" :class="'wrapper-' + sectionIndex"
		:style="!!sectionData || sectionConfig['section type'] == 'primary' ? '' : 'display:none;'">-->

	<div
		:class="(!!sectionConfig.display && sectionConfig.display == 'false') ? 'multi-section-card hidden' : 'multi-section-card'" :id="'section_wrapper_' + sectionID">
		<div v-if="dataPoint.type == 'component'">
			<research-section-components :component="dataPoint.name" :phenotypesInUse="phenotypesInUse" :utilsBox="utils"
				:sectionConfigs="sectionConfig">
			</research-section-components>
		</div>
		<div class="multi-section" :class="'wrapper-' + sectionIndex" v-if="(!!sectionConfig['required parameters to display'] && !!meetRequirements())
			|| !sectionConfig['required parameters to display']">

			<div class="row section-header" v-if="!isInTab">
				<div class="col-md-12">
					<button v-if="!!sectionData && sectionData.length > 0" class="btn btn-sm show-evidence-btn capture-data"
						@click="captureData()" title="Capture data in section"><b-icon icon="camera"></b-icon></button>
					<button class="btn btn-sm show-evidence-btn show-hide-section"
						:class="(sectionHidden != true) ? '' : 'red-background'"
						@click="utils.uiUtils.showHideSvg('section_' + sectionID); sectionHidden = (sectionHidden == true) ? false : true"
						title="Show / hide section"><b-icon icon="eye"></b-icon></button>
					<h4>
						<span v-html="utils.Formatters.replaceWithParams(sectionConfig.header, pageParams)"></span>
						
						<research-loading-spinner :isLoading="(loadingDataFlag == 'down') ? '' : 'whatever'"
							colorStyle="color"></research-loading-spinner>
						<div v-if="!!noLoadedData" class="no-data-flag">{{ noLoadedData }}</div>
					</h4>
				</div>
			</div>

			<div class="row section-header" v-if="!!isInTab">
				<div class="col-md-12">
					<button v-if="!!sectionData && sectionData.length > 0" class="btn btn-sm show-evidence-btn capture-data"
						@click="captureData()" title="Capture data in section"><b-icon icon="camera"></b-icon></button>
					<h4>
						<span v-html="utils.Formatters.replaceWithParams(sectionConfig.header, pageParams)"></span>

						<research-loading-spinner :isLoading="(loadingDataFlag == 'down') ? '' : 'whatever'"
							colorStyle="color"></research-loading-spinner>
						<div v-if="!!noLoadedData" class="no-data-flag">{{ noLoadedData }}</div>
					</h4>
				</div>
			</div>

			<div class="row" :id="'section_' + sectionID">

				<div class="col-md-12" v-if="!!groups">
					<span v-for="key in groups" @click="removeData(key)" class="btn section-search-bbl show-evidence-btn"
						v-html="utils.Formatters.getShortName(key.label) + ' x'"></span>
				</div>

				<div class=""
					v-if="!openInfoCard && !!sectionConfig['filters vertical'] && sectionConfig['filters vertical']['side'] == 'left'"
					:style="'width: ' + sectionConfig['filters vertical']['width'] + 'px; margin-right: 15px'">
					<research-section-filters-vertical v-if="!!filters" :filters="filters"
						:filterWidth="sectionConfig['filter width']" :dataset="sectionData"
						:unfilteredDataset="originalData" :sectionId="sectionID" :utils="utils" :dataComparisonConfig="null"
						@on-filtering="updateData" @clicked-sort="sortData"></research-section-filters-vertical>
				</div>

				<div :class="(!sectionConfig['filters vertical']) ? 'col-md-12 wrapper-' + sectionIndex : 'wrapper-' + sectionIndex"
					:style="(!!sectionConfig['filters vertical']) ? (!openInfoCard) ? 'width: calc(100% - ' + (sectionConfig['filters vertical']['width'] + 15) + 'px);' : '' : ''">

					<research-in-section-search v-if="!!sectionConfig['search parameters']"
						:class="!!sectionConfig['search parameters'].display && sectionConfig['search parameters'].display == 'false' ? 'hidden-search' : ''"
						:searchParameters="sectionConfig['search parameters']" :phenotypesInUse="phenotypesInUse"
						:section="sectionConfig" :utils="utils">
					</research-in-section-search>

					<research-page-description v-if="!!sectionDescription" :content="utils.Formatters.replaceWithParams(sectionDescription, pageParams)"
						:utils="utils"></research-page-description>

					<research-section-filters v-if="!!filters && !sectionConfig['filters vertical']" :filters="filters"
						:filterWidth="sectionConfig['filter width']" :dataset="sectionData"
						:unfilteredDataset="originalData" :sectionId="sectionID" :utils="utils" :dataComparisonConfig="null"
						@on-filtering="updateData" @clicked-sort="sortData"></research-section-filters>

					<span :id="sectionID+'_plots_holder'">
						<span :id="sectionID+'_viz_wrapper'">
							<div class="zoom-ui-wrapper"
								v-if="!!tableFormat && !!tableFormat['data zoom'] && !!sectionData && sectionData.length > 0">
								<span>Zoom</span>

								<form class="zoom-radio-wrapper">
									<span class="zoom-radio-number" @click="setZoom('regionZoom',
										regionZoom -=
										regionZoom != 0 ? 10 : 0)
										"><b-icon icon="zoom-out"></b-icon></span>

									<input v-for="value in [
										0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
									]" type="radio" name="regionZoom" :value="value" @click="setZoom('regionZoom', value)" :class="regionZoom == value
			? 'zoom-radio checked'
			: 'zoom-radio'
			" :key="value" />

									<span class="zoom-radio-number" @click="setZoom('regionZoom',
										regionZoom +=
										regionZoom != 90 ? 10 : 0)
										"><b-icon icon="zoom-in"></b-icon></span>
								</form>

								<span>Move viewing area</span>
								<form class="zoom-radio-wrapper">
									<span class="zoom-radio-number" @click="setZoom('regionViewArea',
										regionViewArea -=
										regionViewArea != -100 &&
											regionZoom != 0
											? 20
											: 0)
										"><b-icon icon="arrow-left-circle"></b-icon></span>
									<input v-for="value in [
										-100, -80, -60, -40, -20, 0, 20, 40, 60,
										80, 100,
									]" type="radio" name="regionViewArea" :value="value" @click="setZoom('regionViewArea',
									regionZoom != 0
										? value
										: '')
									" :class="regionViewArea == value
										? 'zoom-radio checked'
										: value == 0
											? 'zoom-radio center'
											: 'zoom-radio'
										" :key="value" />
									<span class="zoom-radio-number" @click="setZoom('regionViewArea',
										regionViewArea +=
										regionViewArea != 100 &&
											regionZoom != 0
											? 20
											: 0)
										"><b-icon icon="arrow-right-circle"></b-icon></span>
								</form>
							</div>
							<!-- viz tabs-->
							<div class="viz-wrapper">
							<template v-if="!!multiVisualizers && !!sectionData && multiVisualizersType == 'tabs'">
								<div class="sub-tab-ui-wrapper" :id="'tabUiGroup' + sectionID">
									<div v-for="tab, tabIndex in multiVisualizers" :id="'tabUi' + sectionID + tabIndex"
										class="tab-ui-tab" :class="tabIndex == 0 ? 'active' : ''" @click="utils.uiUtils.setTabActive('tabUi' + sectionID + tabIndex,
											'tabUiGroup' + sectionID,
											'tabContent' + sectionID + tabIndex, 'tabContentGroup' + sectionID, true)">
										{{ utils.Formatters.replaceWithParams(tab.label, pageParams) }}
									</div>
								</div>
							</template>

							<!-- viz tab groups -->
							<template v-if="!!vizGroups && !!sectionData && multiVisualizersType == 'grouped tabs'">
								<div class="sub-tab-ui-wrapper" :id="'tabUiGroup' + sectionID">
									<div v-for="tab, tabIndex in vizGroups" :id="'tabUi' + sectionID + tabIndex"
										class="tab-ui-tab" :class="tabIndex == 0 ? 'active' : ''" @click="utils.uiUtils.setTabActive('tabUi' + sectionID + tabIndex,
											'tabUiGroup' + sectionID,
											'tabContent' + sectionID + tabIndex, 'tabContentGroup' + sectionID, true)">
										{{ utils.Formatters.replaceWithParams(tab.label, pageParams) }}
									</div>
								</div>
							</template>

							<!-- viz in grouped tabs -->
							<div v-if="!!vizGroups && !!sectionData && multiVisualizersType == 'grouped tabs'"
								:id="multiVisualizersType == 'grouped tabs' ? 'tabContentGroup' + sectionID : ''">

								<div v-for="group, groupIndex in vizGroups"
										:id="'tabContent' + sectionID + groupIndex"
										class="plot-tab-content-wrapper"
										:class="(groupIndex == 0) ? '' : 'hidden-content'">
									<!-- visualizers in group -->

									<div v-for="plotConfig, plotIndex in group.visualizers"
										class="plot-content-wrapper">
										<h6 v-html="utils.Formatters.replaceWithParams(plotConfig.label, pageParams)"></h6>
										<research-section-visualizers 
											:plotConfig="plotConfig"
											:plotData="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
											:phenotypeMap="phenotypeMap" :colors="colors" :plotMargin="plotMargin"
											:plotLegend="getSectionPlotLegend(sectionID + groupIndex + '_' + plotIndex)" :sectionId="sectionID + groupIndex  + '_' + plotIndex"
											:utils="utils" :dataComparisonConfig="dataComparisonConfig"
											:searchParameters="groupSearchParameters" :regionZoom="regionZoom"
											:regionViewArea="regionViewArea" :region="regionParam" 
											:bigRegion="bigRegionParam"
											:starItems="starItems"
											@on-star="starColumn">
										</research-section-visualizers>
									</div>
								</div>
							</div>


							<!-- viz as individual tabs-->
							<div v-if="!!multiVisualizers && !!sectionData && (multiVisualizersType == 'tabs' || multiVisualizersType == 'divs')"
								:id="multiVisualizersType == 'tabs' ? 'tabContentGroup' + sectionID : ''">

								<div v-for="plotConfig, plotIndex in multiVisualizers"
									:id="multiVisualizersType == 'tabs' ? 'tabContent' + sectionID + plotIndex : ''"
									class="plot-tab-content-wrapper"
									:class="(multiVisualizersType == 'tabs') ? (plotIndex == 0) ? '' : 'hidden-content' : ''">
									<h6 v-html="utils.Formatters.replaceWithParams(plotConfig.label, pageParams)" v-if="multiVisualizersType != 'tabs'"></h6>
									<research-section-visualizers :plotConfig="plotConfig"
										:plotData="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
										:phenotypeMap="phenotypeMap" :colors="colors" :plotMargin="plotMargin"
										:plotLegend="getSectionPlotLegend(sectionID + plotIndex)" :sectionId="sectionID + plotIndex"
										:utils="utils" :dataComparisonConfig="dataComparisonConfig"
										:searchParameters="groupSearchParameters" :regionZoom="regionZoom"
										:regionViewArea="regionViewArea" :region="regionParam" 
										:bigRegion="bigRegionParam" :starItems="starItems"
										@on-star="starColumn">
									</research-section-visualizers>
								</div>
							</div>
							<research-section-visualizers v-if="!multiVisualizers && !!visualizer && !!sectionData"
								:plotConfig="visualizer"
								:plotData="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
								:phenotypeMap="phenotypeMap" :colors="colors" :plotMargin="plotMargin"
								:plotLegend="getSectionPlotLegend(sectionID)" :sectionId="sectionID" :utils="utils"
								:dataComparisonConfig="dataComparisonConfig" :searchParameters="groupSearchParameters"
								:regionZoom="regionZoom" :regionViewArea="regionViewArea" :region="regionParam"
								:bigRegion="bigRegionParam"
								:starItems="starItems"
								@on-star="starColumn">
							</research-section-visualizers>

							</div>
						</span>
					</span>
					
					<template v-if="!!tableFormat && !tableFormat['display type']">
						<research-data-table 
							v-if="!!tableFormat && !tableFormat['rows as info cards'] && tableFormat['display'] != false" 
							:pageID="sectionIndex"
							:dataset="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
							:tableFormat="tableFormat"
							:initPerPageNumber="(!!tableFormat['rows per page']) ? tableFormat['rows per page'] : 10"
							:tableLegend="getSectionTableLegend(sectionID)" :dataComparisonConfig="dataComparisonConfig"
							:searchParameters="groupSearchParameters" :pkgData="null" :pkgDataSelected="null"
							:phenotypeMap="phenotypeMap" :sectionId="sectionID" :multiSectionPage="true" :starItems="starItems"
							:utils="utils" @clicked-sort="sortData" :region="regionParam" :regionZoom="regionZoom"
							:regionViewArea="regionViewArea" 
							:colors="colors" :plotMargin="plotMargin"
							@on-star="starColumn" @on-filtering="updateData">
							
						</research-data-table>
						
						<research-info-cards v-if="!!tableFormat && !!tableFormat['rows as info cards']" :pageID="sectionIndex"
							:dataset="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
							:tableFormat="tableFormat"
							:initPerPageNumber="(!!tableFormat['rows per page']) ? tableFormat['rows per page'] : 10"
							:tableLegend="getSectionTableLegend(sectionID)" :dataComparisonConfig="dataComparisonConfig"
							:searchParameters="groupSearchParameters" :pkgData="null" :pkgDataSelected="null"
							:phenotypeMap="phenotypeMap" :sectionId="sectionID" :multiSectionPage="true" :starItems="starItems"
							:utils="utils" :thumbnailWidth="!!sectionConfig['filters vertical'] && !!sectionConfig['filters vertical']['width'] ?
								sectionConfig['filters vertical']['width'] : 250" @clicked-sort="sortData" :region="regionParam"
							:regionZoom="regionZoom" :regionViewArea="regionViewArea" :openCardPreset="openInfoCard"
							@on-star="starColumn" @on-filtering="updateData" @on-openCard="setOpenInfoCard">
						</research-info-cards>
					</template>

					<template v-if="!!tableFormat && !!tableFormat['display type']">
						<template v-if="tableFormat['display type'] == 'tabs'">
							<div class="sub-tab-ui-wrapper" :id="'tableTabs' + sectionID">
								<div v-for="tab, tabIndex in tableFormat['tabs']" :id="'tabUi' + sectionID + tab['id']"
									class="tab-ui-tab" :class="tabIndex == 0 ? 'active' : ''" @click="utils.uiUtils.setTabActive('tabUi' + sectionID + tab['id'],
										'tableTabs' + sectionID,
										'tableContent' + sectionID + tab['id'], 'tableContentGroup' + sectionID, false)"
									v-html="utils.Formatters.replaceWithParams(tab['header'], pageParams)"
									>
								</div>
							</div>

							<div :id="'tableContentGroup' + sectionID">
								<div v-for="tab, tabIndex in tableFormat['tabs']" :id="'tableContent' + sectionID + tab['id']"
									class="tab-content-wrapper"
									:class="(tabIndex == 0) ? '' : 'hidden-content'">
									<research-data-table
										v-if="!!sectionData"
										:pageID="sectionIndex"
										:dataset="buildTabData(sectionData,tab)"
										:tableFormat="buildTabFormat(tableFormat,tab)"
										:initPerPageNumber="(!!tableFormat['rows per page']) ? tableFormat['rows per page'] : 10"
										:tableLegend="getSectionTableLegend(sectionID)" :dataComparisonConfig="dataComparisonConfig"
										:searchParameters="groupSearchParameters" :pkgData="null" :pkgDataSelected="null"
										:phenotypeMap="phenotypeMap" :sectionId="sectionID" :multiSectionPage="true" :starItems="starItems"
										:utils="utils" @clicked-sort="sortData" :region="regionParam" :regionZoom="regionZoom"
										:regionViewArea="regionViewArea" 
										:colors="colors" :plotMargin="plotMargin"
										@on-star="starColumn" @on-filtering="updateData">
									</research-data-table>
								</div>
							</div>
						</template>
					</template>

					<div v-if="!!sectionConfig['ai summary'] && !!sectionData">
						<llm-summary 
							:dataset="(!groups || (!!groups && groups.length <= 1) || !dataComparisonConfig) ? sectionData : mergedData"
							:summaryConfig="sectionConfig['ai summary']"
							:sectionID="sectionID"
							:sectionConfig="sectionConfig"
							:utils="utils">

						</llm-summary>
					</div>
				</div>
				<div class="vertical-filter"
					v-if="!openInfoCard && !!sectionConfig['filters vertical'] && sectionConfig['filters vertical']['side'] == 'right'"
					:style="'width: ' + sectionConfig['filters vertical']['width'] + 'px;margin-left: 15px;'">
					<research-section-filters-vertical v-if="!!filters" :filters="filters"
						:filterWidth="sectionConfig['filter width']" :dataset="sectionData"
						:unfilteredDataset="originalData" :sectionId="sectionID" :utils="utils" :dataComparisonConfig="null"
						@on-filtering="updateData" @clicked-sort="sortData"></research-section-filters-vertical>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import ResearchInSectionSearch from "@/components/researchPortal/ResearchInSectionSearch.vue";
import ResearchSectionFilters from "@/components/researchPortal/ResearchSectionFilters.vue";
import ResearchSectionFiltersVertical from "@/components/researchPortal/ResearchSectionFiltersVertical.vue";
import ResearchSectionVisualizers from "@/components/researchPortal/ResearchSectionVisualizers.vue";
import ResearchSectionComponents from "@/components/researchPortal/ResearchSectionComponents.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";
import ResearchInfoCards from "@/components/researchPortal/ResearchInfoCards.vue";
import llmSummary from "@/components/researchPortal/contextualSearch/LlmQuery.vue";

export default Vue.component("research-section", {
	props: ["uId", "sectionConfig", "phenotypeMap", "description", "phenotypesInUse",
		"sectionIndex", "plotMargin", "plotLegend", "tableLegend", "colors", "utils", "starItems", "regionZoom",
		"regionViewArea", "isInTab", "pageParams","searchParameters"],
	components: {
		ResearchSectionFilters,
		ResearchSectionFiltersVertical,
		ResearchSectionVisualizers,
		ResearchSectionComponents,
		ResearchDataTable,
		ResearchInfoCards,
		ResearchInSectionSearch,
		llmSummary
	},
	data() {
		return {
			sectionData: null,
			noLoadedData: null,
			mergedData: null,
			originalData: null,
			tableFormat: null,
			remoteTableFormat: null,
			remoteFilters: null,
			remoteVisualizer: null,
			remoteSectionDecription: null,
			groups: null,
			searched: [],
			loadingDataFlag: "down",
			regionParam: null,
			bigRegionParam: null,
			sectionHidden: false,
			openInfoCard: null,
			customList: {},
			filterValues: null,
			filtersIndex: null,
		};
	},
	modules: {
	},
	created() {
		this.$root.$refs[this.sectionConfig["section id"]] = this;

		if (!!this.sectionConfig["table format"] &&
			(!this.sectionConfig["table format"]["type"] || this.sectionConfig["table format"]["type"] != "remote")) {
			this.tableFormat = this.sectionConfig["table format"];

			/* for info cards option, open card value */
			let infoCardConfig = !!this.tableFormat['rows as info cards'] ? this.tableFormat['rows as info cards'] : null;
			if (!!infoCardConfig && !!infoCardConfig['key'] && !!this.utils.keyParams[infoCardConfig['key']]) {
				this.openInfoCard = this.utils.keyParams[infoCardConfig['key']];
			}
		}
		if (!!this.sectionConfig["data point"] && !!this.sectionConfig["data point"]["parameters point"]) {
			let listPoint = this.sectionConfig["data point"]["parameters point"];
			this.getList(
				listPoint["parameter"],
				listPoint["url"],
				listPoint["data type"],
				listPoint["data wrapper"]
			)
		}
	},
	mounted() {
		if (!!this.sectionConfig["data point"] && !this.sectionConfig["data point"]["parameters point"]) {
			this.getData();
		}

		this.getFilterValues()

	},
	computed: {
		sectionID() {
			return this.sectionConfig["section id"];
		},
		dataPoint() {
			return this.sectionConfig["data point"];
		},
		dataComparisonConfig() {
			let groupsLength = (!!this.groups) ? this.groups.length : 0;
			if (!!this.tableFormat && !!this.tableFormat["group by"] && !!this.tableFormat["compare data"] && groupsLength > 1) {
				let config = {
					"key field": this.tableFormat["compare data"]["key field"],
					"fields group data key": this.tableFormat["group by"],
					"fields to compare": this.tableFormat["compare data"]["fields to compare"]
				}

				return config;
			} else {
				return null
			}
		},

		groupSearchParameters() {
			if (!!this.dataComparisonConfig) {
				let comConfig = this.dataComparisonConfig;

				let params = {};
				let tempObj = {};
				tempObj['search'] = [...new Set(this.groups.map(g => g.label))];

				params[comConfig["fields group data key"]] = tempObj;

				return params;

			} else {
				return null
			}
		},
		sectionDescription() {
			//if (!!this.sectionData) {
			if (!!this.description) {
				return this.description;
			} else if (!!this.remoteSectionDecription) {
				return this.remoteSectionDecription;
			} else {
				return null;
			}
			//} else {
			//return null
			//}
		},
		filters() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["filters"] &&
					(!this.sectionConfig["filters"]["type"] || this.sectionConfig["filters"]["type"] != "remote")) {
					return this.sectionConfig["filters"];
				} else if (!!this.remoteFilters) {
					return this.remoteFilters;
				} else {
					return null;
				}
			} else {
				return null
			}
		},
		visualizer() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["visualizer"] &&
					(!this.sectionConfig["visualizer"]["type"] || this.sectionConfig["visualizer"]["type"] != "remote")) {
					return this.sectionConfig["visualizer"];
				} else if (!!this.remoteVisualizer) {
					return this.remoteVisualizer;
				} else {
					return null;
				}
			} else {
				return null
			}
		},
		multiVisualizers() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["visualizers"] && this.sectionConfig["visualizers"]["wrapper type"] != "grouped tabs") {
					return this.sectionConfig["visualizers"]["visualizers"];
				} else {
					return null;
				}
			} else {
				return null
			}
		},
		vizGroups() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["visualizers"] && this.sectionConfig["visualizers"]["wrapper type"] == "grouped tabs") {
					return this.sectionConfig["visualizers"]["groups"];
				} else {
					return null;
				}
			} else {
				return null
			}
		},
		multiVisualizersType() {
			if (!!this.sectionData) {
				if (!!this.sectionConfig["visualizers"]) {
					return this.sectionConfig["visualizers"]["wrapper type"];
				} else {
					return null;
				}
			} else {
				return null
			}
		},
		viewingRegion() {
			if (this.regionParam == null) {
				return null;
			} else {
				let returnObj = {};

				returnObj["chr"] = parseInt(this.regionParam.split(":")[0], 10);

				let regionArr = this.regionParam.split(":")[1].split("-");
				let chr = this.regionParam.split(":")[0];
				let start = parseInt(regionArr[0], 10);
				let end = parseInt(regionArr[1], 10);
				let distance = end - start;
				if (this.regionZoom > 0) {
					let zoomNum = Math.round(
						distance * (this.regionZoom / 200)
					);
					let viewPointShift = Math.round(
						zoomNum * (this.regionViewArea / 100)
					);
					returnObj["chr"] = chr;
					returnObj["start"] = start + zoomNum + viewPointShift;
					returnObj["end"] = end - zoomNum + viewPointShift;
				} else if (this.regionZoom == 0) {
					returnObj["chr"] = chr;
					returnObj["start"] = start;
					returnObj["end"] = end;
				}

				return returnObj;
			}
		},
	},
	watch: {
		sectionData(DATA) {
			if (!this.tableFormat && !this.remoteTableFormat) {
				let topRows = Object.keys(this.sectionData[0]);
				this.tableFormat = { "top rows": topRows };
			}
			if (!!this.dataComparisonConfig) {
				this.mergedData = this.getMergedData();
			}

			if (this.loadingDataFlag == "down") {
				this.$emit('on-sectionData', { id: this.sectionID, config: this.sectionConfig, data: DATA });
			}
			this.getRegion();
			this.getBigRegion();
			this.getFilterValues();
		},
		originalData(DATA) {
			if (this.loadingDataFlag == "down") {

			}
		},
	},
	methods: {
		getFilterValues() {
			/*
			{
          "field": "Tissue",
          "label": "Tissue",
          "type": "checkbox",
          "features": [
            "autocomplete"
          ],
          "label in bubble": "true"
        }
		  */
			//filter_c2ct_phenotype_annotationppo
			if(!!this.sectionConfig.filters) {

				

			let filters = [];

				this.sectionConfig.filters.map( f => {
					
					const fItem = f.type == 'checkbox'? '.filter-' + this.sectionID + f.field.replace(/\W/g, "").toLowerCase():'#filter_' + this.sectionID + f.field.replace(/\W/g, "").toLowerCase();
					const fItems = document.querySelectorAll(fItem);
					
					if(f.type == 'checkbox') {
						fItems.forEach(node => {
							if(node.checked) {
								filters.push(node.value)
							}
						})
					} else {
						
						fItems.forEach(node => {
							if(!!!!this.filtersIndex && !!this.filtersIndex[f.field] && this.filtersIndex[f.field].search.length > 0) {
								filters.push(node.id+":"+this.filtersIndex[f.field].search[0] );
							}
						})
					}
				})

				this.filterValues = filters;
					
			} else {
				this.filterValues = null;
			}
		},
		buildTabData(DATA,TAB) {

			let tabData = [];

			switch (TAB["group type"]) {
				case "search":

				tabData = DATA.filter(d => d[TAB["group by"]] == TAB["group value"])
					break;

				case "search other than":

				tabData = DATA.filter(d => d[TAB["group by"]] != TAB["group value"])
					break;	

			}

			return tabData;
		},
		buildTabFormat(TABLE,TAB) {

			let tabFormat ={};

			tabFormat["top rows"] = TAB["top rows"];

			if(TABLE["column formatting"]) {
				tabFormat["column formatting"] = TABLE["column formatting"];
			}

			if(TAB["features"]) {
				tabFormat["features"] = TABLE["features"];

				TABLE["features"].map(feature => {
					tabFormat[feature] = TAB[feature]
				})
			}
			
			return tabFormat;
		},
		meetRequirements() {
			let required = this.sectionConfig['required parameters to display'];
			let meetRequired = true;

			/*required.map(r=>{
				if(!this.utils.keyParams[r]){
					meetRequired = null
				}
			})*/

			required.map(R => {
				for (const [rKey, rValue] of Object.entries(R)) {

					let rValues = rValue.split(",");

					rValues.map(V => {
						if (!this.utils.keyParams[V]) {
							meetRequired = null
						}
					})
				}
			})

			/*
			let testRequired = true;

					required.map(R => {
						for (const [rKey, rValue] of Object.entries(R)) {
							let rKeyParam = keyParams[rKey];
							let rValues = rValue.split(",");

							if (!rKeyParam || (!!rKeyParam && !rValues.includes(rKeyParam))) {
								testRequired = false;
							}
						}
					})

					if (!!testRequired) {
						sections.push(S);
					}
					*/

			return meetRequired;
		},
		setZoom(PROP, VALUE) {
			this.$emit('on-zoom', { property: PROP, value: VALUE });
		},
		starColumn(ARRAY) {
			this.$emit('on-star', ARRAY);
		},
		getRegion() {
			let region = !!this.dataPoint['region'] ? this.utils.keyParams[this.dataPoint['region']] : this.utils.keyParams['region'];
			let targetPlotConfig = !!this.visualizer ? !!this.visualizer["genes track"] ?
				this.visualizer["genes track"] : this.visualizer : null;

			if (!!region) {
				region = region.split(",").pop();
			}

			if (targetPlotConfig != null && targetPlotConfig["input type"] == "from data") {

				let chrField =
					targetPlotConfig["region fields"]
						.chromosome;
				let posField =
					targetPlotConfig["region fields"].position;
				let chr = null;
				let posStart = null;
				let posEnd = null;

				this.sectionData.map((c) => {
					chr = c[chrField];
					posStart =
						posStart == null
							? c[posField]
							: c[posField] < posStart
								? c[posField]
								: posStart;
					posEnd =
						posEnd == null
							? c[posField]
							: c[posField] > posEnd
								? c[posField]
								: posEnd;
				});

				region = chr + ":" + posStart + "-" + posEnd;
			}

			this.regionParam = region;
		},
		getBigRegion() {
			let region = !!this.dataPoint['big region'] ? this.utils.keyParams[this.dataPoint['big region']] : this.utils.keyParams['bigRegion'];
			let targetPlotConfig = !!this.visualizer ? !!this.visualizer["genes track"] ?
				this.visualizer["genes track"] : this.visualizer : null;

			if (!!region) {
				region = region.split(",").pop();
			}

			this.bigRegionParam = region;
		},
		resetAll() {
			this.sectionData = null,
				this.mergedData = null,
				this.originalData = null,
				this.groups = null,
				this.searched = [],
				this.loadingDataFlag = "down";
			this.noLoadedData = null;
			if (document.getElementById('tabUi' + this.sectionID)) {
				document.getElementById('tabUi' + this.sectionID).classList.remove('loading');
			}
		},
		filterSectionData(GROUP) {
			let groupValues = GROUP.split(", ");
			let groupKeys = this.sectionConfig["table format"]["group by"];

			let filteredData = [];

			this.sectionData.map(row => {
				let dataFit = true;
				let keyIndex = 0;
				groupKeys.map(key => {
					if (row[key] != groupValues[keyIndex]) (dataFit = false)
					keyIndex++;
				})

				if (!!dataFit) {
					filteredData.push(row);
				}
			})

			return filteredData;
		},
		getMergedData() {
			if (!!this.dataComparisonConfig) {
				let comConfig = this.dataComparisonConfig;
				let comFields = comConfig["fields to compare"];
				let groups = this.groups;
				let merged = {};

				if (!!Array.isArray(this.sectionData)) {
					this.sectionData.map(row => {
						let groupKey = row[comConfig["fields group data key"]];
						let keyProp = row[comConfig["key field"]];

						let isNewProp = !!merged[keyProp] ? false : true
						merged[keyProp] = isNewProp == true ? {} : merged[keyProp];

						for (const [fKey, fValue] of Object.entries(row)) {
							if (isNewProp == true) {
								if (!!comFields.includes(fKey)) {
									merged[keyProp][fKey] = {};
									merged[keyProp][fKey][groupKey] = fValue;
								} else {
									merged[keyProp][fKey] = fValue;
								}
							} else {
								if (!!comFields.includes(fKey)) {

									merged[keyProp][fKey][groupKey] = fValue;
								}
							}
						}
					})
				} else {
					merged = this.sectionData;
				}

				return merged;
			}
		},
		getSectionPlotLegend(ID) {

			let legend = (!!document.getElementById(ID + "_plotLegend")) ?
				document.getElementById(ID + "_plotLegend").innerHTML : null;

			return this.utils.Formatters.replaceWithParams(legend, this.pageParams);
		},
		getSectionTableLegend(ID) {

			let legend = (!!document.getElementById(ID + "_tableLegend")) ?
				document.getElementById(ID + "_tableLegend").innerHTML : null;

			return this.utils.Formatters.replaceWithParams(legend, this.pageParams);
		},
		updateData(data,filtersIndex) {
			this.sectionData = data;

			if(!!filtersIndex) {
				this.filtersIndex = filtersIndex;
			}
		},
		setOpenInfoCard(KEY) {
			this.openInfoCard = KEY;

			let infoCardConfig = this.tableFormat['rows as info cards'];

			let keyName = infoCardConfig['key'];
			let keyObj = {};
			keyObj[keyName] = KEY;

			this.utils.keyParams.set(keyObj)
		},
		sortData(KEY) {

			if (!!this.tableFormat['locus field'] && KEY.key == this.tableFormat['locus field']) {
				this.sectionData = this.utils.sortUtils.sortLocusField(this.sectionData, KEY.key, KEY.direction);
			} else {
				let isNumeric = this.checkIfNumeric(this.sectionData, KEY.key);
				//this.sectionData = this.utils.sortUtils.sortEGLTableData(this.sectionData, KEY.key, isNumeric, KEY.direction==='asc'?true:false);
				this.sectionData = this.utils.sortUtils.sortEGLTableData(this.sectionData, KEY.key, isNumeric, KEY.direction);
			}
		},
		checkIfNumeric(DATA, KEY) {
			let checkNumbers = [
				"0",
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9,
				"e",
				"E",
				"-",
				".",
			];
			let ifNumber = true;

			DATA.map((d) => {
				for (let i in d[KEY]) {
					if (!checkNumbers.includes(d[KEY][i])) {
						ifNumber = false;
					}
				}
			});

			return ifNumber;
		},
		removeData(KEY) {

			let groupKeys = this.sectionConfig["table format"]["group by"];

			let newSectionData = [];
			this.sectionData.map(row => {
				let group = "";
				let keyIndex = 1;
				groupKeys.map(key => {
					group += row[key];
					group += (keyIndex < groupKeys.length) ? ", " : "";
					keyIndex++;
				})

				if (group != KEY.label) {
					newSectionData.push(row);
				}
			});

			this.sectionData = (newSectionData.length === 0) ? null : newSectionData;

			let newOriginalData = [];
			this.originalData.map(row => {
				let group = "";
				let keyIndex = 1;
				groupKeys.map(key => {
					group += row[key];
					group += (keyIndex < groupKeys.length) ? ", " : "";
					keyIndex++;
				})

				if (group != KEY.label) {
					newOriginalData.push(row);
				}
			});

			this.originalData = newOriginalData.length === 0 ? null : newOriginalData;

			if (!this.originalData) {
				this.groups = null;
				this.searched = [];
			} else {
				this.groups = this.groups.filter(g => g.label != KEY.label);
				this.searched = this.searched.filter(params => params != KEY.params)
			}
		},
		captureData() {
			let title = [this.sectionConfig.header];

			if (!!this.dataPoint['parameters']) {
				this.dataPoint['parameters'].map(p => {
					title.push(this.utils.keyParams[p])
				})
			}

			title = title.join(":");

			this.$store.dispatch("capturedData", { action: 'add', title: title, data: this.sectionData });
		},

		getParamString(PARAMS_TYPE) {

			let queryParams = {}; // collect search parameters
			let queryParamsString = []; // search parameters into one string
			let queryParamsSet = true; // if search requirements don't meet set it null

			/// check if all required search parameters are there. If not set queryParamsSet null.
			//1. collect all parameters and put them in queryParams

			if (!!this.dataPoint.parameters && (!PARAMS_TYPE || (!!PARAMS_TYPE && PARAMS_TYPE != 'replace or'))) {

				//console.log("falls in this");

				this.dataPoint.parameters.map(p => {
					if (!!this.utils.keyParams[p]) {
						/// !! incomplete: This part is to add multiple query functionality
						if(!!this.dataPoint['expand region by'] && p == this.dataPoint['region']) {
							let region = this.utils.keyParams[p];
							
							let regionArr = region.split(":");
							let chr = regionArr[0];
							let posRegion = regionArr[1].split("-");
							let posStart = Number(posRegion[0]);
							let posEnd = Number(posRegion[1]);

							posStart -= this.dataPoint['expand region by']/2
							posStart = (posStart <= 0)? 0:posStart;

							posEnd += this.dataPoint['expand region by']/2
							
							region = chr +":"+posStart+"-"+posEnd;

							queryParams[p] = region.toString().split(",");

						} else {
							queryParams[p] = this.utils.keyParams[p].toString().split(","); 

							//console.log("p",this.utils.keyParams[p]);
							//console.log("p2",queryParams[p]);

						}
						
					} else {
						queryParamsSet = null;
					}
				})
			}

			if (!!this.dataPoint.parameters && !!PARAMS_TYPE && (PARAMS_TYPE == 'replace')) {

				let pWithValue = 0;
				this.dataPoint.parameters.map(p => {

					if (!!this.utils.keyParams[p]) {
						pWithValue++;
						queryParams[p] = this.utils.keyParams[p].toString().split(",");
					} else {
						queryParams[p] = [];
					}
				})

				if(pWithValue === 0) {
					queryParamsSet = null;
				}
			}

			if (!!this.dataPoint.parameters && !!PARAMS_TYPE && PARAMS_TYPE == 'replace or') {

				let pWithValue = 0;
				this.dataPoint.parameters.map(p => {

					if (!!this.utils.keyParams[p]) {
						pWithValue++;
						queryParams[p] = this.utils.keyParams[p].toString().split(",");
					} else {
						queryParams[p] = [];
					}
				})

				if(pWithValue === 0) {
					queryParamsSet = null;
				}
			}

			/// check if one of the pre filters require a value from search parameters. If no value, set queryParamsSet null.
			if (!!this.sectionConfig["pre filters"]) {
				this.sectionConfig["pre filters"].map(f => {
					if (f.value == "search parameter" && !this.utils.keyParams[f.parameter]) {
						queryParamsSet = null;
					}
				})
			}

			//2. build parameters sets from queryParams and put them in queryParamsString

			if (!!queryParamsSet && !!this.dataPoint.parameters) {


				let paramsLength = queryParams[this.dataPoint.parameters[0]].length;

				for (let i = 0; i < paramsLength; i++) {
					let pramsString = ""

					this.dataPoint.parameters.map(p => {
						// Don't forget to resolve this.
						if (!queryParams[p][i]) { queryParams[p][i] = queryParams[p][i - 1] }

						if (queryParams[p][i] != "" && queryParams[p][i] != "*") {
							pramsString += (!!queryParams[p][i])? queryParams[p][i].trim() + ",":"";
						} else if (queryParams[p][i] == "*") {
							pramsString += ""; ///wild key
						}
					})
					queryParamsString.push(pramsString.slice(0, -1));
				}

				//3. compare strigns in queryParamsString to this.searched and leave only the ones don't overlap

				queryParamsString = queryParamsString.filter(q => !this.searched.includes(q));
			}

			//5. Check if return the first item in the queryParamsString
			if (queryParamsString.length > 0 && !this.dataPoint['is value array']) {
				return queryParamsString[0];
			} else if(queryParamsString.length > 0 && !!this.dataPoint['is value array']) {
				return queryParamsString.join(';'); // this case is only for 'BYOGL'
			} else {
				if (!!this.dataPoint.parameters) {
					return "invalid";
				} else {
					return "";
				}
			}
		},
		getData(FROM) {
			
			this.loadingDataFlag = "up";
			this.noLoadedData = null;
			this.queryData(FROM);
		},

		queryData(FROM) {
			const queryType = this.dataPoint["type"];
			const paramsType = this.dataPoint["parameters type"];
			const params = this.dataPoint["parameters"];
			const dataType = this.dataPoint["data type"]
			// if data isn't getting cumulated, remove older search params other than the last one
			if (!this.dataPoint["cumulate data"] && this.searched.length > 1) {
				let lastSearched = this.searched[this.searched.length - 1]
				this.searched = [lastSearched];
			}
			let paramsString = this.getParamString(paramsType );

			//console.log("getParamString",paramsString);

			if (paramsString != "invalid") {
				if (document.getElementById('tabUi' + this.sectionID)) {
					//raise the data loading flag up.
					document.getElementById('tabUi' + this.sectionID).classList.add("loading");
				}

				let urlString, query, autoToken;
				switch (queryType) {
					case "bioindex":
						// Parameters type for BI is always 'array,' it doesn't need to pass paramsType and params
						this.queryBioindex(paramsString, paramsType, params);
						break;
					case "api":
						this.queryApi(paramsString, paramsType, params, dataType);
						break;
					case "file":
						let parameter = this.dataPoint["parameter"]
						this.queryFile(parameter);
						break;
					case "graphQl":
						// first added for CFDE project, to query data from IDG(pharos)
						

						if (paramsType == "array") {
							urlString = this.dataPoint["query string"].replace("$parameter", paramsString)
						} else if (paramsType == "replace to field") {

							urlString = this.dataPoint["query string"]

							params.map((param, pIndex) => {
								let paramList = this.customList[param]
								let replaceFrom = this.dataPoint["replace from"];
								let replaceTo = this.dataPoint["replace to"];

								let paramValue = paramList.filter(item => item[replaceFrom] == paramsString.split(",")[pIndex])[0][replaceTo];

								urlString = urlString.replace("$" + param, paramValue);
							})
						}

						query = `${urlString}`;

						this.queryGraphQl(query, this.dataPoint["url"], paramsString, paramsType, params)
						break;
					case "openApi":

						

						const header = this.dataPoint["header"];
						let body = JSON.parse(JSON.stringify(this.dataPoint["body"]));

						let paramStrArr = paramsString.split(",");

						//console.log("paramsString here",paramsString);
						

						params.map((param, pIndex) => {

							for (const [key, value] of Object.entries(body)) {

								//console.log("value",value);

								if(value == '$'+param) { // Here is the bug
									
									let paramType;
									this.searchParameters.map( p => {

										//console.log("searchParameter",p);

										if(p.type != "context search") {
											if(p.parameter == key) {
												paramType = p.type
											}
										} else {
											p.parameters.map(p2 => {
												if(p2.parameter == key) {
													paramType = p2.type
												}
											})
										}
									})

									

									//console.log("paramType",paramType);

									if(paramType == "string to array") {
										
										paramStrArr[pIndex] = paramStrArr[pIndex].replaceAll("\n",";");
										body[key] = paramStrArr[pIndex].split(";");

										//console.log("body[key]",body[key]);

									} else {
										
										body[key] = paramStrArr[pIndex];
									}
								}
							}
						})

						this.queryOpenApi(header, body, this.dataPoint["url"], paramsString, paramsType, params);
						break;
					case "component":
						this.loadingDataFlag = "down";
						break;
				}
			} else {
				this.loadingDataFlag = "down";
				this.noLoadedData = "Please set valid parameters for this query.";
				if (document.getElementById('tabUi' + this.sectionID)) {
					document.getElementById('tabUi' + this.sectionID).classList.remove('loading');
				}
			}

			//if(paramsString == "invalid") {
				//document.getElementById('section_wrapper_' + this.sectionID).classList.add('hidden');
			//}
		},

		queryGraphQl(QUERY, URL, PARAM, TYPE, PARAMS) {

			const graphqlQuery = QUERY;

			async function fetchGraphQL(query) {
				const response = await fetch(URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ query }),
				});

				if (!response.ok) {
					throw new Error(`GraphQL request failed with status ${response.status}`);
				}

				return response.json();
			}

			fetchGraphQL(graphqlQuery)
				.then(data => {
					this.processLoadedApi(data, PARAM, TYPE, PARAMS);
				})
				.catch(error => console.error('Error fetching GraphQL:', error));
		},

		queryOpenApi(HEADER,BODY, URL, PARAM, TYPE, PARAMS) {

			//console.log("BODY",BODY['genes']);

			async function fetchApi(header,body) {
				const response = await fetch(URL, {
					method: 'POST',
					headers: header,
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					throw new Error(`Request failed with status ${response.status}`);
				}

				return response.json();
			}

			fetchApi(HEADER,BODY)
				.then(data => {
					this.processLoadedApi(data, PARAM, TYPE, PARAMS);
				})
				.catch(error => console.error('Error fetching GraphQL:', error));
		},
		async queryBioindex(QUERY, TYPE, PARAMS) {

			this.searched.push(QUERY);

			let dataUrl = this.dataPoint.url;

			if (TYPE == "replace") {
				PARAMS.map((param, pIndex) => {
					if (!!QUERY.split(",")[pIndex]) {
						dataUrl = dataUrl.replace("$" + param, QUERY.split(",")[pIndex]);
					} else {
						dataUrl = dataUrl.replace("$" + param + ",", '');
						dataUrl = dataUrl.replace(",$" + param, '');
						dataUrl = dataUrl.replace("$" + param, '');
					}
				})


			} else if(TYPE == "replace or") {

				PARAMS.map((param, pIndex) => {
					if (!!QUERY.split(",")[pIndex]) {
						dataUrl = dataUrl.replace("$" + param, QUERY.split(",")[pIndex]);
					} else {
						dataUrl = dataUrl.replace("$" + param + ",", '');
						dataUrl = dataUrl.replace(",$" + param, '');
						dataUrl = dataUrl.replace("$" + param, '');
					}
				})

			} else {
				dataUrl = dataUrl + "query/" + this.dataPoint.index + "?q=" + QUERY;
			}

			

			let contentJson = await fetch(dataUrl).then((resp) => resp.json());

			if (contentJson.error == null && !!Array.isArray(contentJson.data) && contentJson.data.length > 0) {
				this.processLoadedBI(contentJson, QUERY);
			} else {
				// fetch failed 
				if (!!this.dataPoint["cumulate data"]) {
					this.sectionData = this.sectionData
				} else {
					this.sectionData = null;
				}
				this.loadingDataFlag = "down";
				this.noLoadedData = "No data is returned. Please check query parameters.";
			}
		},

		async queryBiContinue(TOKEN, QUERY) {

			let dataUrl;
			let PARAMS = this.dataPoint["parameters"];

			if (this.dataPoint["parameters type"] == "replace") {
				dataUrl = this.dataPoint["continue url"];

				PARAMS.map((param, pIndex) => {
					dataUrl = dataUrl.replace("$" + param, QUERY.split(",")[pIndex]);
				})

				dataUrl += TOKEN;
			} else {
				dataUrl = this.dataPoint.url + "cont?token=" + TOKEN;
			}

			let contentJson = await fetch(dataUrl).then((resp) => resp.json());

			if (contentJson.error == null && !!Array.isArray(contentJson.data) && contentJson.data.length > 0) {
				this.processLoadedBI(contentJson, QUERY);
			} else {
				// fetch failed
				if (!!this.dataPoint["cumulate data"]) {
					this.sectionData = this.sectionData
				} else {
					this.sectionData = null;
				}
				this.loadingDataFlag = "down";
			}
		},

		async queryApi(QUERY, TYPE, PARAMS, DATATYPE) {

			if (QUERY != "") {
				this.searched.push(QUERY);
			}


			let dataUrl = this.dataPoint.url;

			if (!!PARAMS && TYPE == "parameters") {
				let paramsArr = QUERY.split(",");

				let i = 0;
				PARAMS.map(p => {
					dataUrl += p + "=" + paramsArr[i] + "&&";
					i++;
				})

			} else if (!!PARAMS && TYPE == "array") {
				dataUrl += QUERY;
			} else if (!!PARAMS && TYPE == "replace") {

				PARAMS.map((param, pIndex) => {
					if(!!this.dataPoint['parameter convert'] && this.dataPoint['parameter convert'][param]) {

						switch(this.dataPoint['parameter convert'][param].type) {
							case "map name":
								//this.$root.sharedResource
								let paramText;
								if(this.dataPoint['parameter convert'][param].map == 'shared resource') {
									const convertPoint = this.$root.sharedResource[this.dataPoint['parameter convert'][param]['map name']];
									paramText = convertPoint[QUERY.split(",")[pIndex]];

								}
								
								dataUrl = dataUrl.replace("$" + param, paramText);

								break;
						}

					} else {
						dataUrl = dataUrl.replace("$" + param, QUERY.split(",")[pIndex]);
					}
					
				})
			} else if (!!PARAMS && TYPE == "replace to field") {

				PARAMS.map((param, pIndex) => {
					let paramList = this.customList[param]
					let replaceFrom = this.dataPoint["replace from"];
					let replaceTo = this.dataPoint["replace to"];

					let paramValue = paramList.filter(item => item[replaceFrom] == QUERY.split(",")[pIndex])[0][replaceTo];

					dataUrl = dataUrl.replace("$" + param, paramValue);
				})
			}

			//console.log("dataUrl",dataUrl);

			let contentJson;
			if(DATATYPE && DATATYPE === "line json"){
				const response = await fetch(dataUrl).then(resp => resp.text());
				const lines = response.split('\n').filter(line => line.trim() !== '');
				contentJson = lines.map(line => JSON.parse(line));
			}else{
				contentJson = await fetch(dataUrl).then((resp) => resp.json());
			}

			if (contentJson.error == null) {

				this.processLoadedApi(contentJson, QUERY, TYPE, PARAMS);
			} else {
				// fetch failed
				if (!!this.dataPoint["cumulate data"]) {
					this.sectionData = this.sectionData
				} else {
					this.sectionData = null;
				}
				this.loadingDataFlag = "down";
				this.noLoadedData = "No data is returned. Please check query parameters.";
			}
		},

		async queryFile(PARAM) {

			let file = !!this.utils.keyParams[PARAM] ? this.utils.keyParams[PARAM] :
				!!this.dataPoint["initial load"] ? this.dataPoint["initial load"] : null;
			if (!!file) {
				let dataUrl = "https://hugeampkpncms.org/servedata/dataset?dataset="
				dataUrl += (file.includes("http") || file.includes("https")) ? file : "https://hugeampkpncms.org/sites/default/files/users/user" + this.uId + "/" + file;

				let contentJson = await fetch(dataUrl).then((resp) => resp.json());
				if (contentJson.error == null) {
					this.processLoadedApi(contentJson, file, null, null)
				}
			}

		},
		async getList(PARAM, URL, TYPE, WRAPPER) {
			if (!!URL) {

				let paramList = await fetch(URL).then((resp) => resp.json());
				let list;

				if (paramList.error == null) {

					if (typeof paramList == "string") {
						paramList = (TYPE == "json") ? JSON.parse(paramList) : (TYPE == "csv") ? this.utils.dataConvert.csv2Json(paramList) : paramList;
					}
					if (!!WRAPPER) {

						let dataEntity = paramList;

						WRAPPER.map(w => {
							dataEntity = dataEntity[w];
						})


						if (typeof dataEntity == "string") {
							dataEntity = (TYPE == "json") ? JSON.parse(dataEntity) : (TYPE == "csv") ? this.utils.dataConvert.csv2Json(dataEntity) : dataEntity;
						}

						list = dataEntity;

					} else {
						list = paramList
					}
					this.customList[PARAM] = list;

					this.getData('custom');

				} else {
					console.log("there is an error");
				}
			}

		},

		processLoadedBI(CONTENT, QUERY) {

			let data = CONTENT.data;


			// if loaded data is processed
			let tableFormat = this.sectionConfig["table format"];

			if (!!tableFormat && !!tableFormat["data convert"]) {
				let convertConfig = tableFormat["data convert"];
				data = this.utils.dataConvert.convertData(convertConfig, data, this.phenotypeMap, this.$root.sharedResource); /// convert raw data
			}

			let cumulateData = (!!this.dataPoint["cumulate data"] && this.dataPoint["cumulate data"] == "true") ? true : null;

			let isOriginalDataEmpty = (!this.originalData || (!!this.originalData.length && this.originalData.length == 0)) ?
				true : null;

			if (!!cumulateData) {

				let queryKeyName = (!!this.dataPoint["query key name"]) ? this.dataPoint["query key name"] : "queryKey";

				if (!this.sectionConfig["table format"] || (!!this.sectionConfig["table format"] && !this.sectionConfig["table format"]["group by"])) {
					this.sectionConfig["table format"]["group by"] = [queryKeyName];
				}

				if (!!this.dataPoint["query key name"] && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["top rows"]) {
					if (!this.sectionConfig["table format"]["top rows"].includes(queryKeyName)) {
						this.sectionConfig["table format"]["top rows"].push(queryKeyName);
					}
				}

				data.map(d => {
					d[queryKeyName] = QUERY;
				});

				data = this.checkPreFilters(data);

				if (CONTENT.page == 1) {
					this.sectionData = !!isOriginalDataEmpty ? data : this.sectionData.concat(data);
				} else {
					this.sectionData = this.sectionData.concat(data);
				}

				if (!!CONTENT.continuation) {
					this.queryBiContinue(CONTENT.continuation, QUERY);
				} else {
					let paramsString = this.getParamString();

					if (paramsString == "invalid") {
						this.loadingDataFlag = "down"

						this.completeDataLoad(QUERY);
					} else {
						this.originalData = this.sectionData;
						this.queryBioindex(paramsString)
					}
				}
			} else {
				data = this.checkPreFilters(data)
				if (CONTENT.page == 1) {
					this.sectionData = data;
				} else {
					this.sectionData = this.sectionData.concat(data);
				}

				if (!!CONTENT.continuation) {
					this.queryBiContinue(CONTENT.continuation, QUERY);
				} else {
					this.loadingDataFlag = "down"

					this.completeDataLoad(QUERY);
				}
			}
		},

		processLoadedApi(CONTENT, QUERY, TYPE, PARAMS) {

			// remote table format
			if (!!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["type"]
				&& this.sectionConfig["table format"]["type"] == "remote") {

				// often table format config is wrapped by multiple layers of wrappers
				let tableFormatWrapper = this.sectionConfig["table format"]["config wrapper"];
				let tableFormats = CONTENT;

				tableFormatWrapper.map(w => {
					tableFormats = tableFormats[w];
				})
				this.remoteTableFormat = JSON.parse(tableFormats);
				this.tableFormat = this.remoteTableFormat;
			}

			// remote filters
			if (!!this.sectionConfig["filters"] && !!this.sectionConfig["filters"]["type"]
				&& this.sectionConfig["filters"]["type"] == "remote") {

				// often filters config is wrapped by multiple layers of wrappers
				let filtersWrapper = this.sectionConfig["filters"]["config wrapper"];
				let filters = CONTENT;

				filtersWrapper.map(w => {
					filters = filters[w];
				})
				this.remoteFilters = JSON.parse(filters);
			}

			// remote visualizer
			if (!!this.sectionConfig["visualizer"] && !!this.sectionConfig["visualizer"]["type"]
				&& this.sectionConfig["visualizer"]["type"] == "remote") {

				// often visualizer config is wrapped by multiple layers of wrappers
				let visualizerWrapper = this.sectionConfig["visualizer"]["config wrapper"];
				let visualizer = CONTENT;

				visualizerWrapper.map(w => {
					visualizer = visualizer[w];
				})
				this.remoteVisualizer = JSON.parse(visualizer);
			}

			// remote sectionDescription
			if (!!this.sectionConfig["section description"] && !!this.sectionConfig["section description"]["type"]
				&& this.sectionConfig["section description"]["type"] == "remote") {

				// often section description is wrapped by multiple layers of wrappers
				let descriptionWrapper = this.sectionConfig["section description"]["config wrapper"];
				let description = CONTENT;

				descriptionWrapper.map(w => {
					description = description[w];
				})
				this.remoteSectionDecription = description;
			}


			let data = null;

			// often data is wrapped by multiple layers of wrappers
			let dataWrapper = this.dataPoint["data wrapper"];
			let dataWrappers = this.dataPoint["data wrappers"];

			// process data by data type
			switch (this.dataPoint["data type"]) {
				case "bioindex":
					data = CONTENT.data;

					break;

				case "json":
					if (!!dataWrapper) {

						let dataEntity = CONTENT;

						dataWrapper.map(w => {
							dataEntity = dataEntity[w];
						})

						if (!Array.isArray(dataEntity)) {
							dataEntity = [dataEntity];
						}

						data = dataEntity;

					} else {
						data = CONTENT
					}

					break;

				case "line json":
					data = CONTENT;

					break;
				case "json lines":

					if (!!dataWrapper) {

						let tempData = []

						let dataEntity = CONTENT;
							dataWrapper["headers"].map(w => {
								dataEntity = dataEntity[w];
							})

							let headers = dataEntity;

							dataEntity = CONTENT;

							dataWrapper["data"].map(w => {
								dataEntity = dataEntity[w];
							})

							dataEntity.map(item,itemIndex => {
								let tempObj = {}

								item.map((column, columnIndex) => {
									tempObj[headers[columnIndex]] = column;
								})

								tempData.push(tempObj);
							})

						data = tempData;
						
					} else if (!!dataWrappers){

						let tempData = {}
						let headers = {};

						dataWrappers.map(dataWrapper => {

							let dataEntity = CONTENT;

							dataWrapper["headers"].map(w => {
								dataEntity = dataEntity[w];
							})

							//headers = headers.concat(dataEntity);
							headers[dataWrapper["stamp"]] = dataEntity;
							//headers[dataWrapper["stamp"]].push("stamp");

						})

						dataWrappers.map(dataWrapper => {

							let dataEntity = CONTENT;

							dataWrapper["data"].map(w => {
								dataEntity = dataEntity[w];
							})
							tempData[dataWrapper["stamp"]] = dataEntity;
						})

						let mergedData = []

						dataWrappers.map(dataWrapper => {

							let stamp = dataWrapper["stamp"];

							tempData[stamp].map(item => {
								let tempObj = {};

								headers[stamp].map((header, hIndex) => {

									tempObj[header] = item[hIndex];

								})

								tempObj["stamp"] = stamp;
								mergedData.push(tempObj)
							})

						})

						data = mergedData;

					} else {
						data = CONTENT;
					}
					
					break;

				case "csv":

					if (!!dataWrapper) {
						let dataEntity = CONTENT;

						dataWrapper.map(w => {
							dataEntity = dataEntity[w];
						})

						data = this.utils.dataConvert.csv2Json(dataEntity); // convert csv data to json format

					} else {
						data = this.utils.dataConvert.csv2Json(CONTENT); // convert csv data to json format
					}

					break;

				case "object to array":

					let objKey = this.dataPoint.object.key, objValue = this.dataPoint.object.value;

					if (!!dataWrapper) {
						let dataEntity = CONTENT;

						dataWrapper.map(w => {
							dataEntity = dataEntity[w];
						})

						data =[];

						Object.keys(dataEntity).map(d => {
							let tempObj = {};
							tempObj[objKey] = d;
							tempObj[objValue] = dataEntity[d];

							data.push(tempObj);
						})

					} else {
						data =[];

						Object.keys(CONTENT).map(d => {
							let tempObj = {};
							tempObj[objKey] = d;
							tempObj[objValue] = CONTENT[d];

							data.push(tempObj);
						})
					}

					break;
			}


			// if loaded data is processed
			if (data.length > 0) {
				if (typeof data == "string") {
					data = JSON.parse(data)
				}

				let tableFormat = (!!this.remoteTableFormat) ? this.remoteTableFormat : this.sectionConfig["table format"];


				if (!!tableFormat && !!tableFormat["data convert"]) {
					let convertConfig = tableFormat["data convert"];

					data = this.utils.dataConvert.convertData(convertConfig, data, this.phenotypeMap, this.$root.sharedResource); /// convert raw data
				}

				let cumulateData = (!!this.dataPoint["cumulate data"] && this.dataPoint["cumulate data"] == "true") ? true : null;

				let isOriginalDataEmpty = (!this.originalData || (!!this.originalData.length && this.originalData.length == 0)) ?
					true : null;


				if (!!cumulateData) {

					let queryKeyName = (!!this.dataPoint["query key name"]) ? this.dataPoint["query key name"] : "queryKey";

					if (!this.sectionConfig["table format"] || (!!this.sectionConfig["table format"] && !this.sectionConfig["table format"]["group by"])) {
						this.sectionConfig["table format"]["group by"] = [queryKeyName];
					}

					if (!!this.dataPoint["query key name"] && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["top rows"]) {
						if (!this.sectionConfig["table format"]["top rows"].includes(queryKeyName)) {
							this.sectionConfig["table format"]["top rows"].push(queryKeyName);
						}
					}

					data.map(d => {
						d[queryKeyName] = QUERY;
					});

					data = this.checkPreFilters(data);

					let paramsString = this.getParamString();

					if (paramsString == "invalid") {
						this.sectionData = !!isOriginalDataEmpty ? data : this.sectionData.concat(data);
						this.loadingDataFlag = "down";

						this.completeDataLoad(QUERY);

					} else {

						this.sectionData = (!this.sectionData) ? data : this.sectionData.concat(data);
						this.originalData = this.sectionData;
						this.queryApi(paramsString, TYPE, PARAMS)
					}
				} else {

					this.sectionData = this.checkPreFilters(data);
					this.loadingDataFlag = "down";

					this.completeDataLoad(QUERY);
				}

			} else {
				this.loadingDataFlag = "down";
				this.sectionData = null;
				this.noLoadedData = "No data is returned. Please check query parameters.";
			}
		},

		processLoadedFile(CONTENT) {
		},

		checkPreFilters(DATA) {
			//Apply pre filters as data gets loaded;
			let returnData = DATA;
			if (!!this.sectionConfig["pre filters"]) {
				let filters = this.sectionConfig["pre filters"];
				let filterValues = {}

				filters.map(filter => {
					filterValues[filter.parameter] = this.utils.keyParams[filter.parameter];
				})

				returnData = this.utils.filterUtils.applyFilters(filters, DATA, filterValues);
			}

			return returnData;
		},

		completeDataLoad(QUERY) {

			//console.log("complete",QUERY,this.sectionID,this.sectionData.length);

			if (this.sectionData != null && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["initial sort by"]) {
				let sortBy = this.sectionConfig["table format"]["initial sort by"]
				let isNumeric = this.checkIfNumeric(this.sectionData, sortBy.field);
				
				/* implement sort direction */

				this.sectionData = this.utils.sortUtils.sortEGLTableData(this.sectionData, sortBy.field, isNumeric, true);
			}

			if (this.sectionData != null && !!this.sectionConfig["table format"] && !!this.sectionConfig["table format"]["group by"]) {
				let groups = (!!this.groups) ? [...new Set(this.groups.map(g => g.label))] : [];
				let groupKeys = this.sectionConfig["table format"]["group by"];
				this.sectionData.map(row => {
					let group = "";
					let keyIndex = 1;
					groupKeys.map(key => {
						group += row[key];
						group += (keyIndex < groupKeys.length) ? ", " : "";
						keyIndex++;
					})

					if (!groups.includes(group)) {
						groups.push(group);
						this.groups = (!!this.groups) ? this.groups : [];

						let queryParams = (this.dataPoint.type == 'file') ? 'file' : this.dataPoint.parameters

						this.groups.push({ "label": group, "params": QUERY, "queryParams": queryParams });
					}
				})
			}

			this.originalData = this.sectionData;

			/// 'checkbox' filter 'uncheck' filter gets applied here
			if(!!this.sectionConfig && !!this.sectionConfig.filters) {
				let chkboxFilters = this.sectionConfig.filters.filter( f => f.type == 'checkbox');

				let tempArr = [...new Set(this.sectionData)];
				chkboxFilters.map( f =>{
					if(!!f.uncheck) {
						f.uncheck.map(u => {
							tempArr = tempArr.filter( t => t[f.field] != u);
						})
					}
				})

				this.sectionData = tempArr;
			}

			///

			if (!this.originalData || (!!this.originalData && this.originalData.length == 0)) {

				this.utils.alertUtils.popSectionAlert(
					"No data is returned for " + this.sectionConfig.header + ".",
					this.sectionID
				);

				this.loadingDataFlag = "down";
				this.noLoadedData = "No data is returned. Please check query parameters.";
			}

			if (!!this.sectionConfig["after data load"]) {

				this.sectionConfig["after data load"].map(act => {
					switch (act.type) {
						case "set parameter":
							let VALUE;

							switch (act.row) {
								case "first":
									VALUE = this.sectionData[0][act.field]
									break;

								case "last":
									let vIndex = this.sectionData.length - 1;
									VALUE = this.sectionData[vIndex][act.field]
									break;
								case "condition":
									let cField = act['condition field'];

									let cDataArray = [];
									this.sectionData.map(s => {
										let tempObj = {
											'cField': s[cField], 'pField': s[act.field]
										}
										cDataArray.push(tempObj);
									});

									let sortedArr = (act.condition == "lowest") ? this.utils.sortUtils.sortArrOfObjects(cDataArray, 'cField', 'number', "asc")
										: this.utils.sortUtils.sortArrOfObjects(cDataArray, 'cField', 'number', "desc")

									VALUE = sortedArr[0].pField;
							}

							let PARAMETERS = act.parameters;

							if (typeof PARAMETERS === "object") {
								let values = VALUE.split(",");

								PARAMETERS.map((p, pIndex) => {
									document.getElementById("search_param_" + p).value = values[pIndex];
									this.$root.$refs.multiSectionSearch.updateSearch(p, "");
								})

							} else {
								document.getElementById("search_param_" + PARAMETERS).value = VALUE;
								this.$root.$refs.multiSectionSearch.updateSearch(PARAMETERS, "");
							}

							break;
					}
				})
			}
		}

	},
});

$(function () { });
</script>
<style>
.multi-section {
	border-bottom: solid 1px #ddd;
	position: relative;
	padding: 20px 0;
}

.plot-tab-content-wrapper.hidden-content {
	height: 1px;
}

.row.hidden-svg {
	visibility: hidden;
	height: 25px;
}

button.show-hide-section,
button.capture-data {
	position: absolute;
	z-index: 10;
	right: 15px;
	top: 5px;
}

button.capture-data {
	right: 55px;
}

button.red-background {
	background-color: #ff5555 !important;
	border: solid 1px #aa5555 !important;
}

.required-parameter {
	font-size: 0.7em;
	text-transform: capitalize;
}

.required-parameters-wrapper>.required-parameter:not(:last-child):after {
	content: ", ";
}

.no-search-value {
	color: #ff0000 !important;
}

.section-search-bbl {
	font-size: 13px !important;
	margin-right: 5px;
	margin-bottom: 3px;
	font-weight: 400;
	line-height: 1;
	text-align: center;
	border: 1px solid transparent;
	border-radius: 10rem;
	display: inline-block;
}

.data-loading-flag {
	font-size: 0.7em;
	display: inline-block;
	background-color: #bbffcc;
	border: solid 1px #99ddbb;
	border-radius: 3px;
	padding: 0 15px;
	margin-right: 10px;
	color: #006633;
}

.no-data-flag {
	font-size: 0.7em;
	font-weight: 600;
	color: #33cc77;
}

.data-loading-flag.hidden {
	display: none;
}

.sub-tab-ui-wrapper {
	border-bottom: solid 1px #ddd;
	margin: 25px 0;
	padding: 0 25px;
}

.sub-tab-ui-wrapper .tab-ui-tab {
	padding: 5px 10px;
	border: solid 1px #ddd;
	display: inline-block;
	border-top-left-radius: 5px;
	border-top-right-radius: 5px;
	margin-right: 5px;
	background-color: #eee;
	margin-bottom: -1px;
	color: #0069d9;
	font-size: 13px;
}

.sub-tab-ui-wrapper .tab-ui-tab:hover {
	cursor: pointer;
}

.sub-tab-ui-wrapper .tab-ui-tab.active {
	border-bottom: solid 1px #fff;
	background-color: #fff;
}

.byor-shortened-string {
	position: relative;
}

.byor-shortened-string .raw-string {
	position: absolute;
	display: none;
	background-color: #333333;
	color: #ffffff;
	padding: 3px 8px;
	border: solid 1px #ddd;
	border-radius: 3px;
	z-index: 2;
	top: -20px;
}

.byor-shortened-string:hover .raw-string {
	display: block;
}

.viz-wrapper {
	display: block;
}
</style>
