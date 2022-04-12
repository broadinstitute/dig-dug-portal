<template>
	<div class="mbm-plot-content row">
		<div
			class="col-md-12 annotations-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-9 anno-plot-wrapper">
				<div id="annotationsUIWrapper">
					<div
						class="filtering-ui-wrapper add-content"
						style="width: 100%; padding: 0 10px; text-align: left"
					>
						<div class="filtering-ui-content">
							<div class="col" style="padding: 2px">
								<div
									class="label"
									style="
										display: inline-block;
										margin-right: 10px;
									"
								>
									Select Tissue
								</div>
								<select
									class="custom-select"
									@change="getGeneLinks($event)"
								>
									<option value="">
										{{ "Select Tissue" }}
									</option>
									<template v-for="tissue in GLTissues">
										<option
											:key="tissue.tissue"
											:value="tissue.tissue"
											v-html="getTissueLabel(tissue)"
										></option>
									</template>
								</select>
							</div>
						</div>
						<div
							class=""
							v-if="
								!!this.pkgData.GLData &&
								Object.keys(this.pkgData.GLData).length > 0 &&
								!renderConfig['no search key bubbles']
							"
							style="position: absolute; right: 10px; top: 7px"
						>
							<template
								v-for="tissue in Object.keys(
									this.pkgData.GLData
								)"
							>
								<span
									:key="tissue"
									:class="'btn GL-search-bubble '"
									style="
										'background-color:#aaaaaa'
									"
									v-html="
										tissue +
										'&nbsp;<span class=\'remove\'>X</span>'
									"
									@click="removeGLTissue(tissue)"
								></span>
							</template>
						</div>
					</div>
				</div>
			</div>
			<div class="col-md-3 anno-plot-ui-wrapper reference-area"></div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import alertUtils from "@/utils/alertUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";
import keyParams from "@/utils/keyParams";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-gene-links-plot", {
	props: [
		"region",
		"phenotype",
		"renderConfig",
		"plotMargin",
		"compareGroupColors",
		"dataComparison",
		"plotData",
		"pkgData",
		"pkgDataSelected",
		"regionZoom",
		"regionViewArea",
	],
	data() {
		return {
			spaceBy: 7,
			GEData: {},
			trigger: 0,
		};
	},
	modules: {
		uiUtils,
		Formatters,
		keyParams,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		this.getGlobalEnrichment(this.searchingRegion);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		GLTissues() {
			console.log(this.trigger);
			if (Object.keys(this.GEData).length == 0) {
				return null;
			} else {
				let tempObject = {};
				for (const [pKey, tissues] of Object.entries(this.GEData)) {
					tissues.map((t) => {
						if (!tempObject[t.tissue]) {
							tempObject[t.tissue] = [];
							tempObject[t.tissue].push(pKey);
						} else {
							if (tempObject[t.tissue].indexOf(pKey) <= -1) {
								tempObject[t.tissue].push(pKey);
							}
						}
					});
				}

				let tempArray = [];

				for (const [key, arr] of Object.entries(tempObject)) {
					let tempObj = {};
					tempObj["tissue"] = key;
					tempObj["phenotypes"] = arr;
					tempArray.push(tempObj);
				}

				return tempArray;
			}
		},
		searchingParameters() {
			if (
				this.searchingRegion != null &&
				this.searchingPhenotype != null
			) {
				return this.searchingRegion + "," + this.searchingPhenotype;
			}
		},
		searchingRegion() {
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			return returnObj;
		},
		searchingPhenotype() {
			if (this.phenotype != null) {
				let returnPhenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][this.phenotype]
					: this.phenotype;

				return returnPhenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig["phenotype parameter"]]) {
					return keyParams[this.renderConfig["phenotype parameter"]];
				} else {
					return null;
				}
			}
		},
	},
	watch: {
		searchingParameters(PARAM) {
			console.log("searchingParameters called");
			this.getGlobalEnrichment(this.searchingRegion);
		},
	},
	methods: {
		...uiUtils,
		removeGLTissue(TISSUE) {
			//delete this.GLData[TISSUE];
			delete this.pkgData["GLData"][TISSUE];
			//this.pkgData["GLData"] = this.GLData;
			if (Object.keys(this.pkgData["GLData"]).length == 0) {
				delete this.pkgData["GLData"];
			}
			this.$store.dispatch("pkgDataSelected", {
				type: "GLTissue",
				id: TISSUE,
				action: "remove",
			});
			this.trigger--;
		},
		getTissueLabel(TISSUE) {
			return TISSUE.tissue + " (" + TISSUE.phenotypes.join() + ")";
		},

		async getGeneLinks(event) {
			if (event.target.value != "") {
				let geneLinksServer =
					this.renderConfig["gene links server"] == "KP BioIndex"
						? "https://bioindex.hugeamp.org/api/bio"
						: this.renderConfig["gene links server"];

				let tissue = event.target.value;
				let region = this.searchingRegion;

				let GLURL =
					geneLinksServer +
					"/query/gene-links?q=" +
					tissue +
					"," +
					region.chr +
					":" +
					region.start +
					"-" +
					region.end;

				let GLJson = await fetch(GLURL).then((resp) => resp.json());

				if (GLJson.error == null) {
					if (GLJson.data.length == 0) {
						alertUtils.popAlert(tissue + " has no linked genes.");
					} else {
						//this.GLData[tissue] = GLJson.data;
						this.$store.dispatch("pkgDataSelected", {
							type: "GLTissue",
							id: tissue,
							action: "add",
						});
						if (!this.pkgData["GLData"]) {
							this.pkgData["GLData"] = {};
						}
						this.pkgData["GLData"][tissue] = GLJson.data;
					}

					this.trigger++;
				}
			}
		},
		async getGlobalEnrichment(REGION_OBJ) {
			if (
				!!REGION_OBJ &&
				!!REGION_OBJ.chr &&
				!!REGION_OBJ.start &&
				REGION_OBJ.end
			) {
				let geneLinksServer =
					this.renderConfig["gene links server"] == "KP BioIndex"
						? "https://bioindex.hugeamp.org/api/bio"
						: this.renderConfig["gene links server"];

				let phenotype = this.searchingPhenotype;

				let GEURL =
					geneLinksServer + "/query/global-enrichment?q=" + phenotype;

				let GEJson = await fetch(GEURL).then((resp) => resp.json());

				if (GEJson.error == null) {
					if (this.dataComparison == "newSearch") {
						this.GEData = {};
					}
					this.GEData[this.searchingPhenotype] = GEJson.data;

					this.trigger++;
				}
			}
		},
	},
});

$(function () {});
</script>

<style>
.GL-search-bubble {
	background-color: #999999;
	font-size: 12px;
	margin-right: 5px;
	border-radius: 5px;
	margin-bottom: 3px;
	color: #fff;
	float: left;
	font-weight: 400;
	line-height: 1;
	text-align: center;
	white-space: nowrap;
	vertical-align: baseline;
	user-select: none;
	border: 1px solid transparent;
	padding: 0.25em 0.4em;
	padding-right: 0.6em;
	padding-left: 0.6em;
	border-radius: 10rem;
}

.GL-search-bubble.hidden {
	display: none !important;
}
.phenotype-tissue-td {
	vertical-align: top !important;
}

.annotations-table-wrapper {
	max-height: 300px;
	overflow: auto;
	padding: 15px;
	background-color: #eee;
	border: solid 1px #ddd;
	border-radius: 5px;
	margin-bottom: 15px;
}
.annotations-plots-wrapper {
	padding: 0 !important;
}

.annotations-plot-wrapper {
	padding: 0 !important;
}
.anno-plot-wrapper,
.anno-plot-ui-wrapper {
	display: inline-block;
	vertical-align: top;
}
.anno-bubble-wrapper {
	width: auto;
	display: inline-block;
	margin-left: 3px;
	margin-right: 3px;
	margin-bottom: 3px;
}
.anno-bubble-wrapper span {
	font-size: 12px;
	display: inline-block;
}
.anno-bubble {
	border-radius: 12px;
	margin-right: 3px;
	width: 12px;
	height: 12px;
	vertical-align: -3px;
}

#GEPlotWrapper,
#tissuesPlotWrapper,
#annotationsPlotWrapper {
	position: relative;
}

#tissueInfoBox,
#selectedTissueInfoBox,
#GEInfoBox {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 14px;
}
#annoInitialMessage,
#tissueInitialMessage {
	width: 300px;
	border: solid 1px #ddd;
	color: #666;
	margin: 0 auto;
	border-radius: 25px;
	text-align: center;
	font-size: 13px;
}

table.ge-data-table {
	border-top: solid 1px #ddd;
	border-right: solid 1px #ddd;
	border-collapse: inherit;
	text-align: center;
	background-color: #fff;
}

.ge-data-table table {
	border: none;
}

.ge-data-table th {
	background-color: #cccccc;
	color: #333333;
	border: none !important;
	border-left: solid 1px #ddd !important;
	border-bottom: solid 1px #ddd !important;
	font-size: 13px;
}

.ge-data-table td {
	border: none !important;
	border-left: solid 1px #eee !important;
	border-bottom: solid 1px #ddd !important;
	vertical-align: middle;
	font-size: 14px;
}
</style>



