<template>
	<div>
		<div class="search-underlay" @click="unFocus"></div>
		<div class="byor-single-search-wrapper">
			<div class="search-underlay-close-note">click anywhere to close search</div>
			<span v-if="summaryAll.length > 0 && hasFocus" class="btn btn-default ss-summary-popup-btn"
				@click="summaryPopup = !summaryPopup ? true : null;">Toggle quick view <b-icon
					icon="arrow-up-right-square"></b-icon></span>

			<input class="form-control byor-single-search" type="text" id="byor_single_search" v-model="singleSearchParam"
				:placeholder="!!singleSearchConfig && !!singleSearchConfig['search instruction'] ? singleSearchConfig['search instruction']
				: 'Search gene, variant, region, phenotype, or tissue'" @keyup.enter="onSearch" @focus="onFocus" @blur="onBlur"
				autocomplete="off" />
			<span v-if="!!singleSearchParam" class="btn btn-default reset-search" @click="resetSearch()">
				Clear search <b-icon icon="x-circle-fill"></b-icon>
			</span>

			<div class="byor-single-search-results-wrapper" v-if="!!singleSearchConfig">

				<div id="byor_single_search_results" class="byor-single-search-results-groups" v-if="anyResults() > 0">
					
					<div class="byor-ss-results-section" v-if="singleSearchResult.genes.length > 0">
						<div class="byor-ss-results-section-title">GENES</div>
						<div v-for="gene in singleSearchResult.genes" :key="gene" class="">
							<div v-if="!!isParameterActive('kp genes').active && !!isParameterActive('kp genes').options"
								class="single-search-option search-gene-link"
							>
								{{ gene }}
								<span class="more-options">
									<div class="ss-options-wrapper">
										<div v-for="option in isParameterActive('kp genes').options">
											<span>
												<a :href="(option.url) ? option.url + gene : 'javascript:;'" 
													class="ss-explore">
													{{option['url label'] }}
												</a>
												<span v-if="!!option.url && !!option.sections"> | </span>
												<a href="javascript:;" 
													class="ss-generate-summary"
													@click="generateSummary(gene, option['summary id'], option['summary label'], option.sections)"
												>
													{{option['summary label'] }}
												</a>
											</span>
										</div>
									</div>
								</span>
							</div>
							<span class="search-word-group" style="display:none">{{'Gene'}}</span>
						</div>
					</div>

					<template
						v-if="!!isParameterActive('kp phenotypes').active && !!isParameterActive('kp phenotypes').options && singleSearchResult.phenotypes.length>0"
						>
						<div class="byor-ss-results-section">
							<div class="byor-ss-results-section-title">GENE SET PHENOTYPES</div>
							<div v-for="phenotype in singleSearchResult.phenotypes" 
								:value="phenotype.name"
								:key="phenotype.name"
							>
								<div class="single-search-option">
									{{phenotype.description}}
									<span class="more-options">
										<div class="ss-options-wrapper">
											<div v-for="option in isParameterActive('kp phenotypes').options">
												<span>
													<a :href="(option.url) ? option.url + phenotype.name : 'javascript:;'"
														class="ss-explore"
														>
														{{ option['url label'] }}
													</a>
													<span v-if="!!option.url && !!option.sections"> | </span>
													<a href="javascript:;" 
														class="ss-generate-summary"
														@click="generateSummary(phenotype.name, option['summary id'], option['summary label'], option.sections)"
													>
														{{option['summary label'] }}
													</a>
												</span>
											</div>
										</div>
									</span>
								</div>
								<span class="search-word-group" style="display:none">{{phenotype.group}}</span>
							</div>
						</div>
					</template>

					<template v-for="param in singleSearchConfig['search parameters']">
						<template v-if="!param.values || (!!param.values && param.values != 'kp genes' && param.values != 'kp phenotypes')">
							<template v-if="!!isParameterActive(param['parameter']).active && singleSearchResult[param['parameter']].length>0">
								<div class="byor-ss-results-section">
									<div class="byor-ss-results-section-title">{{ param['label'] }}</div>
									<div v-for="item in singleSearchResult[param['parameter']]">

										<div class="single-search-option">
											{{item.label}}
											<span class="more-options">
												<div class="ss-options-wrapper">
													<div v-for="option in isParameterActive(param['parameter']).options">
														<span>
															<a :href="(option.url) ? option.url + item.value : 'javascript:;'"
																class="ss-explore"
															>
															{{ option['url label'] }}
															</a>
															<span v-if="!!option.url && !!option.sections"> | </span>
															<a href="javascript:;" 
																class="ss-generate-summary"
																@click="generateSummary(item.value, option['summary id'], option['summary label'], option.sections)"
															>
																{{option['summary label'] }}
															</a>
														</span>
													</div>
												</div>
											</span>
										</div>

										<!--<span class="search-word-group">{{param['parameter']}}</span>-->
									</div>
								</div>
							</template>
						</template>
					</template>

				</div>
			</div>

			<div id="summary_popup" :class="(!!summaryPopup) ? 'ss-summary-popup' : 'ss-summary-popup hidden'">
				<span class="btn btn-default ss-summary-hide" @click="summaryPopup = !summaryPopup ? true : null;"><b-icon
						icon="arrow-down-left-square"></b-icon></span>
				<h4>Search quick view</h4>

				<div class="summary-content">
					<div v-for="item in summaryAll" v-html="item.data">
					</div>
				</div>
			</div>

		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { match } from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import alertUtils from "@/utils/alertUtils";
import EventBus from "@/utils/eventBus";

export default Vue.component("research-single-search-cfde", {
	props: ["singleSearchConfig", "phenotypes", "utils", "fromNav"],
	modules: {},

	data() {
		return {
			singleSearchParam: null,
			singleSearchResult: {
				genes: [],
				phenotypes: [],
				tissues: [],
				diseases: []
			},
			customList: {},
			summary: [],
			summarySearch: [],
			summaryByKey: [],
			summaryAll: [],
			summaryPopup: null,
			summaryPopupContent: "",
			hasFocus: false,
		};
	},
	created() {
		if (!!this.singleSearchConfig && !!this.singleSearchConfig["search parameters"]) {

			this.singleSearchConfig["search parameters"].map(S => {
				if (!!S["data point"]) {
					let listPoint = S["data point"];
					this.getList(
						S["parameter"],
						listPoint["url"],
						listPoint["data type"],
						listPoint["data wrapper"]
					)
				} else if (!!S["values"] && (S["values"] != "kp genes" && S["values"] != "kp phenotypes")) {
					this.customList[S["parameter"]] = S["values"];
				}
			})
		} else {
			this.getTissues();
		}
	},
	mounted() { 
		//listens for search event from nav component
		EventBus.$on('activate-search', this.onFocus);
	},
	beforeDestroy() {
		EventBus.$off('activate-search');
	},
	computed: {},
	watch: {
		summary(summaryArr) {
			this.updateSummary();
		},
		summarySearch(searchArr) {
			this.updateSummary();
		},
		singleSearchParam(PARAM) {
			if (!!PARAM && PARAM.length >= 2) {

				let paramWords = PARAM.split(" ");
				// in case there is custom searchConfig, make sure kp gene search is there. Otherwise, gene search is active in default.
				if (!!this.singleSearchConfig && !!this.singleSearchConfig["search parameters"]) {

					let isKpGenes = null;

					this.singleSearchConfig["search parameters"].map(S => {
						if (!!S["values"] && S["values"] == "kp genes") {
							isKpGenes = true
						}
					})

					if (!!isKpGenes) { this.lookupGenes(PARAM); }

					let isKpPhenotypes = null;

					this.singleSearchConfig["search parameters"].map(S => {
						if (!!S["values"] && S["values"] == "kp phenotypes") {
							isKpPhenotypes = true
						}
					})

					if (!!isKpPhenotypes) {

						let searchPhenotypes = [];

						this.phenotypes.map((p) => {
							let isInPhenotype = 0;
							paramWords.map((w) => {
								if (
									!!p.description
										.toLowerCase()
										.includes(w.toLowerCase())
								) {
									isInPhenotype++;
								}
							});

							if (isInPhenotype == paramWords.length) {
								searchPhenotypes.push(p);
							}
						});

						let shorterFirst = searchPhenotypes.sort((a, b) => a.name.length - b.name.length);

						this.singleSearchResult.phenotypes = shorterFirst;
					}

				} else {

					this.lookupGenes(PARAM);
				}


				/// for custom parameters
				let searchFields = Object.keys(this.customList);



				searchFields.map(P => {

					let searchItems = [];
					this.customList[P].map(item => {
						let isInList = 0;

						paramWords.map((w) => {
							if (
								!!item.label
									.toLowerCase()
									.includes(w.toLowerCase())
							) {
								isInList++;
							}
						});

						if (isInList == paramWords.length) {
							searchItems.push(item);
						}
					})
					this.singleSearchResult[P] = searchItems;
				})
			} else {
				this.singleSearchResult.genes = [];
				this.singleSearchResult.phenotypes = [];
				let searchFields = Object.keys(this.customList);
				this.summaryAll = [];
				this.summaryPopup = false;
				searchFields.map(P => {
					this.singleSearchResult[P] = [];
				})
			}
		},
	},
	methods: {
		...alertUtils,
		updateSummary() {
			//First get the list of keys searched

			let searchedKeys = [...new Set(this.summarySearch.map(s => s.key))].sort();

			this.summaryByKey = [];
			this.summaryAll = [];

			searchedKeys.map(s => {
				let keySearched = this.summarySearch.filter(ss => ss.key == s);
				let sId = keySearched[keySearched.length - 1].id;

				this.summary.map(sItem => {

					if (sItem.key == s) {
						this.summaryAll.push(sItem);

						if (sItem.id == sId) {
							this.summaryByKey.push(sItem);
						}
					}
				})
			})
		},
		generateSummary(KEY, ID, HEADER, sections) {

			//Set summaryPopup true

			this.summaryPopup = true;

			let ifSearched = this.summarySearch.filter(search => search.key == KEY && search.id == ID);

			if (ifSearched.length === 0) {
				sections.map(section => {
					switch (section['data point'].type) {
						case 'bioindex':
							this.getBiSummary(section, ID, KEY)
							break;
					}
				})

				this.summarySearch = [];

				this.summarySearch.push({ key: KEY, id: ID });
			} else {
				let notSearched = this.summarySearch.filter(search => search.key != KEY || search.id != ID);
				notSearched.push(ifSearched[0]);
				this.summarySearch = notSearched;
				console.log("item already searched")
			}

		},
		async getBiSummary(CONFIG, ID, KEY) {

			let fetchUrl = CONFIG['data point'].url;

			CONFIG['data point'].parameters.map(parameter => {
				fetchUrl = fetchUrl.replace('$' + parameter, KEY)
			})

			let summary = await fetch(fetchUrl).then(resp => resp.json());

			if (summary.error == null && !!Array.isArray(summary.data) && summary.data.length > 0) {

				let filteredData = [...new Set(summary.data)]

				/// adding filtering option
				if(CONFIG['pre filters']) {

					CONFIG['pre filters'].map(filter =>{
						switch (filter['type']) {
							case 'filter out':
								filter['values'].map(value =>{
									filteredData = filteredData.filter(i => i[filter['field']] != value);
								})
								break;

							case 'search':
								filteredData = filteredData.filter(i => !!filter['values'].includes(i[filter['field']]));

								break;
						}
					})
				}
				
				///

				summary.data = filteredData;

				let summaryHeader = "<b class='summary-data-header'>" + CONFIG["summary text"] + "</b><br />";

				CONFIG['data point'].parameters.map(parameter => {
					summaryHeader = summaryHeader.replace('$' + parameter, KEY)
				})

				let summaryData = "";

				summaryData += "<div class='summary-row'>";

				for (let j = 0; j < CONFIG['summary columns'].length; j++) {
					summaryData += "<span class='summary-column-header'>" + CONFIG['summary columns'][j].header + "</span>"
				}

				summaryData += "</div>";

				let rowsLimit = (!!CONFIG['summary rows'] && CONFIG['summary rows'] <= summary.data.length) ? CONFIG['summary rows'] : summary.data.length;

				for (let i = 0; i < rowsLimit; i++) {
					summaryData += "<div class='summary-row'>";
					for (let j = 0; j < CONFIG['summary columns'].length; j++) {

						console.log("CONFIG['summary columns'][j]", CONFIG['summary columns'][j]);

						let columnContent = (!!CONFIG['summary columns'][j].format) ? this.utils.Formatters.ssColumnFormat(summary.data[i],
							CONFIG['summary columns'][j].format,
							summary.data[i][CONFIG['summary columns'][j].field])
							: summary.data[i][CONFIG['summary columns'][j].field];
						summaryData += "<span class='summary-column'>" + columnContent + "</span>"
					}

					summaryData += "</div>";
				}

				summaryData = summaryHeader + summaryData;

				this.summary.push({ key: KEY, id: ID, data: summaryData });

			} else {
				let summaryHeader = "<b class='summary-data-header'>" + CONFIG["summary text"] + "</b><br />";

				CONFIG['data point'].parameters.map(parameter => {
					summaryHeader = summaryHeader.replace('$' + parameter, KEY)
				})

				summaryHeader += "<div class='summary-row'>N/A</div>"

				this.summary.push({ key: KEY, id: ID, data: summaryHeader });

			}
		},

		resetSearch() {
			this.singleSearchParam = null;

			let keys = Object.keys(this.singleSearchResult);

			keys.map(key => {
				this.singleSearchResult[key] = [];
			})

			this.summaryPopup = false;
			this.summaryAll = [];
		},

		async getTissues() {

			let tissues1 = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/gene-expression-tissue/1`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}

					let tissues = json.keys.map(key => key[0].replaceAll("_", " "))

					return tissues;
				});

			let tissues2 = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/partitioned-heritability-top-tissue/2`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}

					let tissues = json.keys.map(key => key[0])

					return tissues;
				});

			//return tissues;
			if (!!tissues1 && tissues2) {
				let tissues = tissues1.concat(tissues2);

				let uniqueList = [...new Set(tissues)];

				let tissuesList = [];
				uniqueList.map(tissue => {
					let labelString = tissue.charAt(0).toUpperCase() + tissue.slice(1);
					let tempObj = { label: labelString, value: tissue.replaceAll(" ", "_") };

					tissuesList.push(tempObj)
				});
				this.customList["tissues"] = tissuesList;
			}
		},
		anyResults() {
			let parameters = Object.keys(this.singleSearchResult)

			let totalResults = 0;
			parameters.map(p => {
				totalResults += this.singleSearchResult[p].length;
			})

			return totalResults;
		},


		onSearch() {
			let searchKey = this.singleSearchParam;
			if (
				!!this.singleSearchParam.includes("rs") ||
				!!this.singleSearchParam.includes(":")
			) {

				searchKey = searchKey.replace(/,/g, "").trim();

				if (!!this.singleSearchParam.includes("-")) {
					let chr = searchKey.split(":")[0];
					let region = searchKey.split(":")[1].split("-");

					let regionPageUrl =
						"/region.html?chr=" +
						chr +
						"&end=" +
						region[1] +
						"&start=" +
						region[0];

					this.singleSearchParam = "";
					location.href = regionPageUrl;
				} else {
					location.href = "/variant.html?variant=" + searchKey;
				}
			} else if (
				!!this.singleSearchParam.includes("_") &&
				!!this.singleSearchParam.includes("-")
			) {
				//on search for a variant in chr3_12489012-C-T format
				location.href = "/variant.html?variant=" + searchKey;
			} else {
				let anyResults = this.anyResults();

				if (anyResults === 0) {
					alertUtils.popAlert("Your search term was not found. Please try again.")
				} else if (anyResults === 1) {

					let reDirectUrl;

					if (!this.singleSearchConfig) {

						for (const [sKey, sValue] of Object.entries(this.singleSearchResult)) {
							if (sValue.length == 1) {
								switch (sKey) {
									case 'phenotypes':
										reDirectUrl = "/phenotype.html?phenotype=" + sValue[0].name;
										break;
									case 'genes':
										reDirectUrl = "/gene.html?gene=" + sValue[0];
										break;
									case 'tissues':
										reDirectUrl = "/tissue.html?tissue=" + sValue[0].value;
										break;
									case 'diseases':
										reDirectUrl = "/disease.html?disease=" + sValue[0].value;
										break;
								}
							}
						}

						location.href = reDirectUrl;
					}

				} else if (anyResults > 1) {
					alertUtils.popAlert("Multiple search options are available. Please select one from the list.")
				}
			}
		},
		onFocus() {
			console.log('search focus');
			document.querySelector('.search-underlay').classList.add('focus');
			document.querySelector('.byor-single-search-wrapper').classList.add('focus');
			if(this.fromNav) document.querySelector('.byor-single-search-wrapper').classList.remove('hidden');
			this.hasFocus = true;
			//if(this.summaryAll.length>0) this.summaryPopup = true;
		},
		unFocus(){
			document.querySelector('.search-underlay').classList.remove('focus');
			document.querySelector('.byor-single-search-wrapper').classList.remove('focus');
			if(this.fromNav) document.querySelector('.byor-single-search-wrapper').classList.add('hidden');
			this.hasFocus = false;
			//this.summaryPopup = false;
		},
		onBlur() {
			console.log('seach blur');
		},

		isParameterActive(PARAM) {

			let returnParam = { active: null, url: '', options: null };

			if (!!this.singleSearchConfig) {
				this.singleSearchConfig["search parameters"].map(param => {
					if (param.values == PARAM) {
						returnParam.active = true;

						if (!!param['target page']) {
							if (!!param['target page']['page id']) {
								returnParam.url = '/research.html?pageid='
									+ param['target page']['page id'];
							} else if (!!param['target page']['url']) {
								returnParam.url = param['target page']['url'];
							}

							returnParam.url += (!!param['target page']['entity']) ? '&' + param['target page']['entity parameter'] + '=' + param['target page']['entity'] : "";

							if (!!param['target page']['page id']) {
								returnParam.url += '&' + param['parameter'] + '=';
							} else if (!!param['target page']['url']) {
								returnParam.url += param['parameter'] + '=';
							}
						}


						if (!!param.options) {
							returnParam.options = param.options;
						}

					} else {
						if (param.parameter == PARAM) {
							returnParam.active = true;

							if (!!param['target page']) {
								if (!!param['target page']['page id']) {
									returnParam.url = '/research.html?pageid='
										+ param['target page']['page id'];
								} else if (!!param['target page']['url']) {
									returnParam.url = param['target page']['url'];
								}

								returnParam.url += (!!param['target page']['entity']) ? '&' + param['target page']['entity parameter'] + '=' + param['target page']['entity'] : "";

								if (!!param['target page']['page id']) {
									returnParam.url += '&' + param['parameter'] + '=';
								} else if (!!param['target page']['url']) {
									returnParam.url += param['parameter'] + '=';
								}
							}

							if (!!param.options) {
								returnParam.options = param.options;
							}
						}
					}
				})
			}

			return returnParam;

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

						let values = [];

						if (dataEntity.length > 0) {
							dataEntity.map(item => {
								if (typeof item == 'string' || typeof item == 'number') {
									values.push({ "label": item, "value": item })
								} else if (typeof item == 'object' && !!Array.isArray(item)) {
									values.push({ "label": item[0], "value": item[0] })
								} else if (typeof item == 'object' && !Array.isArray(item)) {
									values.push(item);
								}
							})
						}

						list = values;

					} else {
						list = paramList
					}
					this.customList[PARAM] = list;

				} else {
					console.log("there is an error");
				}
			}

		},
		async searchGene(KEY) {

			let geneSymbol = await this.utils.regionUtils.geneSymbol(KEY);
			let isCustomGene = this.isParameterActive('kp genes');

			if (geneSymbol) {

				let genePageUrl;

				if (!isCustomGene.active) {
					genePageUrl = "/gene.html?gene=" + geneSymbol;
				} else if (!!isCustomGene.active) {
					genePageUrl = isCustomGene.url + geneSymbol;
				}

				location.href = genePageUrl;
			}
		},

		async searchRegion(KEY) {
			let region = await this.utils.regionUtils.parseRegion(KEY, true, 50000);
			let isCustomRegion = this.isParameterActive('kp region');

			if (region) {
				let regionPageUrl;

				if (!isCustomRegion.active) {
					regionPageUrl =
						"/region.html?chr=" +
						region.chr +
						"&end=" +
						region.end +
						"&start=" +
						region.start;
				} else if (!!isCustomRegion.active) {
					regionPageUrl = isCustomRegion.url +=
						region.chr +
						":" +
						region.start +
						"-" +
						region.end;
				}

				location.href = regionPageUrl;
			}
		},

		async lookupGenes(input) {
			let matches = await match("gene", input, { limit: 10 });
			this.singleSearchResult.genes = matches;
		},
	},
});
</script>

<style scoped>
/* alert UI */
#byor_single_search{
	border-radius: 10px;
	padding:25px;
}

.search-underlay {
    background: #f7f6f6;
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    z-index: 1000;
    opacity: .8;
	display: none;
}
.search-underlay-close-note {
    position: absolute;
    left: 50%;
    top: 75px;
    transform: translateX(-50%);
	display:none;
	font-size:12px;
}
.search-underlay.focus{
	display:block;
}
.byor-single-search-wrapper.focus{
	z-index:2000;

	.byor-single-search-results{
		display:block;
	}
	.byor-single-search-results-groups{
		display:flex;
	}
	.ss-summary-popup:not(.hidden){
		display:block;
	}
	.search-underlay-close-note{
		display:block;
	}
}

.reset-search {
	position: absolute;
	top: 50%;
    transform: translateY(-50%);
	right: 4px;
	color: #999999;
	font-size: 14px;
}

.reset-search:hover {
	color: #333333;
}

.ss-summary-hide{
	position: absolute;
	top: 4px;
	right: 4px;
}

.byor-single-search-wrapper {
	width: 100%;
	position: relative;
}

.byor-single-search {
	width: 100%;
	margin-left: auto;
	margin-right: auto;
}

.byor-single-search-results-wrapper {
	position: relative;
	margin-left: auto;
	margin-right: auto;
}

.byor-single-search-results {
	display:none;
	position: absolute;
	width: 100%;
	background-color: #fff;
	font-size: 14px;
	z-index: 100;
	padding: 10px 15px;
	border-radius: 0.25rem;
	box-shadow: 10px 10px 10px 10px rgba(0, 0, 0, 0.2);
	/*overflow-y: scroll;
	max-height: 500px;*/
	text-align: left;
	height: auto;
}

.byor-single-search-results-groups {
	display:none;
	justify-content: flex-start;
	gap:10px;
	position: absolute;
	min-width: 100%;
    width: auto;
    max-width: 90vw;
    transform: translateX(-50%);
    left: 50%;
	background-color: #f7f6f6;
	font-size: 14px;
	z-index: 100;
	padding: 10px;
	height: auto;
	border-radius: 10px;
}
.byor-ss-results-section {
	min-width: 100px;
    width: max-content;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    height: 300px;
    overflow-y: auto;
	background-color: white;
	padding: 10px;
	border-radius: 10px;
}
.byor-ss-results-section:only-child{
	width: -webkit-fill-available;
	max-width: unset;
}
.byor-ss-results-section-title{
	font-weight: bold;
	text-transform: uppercase;
	font-size: 14px;
}
.more-options {
    position: fixed;
    z-index: 1;
    margin: -5px 0 0;
}
div.single-search-option{
	color:#ff6600;
	cursor: default;
	padding: 0 2px;
}
div.single-search-option:hover{
	background:#ff6600;
	color: white;
	border-radius: 5px;
}
.single-search-option{
	padding-right:10px;
}
.single-search-option:hover {
	/*border-bottom: solid 2px #dddddd;
	margin-bottom: -2px;
	padding-right: 50px;*/
	border-bottom: 0;
	margin-bottom: 0;
}

.single-search-option .ss-options-wrapper {
	display: none;
	position: absolute;
	background-color: #fff;
	z-index: 101;
	border: solid 1px #dddddd;
	border-radius: 5px;
	white-space: nowrap;
	padding: 5px 15px;
	margin-left: 5px;
	box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.2);
}

.single-search-option:hover .ss-options-wrapper {
	display: inline-block;
}

.search-word-group {
	color: #cccccc;
	font-size: 12px;
	display: block;
	float: right;
	text-transform: capitalize;
}

.search-gene-link {
	position: relative;
}

.search-gene-link .gene-link-tip {
	display: none;
	position: absolute;
	text-decoration: none;
	white-space: nowrap;
	background-color: #00000099;
	color: #ffffff !important;
	font-size: 12px;
	padding: 0px 4px;
	border-radius: 5px;
	top: -3px;
	left: -220px;
}

.search-gene-link:hover .gene-link-tip {
	display: block;
}

.ss-summary-popup .summary-data-header {
	padding: 5px 0;
	display: inline-block;
}

.ss-summary-popup .summary-row {
	display: table-row;
	width: 100%;
	font-size: 14px !important;
}

.ss-summary-popup .summary-column {
	padding: 0 10px;
	border-right: solid 1px #dddddd;
	display: table-cell;
}

.ss-summary-popup .summary-column-header {
	padding: 0 10px;
	border-right: solid 1px #dddddd;
	display: table-cell;
	font-weight: bold;
}

.ss-summary-popup .summary-next-action {
	display: inline-block;
	padding: 3px 0px 0px 10px;
	font-weight: bold;
}


a.ss-generate-summary {
	color: #ff6600 !important;
}

.ss-summary-popup {
	text-align: left !important;
	position: fixed;
	bottom: 15px;
	right: 0px;
	width: auto;
	height: auto;
	max-height: 50%;
	padding: 15px;
	border: solid 1px #ddd;
	background-color: #fff;
	box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.2);
	z-index: 1000;
	overflow: auto;
	display:none;
}

.ss-summary-popup {
    text-align: left !important;
    position: absolute;
    top: 380px;
    bottom: unset;
    left: 50%;
    transform: translateX(-50%);
    min-width: 100%;
    width: max-content;
	max-width: 90vw;
    height: 500px;
    max-height: max-content;
    padding: 15px;
    background-color: #fff;
    box-shadow: none;
    border: none;
    border-radius: 10px;
    z-index: 1000;
    overflow-y: auto;
    display: none;
}

.ss-summary-popup .summary-content {

}

.ss-summary-popup.hidden {
	display: none;
}

.ss-summary-popup-btn {
	position: absolute;
	right: 0;
	top: -30px;
	font-size: 12px;
	background-color: #ffffff;
	padding: 2px 10px;
	border-radius: 15px;
}
</style>
