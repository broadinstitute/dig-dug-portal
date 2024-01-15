<template>
	<div>
		<div
			class="filtering-ui-wrapper search-criteria"
			id="searchCriteria"
			v-if="this.apiParameters != null"
		>
			<!--<div
				class="open-close-search-criteria"
				id="openCloseSearch"
				@click="showHideSearch()"
			>
				Close search
			</div>-->
			<h4 class="card-title">Build search criteria</h4>
			<div class="filtering-ui-content row">
				<div
					class="col"
					v-for="parameter in this.apiParameters.parameters"
					:key="parameter.parameter"
				>
					<div class="label">
						<span v-html="parameter.label"></span>
					</div>
					<template
						v-if="
							parameter.type == 'list' &&
							parameter.values.length <= 10
						"
					>
						<select
							:id="'search_param_' + parameter.parameter"
							class="custom-select custom-select-search"
							v-if="parameter.type == 'list'"
						>
							<template v-for="param in parameter.values">
								<option
									:value="param.trim()"
									v-html="
										getFileLabel(
											param.trim(),
											parameter.parameter
										)
									"
									:key="param.trim()"
								></option>
							</template>
						</select>
					</template>
					<template
						v-if="
							parameter.type == 'list' &&
							parameter.values.length > 10
						"
					>
						<!--<input
							v-model="paramSearch"
							:placeholder="getPlaceHolder(parameter.parameter)"
							class="form-control"
						/>-->
						<input v-model="paramSearch" class="form-control" />

						<select
							:id="'search_param_' + parameter.parameter"
							:class="
								'custom-select custom-select-search long-list ' +
								getVisibleValues(
									parameter.values,
									paramSearch,
									parameter.parameter
								)
							"
							:size="
								parameter.values.length > 10
									? paramSearch.length > 2
										? 5
										: 1
									: 'auto'
							"
							:style="
								parameter.values.length > 10 &&
								paramSearch.length <= 2
									? 'display:none !important;'
									: ''
							"
							v-if="parameter.type == 'list'"
							@change="
								updateSearchInputByEvent(
									$event,
									parameter.parameter
								)
							"
						>
							<option
								v-for="param in parameter.values"
								:value="param.trim()"
								v-html="
									getFileLabel(
										param.trim(),
										parameter.parameter
									)
								"
								:key="param.trim()"
								:class="
									parameter.values.length > 10 &&
									paramSearch.length > 2 &&
									!getFileLabel(
										param.trim(),
										parameter.parameter
									)
										.toLowerCase()
										.includes(paramSearch.toLowerCase())
										? 'hidden'
										: ''
								"
							></option>
						</select>
					</template>
					<div>
						<div
							v-if="
								parameter.type == 'input' &&
								parameter.values == 'kp genes'
							"
							id="kp_gene_search_wrapper"
							:style="
								!!parameter['expand region']
									? 'display: inline-block;'
									: ''
							"
						>
							<!--<input
							v-model="geneSearch"
							:placeholder="getPlaceHolder(parameter.parameter)"
							class="form-control"
							@keyup="getGenes($event)"
							:id="'search_param_' + parameter.parameter"
						/>-->

							<input
								v-model="geneSearch"
								class="form-control"
								@keyup="getGenes($event)"
								:id="'search_param_' + parameter.parameter"
							/>

							<div
								class="custom-select custom-select-search"
								:size="kpGenes.length >= 5 ? 5 : 'auto'"
								:style="
									kpGenes.length == 0
										? 'display:none !important;'
										: ''
								"
							>
								<template v-for="gene in kpGenes">
									<a
										href="javascript:;"
										v-html="gene"
										:key="gene"
										@click="
											parameter['convert to region'] &&
											parameter['convert to region'] ==
												'true'
												? getRegion(
														gene,
														parameter.parameter,
														parameter['expand region by']
												  )
												: setGene(gene)
										"
										class="custom-select-a-option"
									></a>
								</template>
							</div>
						</div>
						<!-- -->
						<div
							v-if="!!parameter['expand region']"
							class="expand-region"
						>
							<select
								id="region_expander"
								class="expand-region-select-byor"
								@change="expandRegion($event, parameter)"
							>
								<option selected="selected" value="null">
									Expand region by:
								</option>
								<option value="50000">± 50 kb</option>
								<option value="100000">± 100 kb</option>
								<option value="150000">± 150 kb</option>
							</select>
							<span class="tip-wrapper">
								<b-icon
									class="tip-bigger warning"
									icon="exclamation-circle-fill"
								></b-icon>
								<div class="tip-content">
									This feature is in test! Expanding region
									will refresh the page as a new search with
									the last search parameters and the expanded
									region. All filters and previously loaded
									data will be removed.
								</div>
							</span>
						</div>
						<!-- -->
					</div>
					<!--<input
						v-if="
							parameter.type == 'input' &&
							parameter.values != 'kp genes'
						"
						type="text"
						:placeholder="getPlaceHolder(parameter.parameter)"
						class="form-control"
						:id="'search_param_' + parameter.parameter"
					/>-->
					<input
						v-if="
							parameter.type == 'input' &&
							parameter.values != 'kp genes'
						"
						type="text"
						class="form-control"
						:id="'search_param_' + parameter.parameter"
					/>
				</div>

				<div
					class="col"
					v-if="!!this.dataset && dataComparisonConfig != null"
				>
					<div class="label" v-html="'Compare data'"></div>
					<select id="ifMergeData" class="custom-select">
						<option value="newSearch" selected>New search</option>
						<option value="overlapping">Only overlapping</option>
						<option value="all">All</option>
					</select>
				</div>
				<div class="col">
					<div @click="queryAPI()" class="btn btn-sm btn-primary">
						Search
					</div>
				</div>
				<!--<div class="col">
					<div
						v-for="(value, name, index) in this.searchParamsIndex"
						:class="'search-field f-' + index"
						:key="name"
					>
						<b-badge
							pill
							v-if="value.search.length > 0"
							v-for="(v, i) in value.search.filter(
								(v, i, arr) => arr.indexOf(v) == i
							)"
							:key="v"
							:class="'btn search-bubble ' + i"
							@click="removeSearch(value.field, i)"
							v-html="v"
						></b-badge>
					</div>
					<b-badge
						v-if="this.numberOfSearchParams() > 1"
						class="badge badge-secondary badge-pill btn search-bubble clear-all-filters-bubble"
						@click="removeAllSearchParams()"
					>
						Clear all filters
					</b-badge>
				</div>-->
			</div>
		</div>

		<div
			class="filtering-ui-wrapper search-criteria"
			id="searchCriteria"
			v-if="!!this.dataFiles && this.dataFiles.length > 1"
		>
			<!--<div
				class="open-close-search-criteria"
				id="openCloseSearch"
				@click="showHideSearch()"
			>
				Close search
			</div>-->
			<h4 class="card-title">Select data</h4>
			<div class="filtering-ui-content row">
				<div class="col">
					<select
						id="dataFiles"
						@change="switchData($event)"
						class="custom-select"
					>
						<option
							v-for="file in this.dataFiles"
							:value="file.trim()"
							v-html="getFileLabel(file.trim())"
							:key="file.trim()"
						></option>
					</select>
				</div>
			</div>
		</div>
		<div
			class="filtering-ui-wrapper"
			v-if="
				(!!this.dataset && !!this.filters && this.filters.length > 0) ||
				(!!this.dataFiles && this.dataFiles.length > 1)
			"
		>
			<h4 class="card-title filter">Filter data</h4>
			<div class="filtering-ui-content row">
				<div
					:class="getFilterWidthClasses()"
					v-for="filter in this.filters"
					:key="filter.field"
				>
					<div class="label" v-html="filter.label"></div>
					<template v-if="filter.type == 'search'">
						<input
							v-if="
								!!filter.features &&
								!!filter.features.includes('autocomplete')
							"
							type="text"
							class="form-control"
							:id="'filter_' + getColumnId(filter.field)"
							@input="buildSuggestions($event, filter.field)"
						/>
						<input
							v-if="
								!filter.features ||
								(!!filter.features &&
									!filter.features.includes('autocomplete'))
							"
							type="text"
							class="form-control"
							:id="'filter_' + getColumnId(filter.field)"
							@change="
								filterData($event, filter.field, filter.type)
							"
						/>
						<div
							v-if="
								!!filter.features &&
								!!filter.features.includes('autocomplete')
							"
							class="autocomplete-options"
						>
							<ul>
								<template
									v-for="suggestion in suggestions.suggestions"
									v-if="
										suggestions.field == filter.field &&
										suggestions.suggestions.length > 0
									"
								>
									<li
										@click="
											filterData(
												$event,
												filter.field,
												filter.type,
												'',
												suggestion
											)
										"
										v-html="suggestion"
										:title="suggestion"
									></li>
								</template>
							</ul>
						</div>
					</template>
					<template
						v-if="
							filter.type == 'search exact' ||
							filter.type == 'search greater than' ||
							filter.type == 'search lower than' ||
							filter.type == 'search or' ||
							filter.type == 'search and'
						"
					>
						<input
							type="text"
							class="form-control"
							:id="'filter_' + getColumnId(filter.field)"
							@change="
								filterData($event, filter.field, filter.type)
							"
						/>
					</template>
					<template v-if="filter.type == 'search change direction'">
						<select
							class="egl-filter-direction"
							:id="
								'filter_' +
								getColumnId(filter.field) +
								'_direction'
							"
						>
							<option value="lt" selected="selected">
								&lt;&equals;
							</option>
							<option value="gt">&gt;&equals;</option>
						</select>
						<input
							type="text"
							class="form-control egl-filter-cd-input"
							:id="'filter_' + getColumnId(filter.field)"
							@change="
								filterData($event, filter.field, filter.type)
							"
						/>
					</template>
					<template v-else-if="filter.type == 'dropdown'">
						<select
							:id="'filter_' + getColumnId(filter.field)"
							@change="
								filterData(
									$event,
									filter.field,
									filter.type,
									filter.dataType
								)
							"
							class="custom-select"
						>
							<option></option>
							<option
								v-for="value in buildOptions(filter.field)"
								:key="value"
								:value="value"
							>
								{{ value }}
							</option>
						</select>
					</template>
				</div>
			</div>
		</div>
		<b-container class="search-fields-wrapper" v-if="this.dataset != null">
			<div
				v-for="(value, name, index) in this.filtersIndex"
				:class="'search-field f-' + index"
				:key="name"
			>
				<b-badge
					pill
					v-if="value.search.length > 0"
					v-for="(v, i) in value.search.filter(
						(v, i, arr) => arr.indexOf(v) == i
					)"
					:key="v"
					:class="'btn search-bubble ' + i"
					@click="removeFilter(value.field, i)"
					v-html="
						value['label in bubble'] == true
							? value.field +
							  ': ' +
							  v +
							  '&nbsp;<span class=\'remove\'>X</span>'
							: v + '&nbsp;<span class=\'remove\'>X</span>'
					"
				></b-badge>
			</div>
			<b-badge
				v-if="this.numberOfSearches() > 1"
				class="badge badge-secondary badge-pill btn search-bubble clear-all-filters-bubble"
				@click="removeAllFilters()"
			>
				Clear all search
			</b-badge>
		</b-container>
	</div>
</template>

<script>
import Vue from "vue";

//import alertUtils from "@/utils/alertUtils";

export default Vue.component("research-page-filters", {
	props: [
		"apiParameters",
		"dataComparisonConfig",
		"dataFiles",
		"dataType",
		"isAPI",
		"filesListLabels",
		"uid",
		"filters",
		"filterWidth",
		"dataset",
		"unfilteredDataset",
		'utils'
	],

	data() {
		return {
			filtersIndex: {},
			searchParamsIndex: {},
			paramSearch: "",
			geneSearch: "",
			kpGenes: [],
			lastFilter: { field: null, value: null },
			suggestions: { field: null, suggestions: [] },
			searchBySuggest: false,
		};
	},
	created() {
		let configFilterFields = this.filters;

		if (configFilterFields != undefined) {
			configFilterFields.map((f) => {
				let tempObj = {};
				tempObj["type"] = f.type;
				tempObj["field"] = f.field;
				tempObj["search"] = [];
				tempObj["label in bubble"] =
					!!f["label in bubble"] && f["label in bubble"] == "true"
						? true
						: false;
				this.filtersIndex[f.field] = tempObj;
			});
		}

		let configSearchParams = this.apiParameters;

		if (configSearchParams != null) {
			configSearchParams.parameters.map((p) => {
				let tempObj = {};
				tempObj["type"] = p.type;
				tempObj["field"] = p.parameter;
				tempObj["search"] = [];
				this.searchParamsIndex[p.parameter] = tempObj;
			});
		}

		if (!!this.dataFiles && this.dataFiles.length > 1) {
			let tempObj = {};
			tempObj["type"] = "list";
			tempObj["field"] = "dataFiles";
			tempObj["search"] = [];
			this.searchParamsIndex["dataFiles"] = tempObj;
		}
		this.$store.dispatch("searchParameters", this.searchParamsIndex);
	},
	mounted() {
		if (
			this.apiParameters != null &&
			this.apiParameters.query.type == "array"
		) {
			let parametersArr = this.apiParameters.query.format;
			let paramsSet = {};

			parametersArr.map((param, index) => {
				if (this.utils.keyParams[param] != undefined) {
					let pType = this.apiParameters.parameters.filter(
						(p) => p.parameter == param
					)[0].type;

					let valuesExist =
						!!this.apiParameters.rawConfig.parameters.filter(
							(p) => p.parameter == param
						)[0].values
							? true
							: false;

					let ifValuesFromKP = !!valuesExist
						? this.apiParameters.rawConfig.parameters
								.filter((p) => p.parameter == param)[0]
								.values.includes("kp")
						: null;

					if (pType != "list" && !!ifValuesFromKP) {
						this.geneSearch = this.utils.keyParams[param];
					} else if (pType == "list" && !!ifValuesFromKP) {
						let label;

						console.log("0", this.filesListLabels);
						console.log(
							"1",
							this.filesListLabels[this.utils.keyParams[param].trim()]
						);
						console.log("2", this.filesListLabels[param]);

						if (!!this.filesListLabels[this.utils.keyParams[param].trim()]) {
							label =
								this.filesListLabels[this.utils.keyParams[param].trim()];
						} else if (
							this.filesListLabels[param][this.utils.keyParams[param].trim()]
						) {
							label =
								this.filesListLabels[param][
									this.utils.keyParams[param].trim()
								];
						} else {
							label = this.utils.keyParams[param].trim();
						}

						let labelContent = label + "(" + this.utils.keyParams[param] + ")";

						this.paramSearch = labelContent;
						document.getElementById("search_param_" + param).value =
							this.utils.keyParams[param];
					} else {
						document.getElementById("search_param_" + param).value =
							this.utils.keyParams[param];
					}

					this.searchParamsIndex[param].search.push(this.utils.keyParams[param]);
					this.$store.dispatch(
						"searchParameters",
						this.searchParamsIndex
					);

					paramsSet[param] = this.utils.keyParams[param];
				}
			});

			if (Object.keys(paramsSet).length > 0) {
				this.$store.dispatch("searchParametersArr", {
					data: paramsSet,
					action: "add",
				});
			}
		}
	},
	computed: {},
	watch: {},
	methods: {
		//...uiUtils,
		buildSuggestions(EVENT, FIELD) {
			let searchVal = EVENT.target.value;
			let suggestions = [];

			if (searchVal.length >= 2) {
				let searchTerms = searchVal.split(" ");

				let comparingFields =
					this.dataComparisonConfig != null
						? this.dataComparisonConfig["fields to compare"]
						: null;
				let targetData = this.unfilteredDataset;

				if (comparingFields == null) {
					targetData.map((d) => {
						let matching = 0;
						if (!!d[FIELD]) {
							searchTerms.map((s) => {
								matching += !!d[FIELD].toLowerCase().includes(
									s.toLowerCase()
								)
									? 1
									: 0;
							});
							if (
								matching == searchTerms.length &&
								!suggestions.includes(d[FIELD])
							) {
								suggestions.push(d[FIELD]);
							}
						}
					});
				} else {
					for (let rowKey in targetData) {
						let row = targetData[rowKey];
						if (!!row[FIELD] && row[FIELD] != undefined) {
							for (let fieldKey in row[FIELD]) {
								if (!!row[FIELD] && !!row[FIELD][fieldKey]) {
									let matching = 0;
									searchTerms.map((s) => {
										matching += !!row[FIELD][fieldKey]
											.toLowerCase()
											.includes(s.toLowerCase())
											? 1
											: 0;
									});
									if (
										matching == searchTerms.length &&
										!suggestions.includes(
											row[FIELD][fieldKey]
										)
									) {
										suggestions.push(row[FIELD][fieldKey]);
									}
								}
							}
						}
					}
				}
			}

			if (suggestions.length > 0) {
				this.suggestions.field = FIELD;
				this.suggestions.suggestions = suggestions.sort();
			} else {
				this.suggestions.field = null;
				this.suggestions.suggestions = [];
			}
		},
		getColumnId(LABEL) {
			return LABEL.replace(/\W/g, "").toLowerCase();
		},
		resetAll() {
			this.$store.state.pkgData = {};
			this.$store.state.pkgDataSelected = [];
		},
		expandRegion(EVENT, PARAM) {
			let expandNumber = EVENT.target.value;

			if (EVENT.target.value != "null") {
				let currentRegion = document
					.getElementById("search_param_" + PARAM.parameter)
					.value.split(":");
				let chr = currentRegion[0];
				let region = currentRegion[1].split("-");
				let regionStart =
					Number(region[0]) - Number(expandNumber) <= 0
						? 0
						: Number(region[0]) - Number(expandNumber);

				let regionEnd = Number(region[1]) + Number(expandNumber);

				let newRegion = chr + ":" + regionStart + "-" + regionEnd;

				///!!! Leave commented alone. This part has to be revisited to fully support region expand.
				/*document.getElementById(
					"search_param_" + PARAM.parameter
				).value = newRegion;
				this.geneSearch = newRegion;*/

				let url = new URL(window.location);
				//for (const [key, value] of Object.entries(key2Update)) {
				url.searchParams.set(PARAM.parameter, newRegion);

				window.history.pushState(null, "", url.toString());

				let newUrl = new URL(window.location);

				window.location.href = newUrl;

				/*if (!!this.dataComparisonConfig) {
					document.getElementById("ifMergeData").value = "newSearch";
				}*/
				//this.queryAPI();
			}
		},

		showHideElement(ELEMENT) {
			this.utils.uiUtils.showHideElement(ELEMENT);
		},

		getVisibleValues(VALUES, SEARCH, PARAMETER) {
			var numOfVisible = 0;

			VALUES.map((v) => {
				if (
					!!this.getFileLabel(v.trim(), PARAMETER)
						.toLowerCase()
						.includes(SEARCH.toLowerCase())
				) {
					numOfVisible++;
				}
			});

			numOfVisible = numOfVisible == 0 ? "hidden" : "";
			return numOfVisible;
		},
		setGene(GENE) {
			this.geneSearch = GENE;
			this.kpGenes = [];
		},

		async getRegion(KEY, PARAM, DEFALT_EXPAND) {
			let searchPoint =
				this.utils.uiUtils.biDomain() + "/api/bio/query/gene?q=" + KEY;

			let regionExpand = !!DEFALT_EXPAND ? DEFALT_EXPAND / 2 : 0;

			var geneJson = await fetch(searchPoint).then((resp) => resp.json());

			if (geneJson.error == null) {
				let region =
					geneJson.data[0].chromosome +
					":" +
					(Number(geneJson.data[0].start) - regionExpand) +
					"-" +
					(Number(geneJson.data[0].end) + regionExpand);

				this.geneSearch = region;
				this.kpGenes = [];
			}
			/*
			if (geneJson.error == null) {
					let region =
						geneJson.data[0].chromosome +
						":" +
						(Number(geneJson.data[0].start) - regionExpand) +
						"-" +
						(Number(geneJson.data[0].end) + regionExpand);

					this.paramSearch[INDEX] = region;
					this.searchingValues[PARAMETER] = region;
				}
			*/
		},
		async getGenes(EVENT) {
			if (EVENT.target.value.length > 2) {
				let searchPoint =
					this.utils.uiUtils.biDomain() +
					"/api/bio/match/gene?q=" +
					EVENT.target.value;

				var geneJson = await fetch(searchPoint).then((resp) =>
					resp.json()
				);

				if (geneJson.error == null) {
					this.kpGenes = geneJson.data;
				}
			}
		},
		emptySearchInput(ID) {},
		showHideSearch() {
			let searchUIWrapper = document.getElementById("searchCriteria");
			let searchUIHandle = document.getElementById("openCloseSearch");
			if (searchUIWrapper.classList.contains("closed")) {
				searchUIWrapper.classList.remove("closed");
				searchUIHandle.innerText = "Close search";
			} else {
				searchUIWrapper.classList.add("closed");
				searchUIHandle.innerText = "Open search";
			}
		},
		getLength(ARR) {
			return Number(ARR.length);
		},
		getFilterWidthClasses() {
			let classes =
				!!this.filterWidth && this.filterWidth != null
					? "col filter-col-" + this.filterWidth
					: "col";
			return classes;
		},
		getFileLabel(file, PARAMETER) {
			if (
				this.filesListLabels[PARAMETER] &&
				this.filesListLabels[PARAMETER][file]
			) {
				return this.filesListLabels[PARAMETER][file];
			} else if (this.filesListLabels[file]) {
				return this.filesListLabels[file];
			} else {
				return file;
			}
		},
		setDataComparison() {
			let ifCompareData = !!document.getElementById("ifMergeData")
				? document.getElementById("ifMergeData").value
				: "newSearch";

			this.$store.dispatch("dataComparison", ifCompareData);
		},
		queryAPI() {
			//this.showHideSearch();
			this.utils.uiUtils.showElement("data-loading-indicator");

			for (const FIELD in this.filtersIndex) {
				this.filtersIndex[FIELD].search = [];
			}
			this.$store.state.initialSearch = 0;
			this.$store.state.bioIndexContinue = [];

			this.$store.dispatch("hugeampkpncms/cancelResearchData");
			this.setDataComparison();

			let regionFromVariant = null;

			if (this.dataType == "bioindex") {
				/// set store.searchingPhenotype if searching BioIndex
				if (
					this.apiParameters.query.format.includes("phenotype") ==
					true
				) {
					let phenotype = document.getElementById(
						"search_param_phenotype"
					).value;

					this.$store.dispatch("searchingPhenotype", phenotype);
				}

				///This part is for a case of the region being a variant
				if (
					this.apiParameters.query.format.includes("region") ==
						true &&
					!!this.testLetters(
						document.getElementById("search_param_region").value
					)
				) {
					let currentRegion = document
						.getElementById("search_param_region")
						.value.split(":");

					let chr = currentRegion[0];
					let pos = currentRegion[1].replace(/\D/g, "");

					let regionStart = Number(pos) - 1;
					let regionEnd = Number(pos) + 1;
					let newRegion = chr + ":" + regionStart + "-" + regionEnd;

					regionFromVariant = newRegion;

					document.getElementById("search_param_region").value =
						newRegion;
				}
			}

			let paramsSet = {};

			let queryParams = "";
			if (this.apiParameters.query.type == "array") {
				let parametersArr = this.apiParameters.query.format;
				// key2Update to update the url in case of new search
				let key2Update = {};

				parametersArr.map((param, index) => {
					let queryParamValue = document.getElementById(
						"search_param_" + param
					).value;

					if (queryParamValue != "noValue") {
						queryParams += queryParamValue;

						if (index + 1 < parametersArr.length) {
							queryParams += ",";
						}
					} else {
						if (queryParams[queryParams.length - 1] == ",") {
							let newQP = queryParams.slice(0, -1);
							queryParams = newQP;
						}
					}

					// add to search parameters index
					if (this.$store.state.dataComparison == "newSearch") {
						//reset pkgData and selected filters
						this.resetAll();
						this.searchParamsIndex[param].search = [];
						let sValue = document.getElementById(
							"search_param_" + param
						).value;
						this.searchParamsIndex[param].search.push(sValue);
						key2Update[param] = sValue;
						if (!!this.$store.state.pkgDataSelected.length > 0) {
							this.$store.state.pkgDataSelected = [];
							this.$store.state.pkgData = {};
						}
					} else {
						this.searchParamsIndex[param].search.push(
							document.getElementById("search_param_" + param)
								.value
						);
					}

					paramsSet[param] = document.getElementById(
						"search_param_" + param
					).value;

					this.$store.dispatch(
						"searchParameters",
						this.searchParamsIndex
					);
				});

				if (Object.keys(key2Update).length > 0) {
					const url = new URL(window.location);
					for (const [key, value] of Object.entries(key2Update)) {
						url.searchParams.set(key, value);
					}

					window.history.pushState(null, "", url.toString());
				}
			} else if (this.apiParameters.query.type == "parameters") {
				queryParams += "?";
				let parametersArr = this.apiParameters.parameters;
				//let qParameters = {}

				parametersArr.map((p) => {
					//
					let queryParamValue = document.getElementById(
						"search_param_" + p.parameter
					).value;

					queryParams += p.parameter + "=" + queryParamValue + "&";
				});
			}

			if (Object.keys(paramsSet).length > 0) {
				if (this.$store.state.dataComparison == "newSearch") {
					this.$store.dispatch("searchParametersArr", {
						data: paramsSet,
						action: "reset",
					});
				} else {
					this.$store.dispatch("searchParametersArr", {
						data: paramsSet,
						action: "add",
					});
				}
			}

			if (!!regionFromVariant) {
				let url = new URL(window.location);
				window.location.href = url;
			}

			let APIPoint = this.dataFiles[0];

			if (this.dataType == "bioindex" && !!this.isAPI) {
				/// set BioIndex API point
				APIPoint +=
					"query/" +
					this.apiParameters.query.index +
					"?q=" +
					queryParams;
			} else if (this.dataType != "bioindex" && !!this.isAPI) {
				APIPoint += queryParams;
			}

			let fetchParam = { dataPoint: APIPoint, domain: "external" };

			this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);
		},
		/// test if string contains letters
		testLetters(STR) {
			return /[a-zA-Z]/.test(STR);
		},
		updateSearchInputByEvent(event, PARAMETER) {
			var label = this.getFileLabel(event.target.value.trim(), PARAMETER);

			this.paramSearch = label + "(" + event.target.value + ")";
		},
		updateSearchInput(VALUE) {
			var label = this.getFileLabel(VALUE.trim());

			this.paramSearch = label + "(" + VALUE + ")";
		},
		switchData(event) {
			this.utils.uiUtils.showElement("data-loading-indicator");

			for (const FIELD in this.filtersIndex) {
				this.filtersIndex[FIELD].search = [];
			}

			let initialData = event.target.value;

			let dataPoint =
				initialData.includes("http://") ||
				initialData.includes("https://")
					? initialData
					: "https://hugeampkpncms.org/sites/default/files/users/user" +
					  this.uid +
					  "/" +
					  initialData;

			let domain =
				initialData.includes("http://") ||
				initialData.includes("https://")
					? "external"
					: "hugeampkpn";

			let fetchParam = { dataPoint: dataPoint, domain: domain };

			this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);
		},
		numberOfSearches() {
			let numberOfBubbles = 0;
			for (const FIELD in this.filtersIndex) {
				numberOfBubbles += this.filtersIndex[FIELD].search.length;
			}

			return numberOfBubbles;
		},
		numberOfSearchParams() {},
		buildOptions(field) {
			if (this.dataComparisonConfig == null) {
				let options = this.dataset
					.map((v) => v[field])
					.filter((v, i, arr) => arr.indexOf(v) == i) //unique
					.filter((v, i, arr) => v != ""); //remove blank
				return options.sort();
			} else {
				let options = [];

				for (const [key, value] of Object.entries(this.dataset)) {
					if (
						typeof value[field] === "object" &&
						value[field] !== null &&
						!Array.isArray(value[field])
					) {
						for (const [iKey, iValue] of Object.entries(
							value[field]
						)) {
							options.push(iValue);
						}
					} else {
						options.push(value[field]);
					}
				}

				let unqOptions = options
					.filter((v, i, arr) => arr.indexOf(v) == i) //unique
					.filter((v, i, arr) => v != ""); //remove blank

				return unqOptions.sort();
			}
		},

		filterData(EVENT, FIELD, TYPE, DATATYPE, SUGGESTED) {
			let searchValue = !!SUGGESTED
				? SUGGESTED
				: document.getElementById("filter_" + this.getColumnId(FIELD))
						.value; //EVENT.target.value;

			let id = "#filter_" + this.getColumnId(FIELD);
			let inputField = document.querySelector(id);
			inputField.blur();
			inputField.value = "";

			if (!!searchValue && searchValue != "") {
				///Record the last filtering item

				this.lastFilter = { field: FIELD, value: searchValue };

				if (TYPE == "search" || TYPE == "search exact") {
					let searchTerms = searchValue.split(",");

					searchTerms.map((searchTerm) => {
						this.filtersIndex[FIELD]["search"].push(
							searchTerm.trim()
						);

						this.filtersIndex[FIELD]["search"] = this.filtersIndex[
							FIELD
						]["search"].filter((v, i, arr) => arr.indexOf(v) == i);
					});

					if (!!SUGGESTED) {
						this.suggestions = { field: null, suggestions: [] }; // reset suggestions.
					}
				} else if (
					TYPE == "search greater than" ||
					TYPE == "search lower than" ||
					TYPE == "search or" ||
					TYPE == "search and"
				) {
					this.filtersIndex[FIELD]["search"] = [searchValue];
				} else {
					if (DATATYPE == "number") {
						this.filtersIndex[FIELD]["search"].push(
							Number(searchValue)
						);
					} else {
						this.filtersIndex[FIELD]["search"].push(searchValue);
					}
				}

				this.applyFilters();
			}
		},
		applyFilters() {
			let comparingFields =
				this.dataComparisonConfig != null
					? this.dataComparisonConfig["fields to compare"]
					: null;
			let filtered = this.unfilteredDataset;
			let tempFiltered = comparingFields == null ? [] : {};
			let i = 0;

			for (var f in this.filtersIndex) {
				let searchIndex = this.filtersIndex[f];

				if (searchIndex.search.length > 0) {
					searchIndex.search
						.filter((v, i, arr) => arr.indexOf(v) == i)
						.map((s) => {
							let targetData = filtered;
							let search = s;
							let searchVals;

							if (comparingFields == null) {
								targetData.filter((row) => {
									if (
										!!row[searchIndex.field] &&
										row[searchIndex.field] != undefined
									) {
										let typeofValue, isNumber, numValue, stringValue;

										typeofValue = typeof row[searchIndex.field];
										isNumber = this.utils.uiUtils.checkIfNumeric(row[searchIndex.field]);

										if(searchIndex.type == "search greater than" || searchIndex.type == "search lower than" || 
										searchIndex.type == "search or" || searchIndex.type == "search and") {

											numValue = (typeofValue == "string" && !!isNumber) ? Number(row[searchIndex.field])
												: (typeofValue == "number") ? row[searchIndex.field] : 'wrong value';
										} else {
											
											search = (typeof search == 'number')? search.toString(): search;
											
											stringValue = (typeofValue == "number" && !!isNumber) ? row[searchIndex.field].toString()
												: (typeofValue == "string") ? row[searchIndex.field] : 'wrong value';
										}

										switch (searchIndex.type) {
											case "dropdown":
												search === stringValue
													? tempFiltered.push(row)
													: "";

												break;
											case "search":
												stringValue
													.toLowerCase()
													.includes(
														search.toLowerCase()
													)
													? tempFiltered.push(row)
													: "";
												break;
											case "search exact":
												search.toLowerCase() ===
												stringValue
													.toString()
													.toLowerCase()
													? tempFiltered.push(row)
													: "";

												break;
											case "dropdown word":
												stringValue
													.toLowerCase()
													.includes(
														search.toLowerCase()
													)
													? tempFiltered.push(row)
													: "";

												break;

											case "search greater than":
												if (numValue != 'wrong value' && numValue >= search) {
													tempFiltered.push(row);
												}
												
												break;
											case "search lower than":
												if(numValue != 'wrong value' && numValue <= search) {
													tempFiltered.push(row);
												}
												break;
											case "search or":
												searchVals = search.split(",");

												if(numValue != 'wrong value' && (numValue <= Number(searchVals[0].trim()) || numValue >= Number(searchVals[1].trim()))){
													tempFiltered.push(row)
												}
												break;
											case "search change direction":
												let searchDirection =
													document.getElementById(
														"filter_" +
															this.getColumnId(
																searchIndex.field
															) +
															"_direction"
													).value;

												searchDirection == "lt"
													? row[searchIndex.field] <=
													  search
														? tempFiltered.push(row)
														: ""
													: searchDirection == "gt"
													? row[searchIndex.field] >=
													  search
														? tempFiltered.push(row)
														: ""
													: "";

												break;

											case "search and":
												searchVals = search.split(",");

												if (numValue != 'wrong value' && (numValue >= Number(searchVals[0].trim()) && numValue <= Number(searchVals[1].trim()))) {
													tempFiltered.push(row)
												}
												break;
										}
									}
								});
							} else {
								for (let rowNum in targetData) {
									let row = targetData[rowNum];
									if (
										!!row[searchIndex.field] &&
										row[searchIndex.field] != undefined
									) {
										if (
											searchIndex.type == "dropdown" ||
											searchIndex.type == "search exact"
										) {
											if (
												comparingFields.includes(
													searchIndex.field
												) == true
											) {
												let meetSearch = false;
												for (let cellNum in row[
													searchIndex.field
												]) {
													if (
														search.toLowerCase() ===
														row[searchIndex.field][
															cellNum
														]
															.toString()
															.toLowerCase()
													) {
														meetSearch = true;
													}
												}
												if (meetSearch == true) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											} else {
												if (
													search ===
													row[
														searchIndex.field
													].toString()
												) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											}
										} else if (
											searchIndex.type == "search" ||
											searchIndex.type == "dropdown word"
										) {
											
											if (
												comparingFields.includes(
													searchIndex.field
												) == true
											) {
												let meetSearch = false;
												for (var cellNum in row[
													searchIndex.field
												]) {
													if (
														!!row[
															searchIndex.field
														][cellNum] &&
														row[searchIndex.field][
															cellNum
														]
															.toLowerCase()
															.includes(
																search.toLowerCase()
															)
													) {
														meetSearch = true;
													}
												}
												if (meetSearch == true) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											} else {
												if (
													!!row[searchIndex.field] &&
													row[searchIndex.field]
														.toLowerCase()
														.includes(
															search.toLowerCase()
														)
												) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											}
											//}
										} else if (
											searchIndex.type ==
											"search greater than"
										) {
											//for (var rowNum in targetData) {
											//let row = targetData[rowNum];
											if (
												comparingFields.includes(
													searchIndex.field
												) == true
											) {
												let meetSearch = false;
												for (var cellNum in row[
													searchIndex.field
												]) {
													if (
														typeof row[searchIndex.field][
															cellNum
														] == "number" && row[searchIndex.field][
															cellNum
														] >= search
													) {
														meetSearch = true;
													}
												}
												if (meetSearch == true) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											} else {
												if (
													typeof row[searchIndex.field] == "number" && row[searchIndex.field] >=
													search
												) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											}
											//}
										} else if (
											searchIndex.type ==
											"search lower than"
										) {
											//for (var rowNum in targetData) {
											//let row = targetData[rowNum];
											if (
												comparingFields.includes(
													searchIndex.field
												) == true
											) {
												let meetSearch = false;
												for (var cellNum in row[
													searchIndex.field
												]) {
													if (
														typeof row[searchIndex.field][
															cellNum
														] == "number" && row[searchIndex.field][
															cellNum
														] <= search
													) {
														meetSearch = true;
													}
												}
												if (meetSearch == true) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											} else {
												if (
													typeof row[searchIndex.field] == "number" && row[searchIndex.field] <=
													search
												) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											}
											//}
										} else if (
											searchIndex.type == "search or"
										) {
											let searchVals = search.split(",");
											//for (var rowNum in targetData) {
											//let row = targetData[rowNum];
											if (
												comparingFields.includes(
													searchIndex.field
												) == true
											) {
												let meetSearch = false;
												for (var cellNum in row[
													searchIndex.field
												]) {
													if (
														typeof row[searchIndex.field][
															cellNum
														] == "number" && (row[searchIndex.field][
															cellNum
														] <=
															searchVals[0].trim() ||
														row[searchIndex.field][
															cellNum
														] >=
															searchVals[1].trim())
													) {
														meetSearch = true;
													}
												}
												if (meetSearch == true) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											} else {
												if (
													typeof row[searchIndex.field] == "number" && (row[searchIndex.field] <=
														searchVals[0].trim() ||
													row[searchIndex.field] >=
														searchVals[1].trim())
												) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											}
											//}
										} else if (
											searchIndex.type ==
											"search change direction"
										) {
											let searchDirection =
												document.getElementById(
													"filter_" +
														this.getColumnId(
															searchIndex.field
														) +
														"_direction"
												).value;

											if (searchDirection == "lt") {
												//for (var rowNum in targetData) {
												//let row = targetData[rowNum];
												if (
													comparingFields.includes(
														searchIndex.field
													) == true
												) {
													let meetSearch = false;
													for (var cellNum in row[
														searchIndex.field
													]) {
														if (
															row[
																searchIndex
																	.field
															][cellNum] <= search
														) {
															meetSearch = true;
														}
													}
													if (meetSearch == true) {
														tempFiltered[
															row[
																this.dataComparisonConfig[
																	"key field"
																]
															]
														] = row;
													}
												} else {
													if (
														row[
															searchIndex.field
														] <= search
													) {
														tempFiltered[
															row[
																this.dataComparisonConfig[
																	"key field"
																]
															]
														] = row;
													}
												}
												//}
											} else if (
												searchDirection == "gt"
											) {
												//for (var rowNum in targetData) {
												//let row = targetData[rowNum];
												if (
													comparingFields.includes(
														searchIndex.field
													) == true
												) {
													let meetSearch = false;
													for (var cellNum in row[
														searchIndex.field
													]) {
														if (
															row[
																searchIndex
																	.field
															][cellNum] >= search
														) {
															meetSearch = true;
														}
													}
													if (meetSearch == true) {
														tempFiltered[
															row[
																this.dataComparisonConfig[
																	"key field"
																]
															]
														] = row;
													}
												} else {
													if (
														row[
															searchIndex.field
														] >= search
													) {
														tempFiltered[
															row[
																this.dataComparisonConfig[
																	"key field"
																]
															]
														] = row;
													}
												}
												//}
											}
										} else if (
											searchIndex.type == "search and"
										) {
											let searchVals = search.split(",");
											//for (var rowNum in targetData) {
											//let row = targetData[rowNum];
											if (
												comparingFields.includes(
													searchIndex.field
												) == true
											) {
												let meetSearch = false;
												for (var cellNum in row[
													searchIndex.field
												]) {
													if (
														typeof row[searchIndex.field][
															cellNum
														] == "number" && (row[searchIndex.field][
															cellNum
														] >=
															searchVals[0].trim() &&
														row[searchIndex.field][
															cellNum
														] <=
															searchVals[1].trim())
													) {
														meetSearch = true;
													}
												}
												if (meetSearch == true) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											} else {
												if (
													typeof row[searchIndex.field] == "number" && (row[searchIndex.field] <=
														searchVals[0].trim() ||
													row[searchIndex.field] >=
														searchVals[1].trim())
												) {
													tempFiltered[
														row[
															this.dataComparisonConfig[
																"key field"
															]
														]
													] = row;
												}
											}
											//}
										}
									}
								}
							}
						});

					filtered = tempFiltered;
					tempFiltered = comparingFields == null ? [] : {};
					i++;
				}
			}

			let filteredLength =
				filtered.length != undefined
					? filtered.length
					: Object.keys(filtered).length;

			if (filteredLength == 0 || filteredLength == null) {
				this.utils.alertUtils.popAlert(
					"The last filtering item returns no data therefore removed."
				);

				let newSearchArr = this.filtersIndex[
					this.lastFilter.field
				].search.filter((s) => s != this.lastFilter.value);

				this.filtersIndex[this.lastFilter.field].search = newSearchArr;

				this.applyFilters();
			} else {
				this.$store.dispatch("filteredData", filtered);
			}
		},
		removeAllFilters() {
			for (const FIELD in this.filtersIndex) {
				this.filtersIndex[FIELD].search = [];
			}
			this.applyFilters();
		},
		removeAllSearchParams() {},
		removeFilter(FIELD, ITEM) {
			this.filtersIndex[FIELD].search.splice(ITEM, 1);

			this.applyFilters();
		},
		removeSearch(FIELD, ITEM) {
			//this.filtersIndex[FIELD].search.splice(ITEM, 1);
			//this.applyFilters();
		},
	},
});
</script>

<style>
.expand-region {
	display: inline-block;
	vertical-align: bottom;
	margin-left: 5px;
}
.expand-region-select-byor {
	background-color: #66bbff !important;
	border: solid 1px #3399ff !important;
	color: #fff;
	border-radius: 3px;
	padding: 0 5px;
	float: left;
	margin-top: 5px;
	width: calc(100% - 25px) !important;
}

#kp_gene_search_wrapper {
	/*position: absolute;
	background-color: #efefef;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 10px 10px;
	z-index: 10;
	left: 50px;*/
}
.custom-select-search {
	width: 175px !important;
	min-width: 175px;
}

.custom-select-search.long-list {
	width: auto !important;
	min-width: 175px;
	position: absolute;
	z-index: 100;
	left: 7px;
	margin-top: 2px;
}

.custom-select-search.hidden,
.custom-select-search.long-list.hidden {
	display: none !important;
}

.custom-select-search option {
	width: auto;
	min-width: 175px;
	display: block;
	padding: 5px 0px;
	border-bottom: solid 1px #ddd;
}

.custom-select-search option.hidden {
	display: none;
}

div.custom-select-search {
	overflow-y: auto;
	height: auto;
	max-height: 250px;
	position: absolute;
	z-index: 100;
	left: 7px;
	margin-top: 2px;
	text-align: left;
}

.custom-select-a-option {
	display: block;
	width: 100%;
	border-bottom: solid 1px #eee;
	font-size: 14px;
	color: #666666 !important;
	background-color: #ffffff;
}

.custom-select-a-option:hover {
	color: #333333 !important;
	background-color: #efefef;
	text-decoration: none;
}
.clear-all-filters-bubble {
	background-color: #ff0000;
}

.filtering-ui-wrapper.search-criteria {
	/*position: absolute;
	z-index: 200;
	width: 210px;
	left: -25px;
	top: 10px;
	text-align: left;
	padding: 15px;
	padding-left: 25px;*/
	transition: all 0.5s;
	background-color: #ddefff;
	border: solid 1px #bbdfff;
}

.filtering-ui-wrapper.search-criteria.closed {
	/*left: -225px;*/
	transition: all 0.5s;
}

.filtering-ui-wrapper.search-criteria .open-close-search-criteria {
	position: absolute;
	transform: rotate(90deg);
	background-color: #666;
	color: #fff;
	font-size: 12px;
	font-weight: bold;
	right: 0px;
	top: 80px;
	padding: 0px 7px;
	transform-origin: bottom right;
	transition: all 0.5s;
}

.filtering-ui-wrapper.search-criteria.closed .open-close-search-criteria {
	transform: rotate(0deg);
	right: -78px;
	transition: all 0.5s;
}

.filtering-ui-wrapper.search-criteria .open-close-search-criteria:hover {
	cursor: pointer;
}

.filtering-ui-wrapper.search-criteria > h4.card-title {
	position: absolute;
	font-size: 13px;
	font-weight: bold;
	color: #77afcf;
	left: 5px;
}

.filtering-ui-wrapper > h4.card-title {
	position: absolute;
	font-size: 13px;
	font-weight: bold;
	color: #aaaaaa;
	left: 5px;
}

.filtering-ui-wrapper.search-criteria div.filtering-ui-content div.col {
}
.autocomplete-options {
	position: absolute;
	z-index: 100;
	height: 500px;
	overflow: auto;
}

.autocomplete-options ul {
	list-style: none;
	border-bottom: solid 1px #ddd;
	padding: 0;
	box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}

.autocomplete-options ul li {
	display: block;
	list-style: none;
	background-color: #fff;
	border: solid 1px #ddd;
	text-align: left;
	padding: 3px 10px;
	border-bottom: none;
	max-width: 400px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.autocomplete-options ul li:hover {
	cursor: pointer;
	color: #3399ff;
}
</style>
