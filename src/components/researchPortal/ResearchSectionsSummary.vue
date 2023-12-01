<template>
	<!--<div class="multi-section" :class="'wrapper-' + sectionIndex"
		:style="!!sectionData || sectionsConfig['section type'] == 'primary' ? '' : 'display:none;'">-->


	<div class="multi-section" :class="'wrapper-' + sectionIndex" >


		<div class="row">
			<div class="col-md-12">
				<button class="btn btn-sm show-evidence-btn capture-data" @click="captureData()"
					title="Capture data in section"><b-icon icon="camera"></b-icon></button>
				<button class="btn btn-sm show-evidence-btn show-hide-section"
					@click="utils.uiUtils.showHideElement('section_' + sectionID)" title="Show / hide section"><b-icon
						icon="eye"></b-icon></button>
				<h4>{{ sectionsConfig.header }}
				</h4>
			</div>
		</div>

		<div class="row card-body" :id="'section_' + sectionID">
			<div class="col-md-12" :class="'wrapper-' + sectionIndex">
				{{ sectionsConfig }}
				<research-data-table 
					v-if="!!primaryData"
					:pageID="sectionIndex"
					:dataset="primaryData"
					:tableFormat="tableFormat"
					:initPerPageNumber="10"
					:tableLegend="null" 
					:dataComparisonConfig="null" 
					:searchParameters="null" 
					:pkgData="null" 
					:pkgDataSelected="null" 
					:phenotypeMap="null" 
					:sectionId="sectionsConfig['section id']"
					:multiSectionPage="true" 
					:starItems="starItems"
					:utils="utils" 
					@clicked-sort="sortData"
					@on-star="starColumn"
					:region="null"
					:regionZoom="null"
					:regionViewArea="null"
					>
				</research-data-table>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import ResearchInSectionSearch from "@/components/researchPortal/ResearchInSectionSearch.vue";
import ResearchSectionFilters from "@/components/researchPortal/ResearchSectionFilters.vue";
import ResearchSectionVisualizers from "@/components/researchPortal/ResearchSectionVisualizers.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("research-sections-summary", {
	props: ["sectionIndex","uId", "sectionsConfig", "sectionsData","utils","starItems"],
	components: {
		ResearchSectionFilters,
		ResearchSectionVisualizers,
		ResearchDataTable,
		ResearchInSectionSearch
	},
	data() {
		return {
			sectionData: null,
			mergedData: null,
			originalData: null,
			tableFormat: null,
			remoteTableFormat: null,
			remoteFilters: null,
			remoteVisualizer: null,
			remoteSectionDecription: null,
			interSectionsFilters: [],
			groups: null,
			searched: [],
			loadingDataFlag: "down",
			regionZoom: 0,
			regionViewArea: 0,
			
		};
	},
	modules: {
	},
	created() {
		this.$root.$refs[this.sectionsConfig["section id"]] = this;

	},
	mounted() {
	},
	computed: {
		sectionID() {
			return this.sectionsConfig["section id"];
		},
		primaryData() {
			let primaryData = this.sectionsData.filter(data=> data.id == this.sectionsConfig.sections["primary section"]);
			return !!primaryData[0] ? primaryData[0].data : null;
		}
	},
	watch: {
		primaryData(DATA) {
			console.log("this.sectionsData",this.sectionsData);
			let primaryData = this.sectionsData.filter(data => data.id == this.sectionsConfig.sections["primary section"]);
			this.sectionData = !!primaryData[0] ? primaryData[0].data : null;
			this.tableFormat = !!primaryData[0] ? primaryData[0].config['table format'] : null;
		}
	},
	methods: {
		starColumn(ARRAY) {
			console.log("star called");
			this.$emit('on-star', ARRAY);
		},
		getData() {
			console.log("data getting updated");
		},
		sortData(KEY) {
			if (!!this.tableFormat['locus field'] && KEY.key == this.tableFormat['locus field']) {
				this.sectionData = this.utils.sortUtils.sortLocusField(this.sectionData, KEY.key, KEY.direction);
			} else {
				let isNumeric = this.checkIfNumeric(this.sectionData, KEY.key);
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
	},
});

$(function () { });
</script>
<style>
.multi-section {
	border-bottom: solid 1px #ddd;
	position: relative;
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
</style>
