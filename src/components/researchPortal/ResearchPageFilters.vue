<template>
	<div>
		<div
			class="filtering-ui-wrapper search-criteria"
			id="searchCriteria"
			v-if="this.apiParameters != null"
		>
			<div
				class="open-close-search-criteria"
				id="openCloseSearch"
				@click="showHideSearch()"
			>
				Close search
			</div>
			<h4 class="card-title">Build search criteria</h4>
			<div class="filtering-ui-content row">
				<div
					class="col"
					v-for="parameter in this.apiParameters.parameters"
					:key="parameter.parameter"
				>
					<div class="label">
						<span v-html="parameter.label"></span
						><a
							v-if="
								parameter.type == 'input' &&
								parameter.values == 'kp genes'
							"
							href="javascript:;"
							><small
								@click="
									showHideElement('kp_gene_search_wrapper')
								"
							>
								(Get region by gene)
							</small></a
						>
					</div>

					<input
						v-model="paramSearch"
						placeholder=""
						v-if="
							parameter.type == 'list' &&
							parameter.values.length > 10
						"
						class="form-control"
					/>

					<select
						:id="'search_param_' + parameter.parameter"
						class="custom-select custom-select-search"
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
					>
						<template v-for="param in parameter.values">
							<option
								:value="param.trim()"
								v-html="getFileLabel(param.trim())"
								:key="param.trim()"
								:class="
									parameter.values.length > 10 &&
									paramSearch.length > 2 &&
									!getFileLabel(param.trim())
										.toLowerCase()
										.includes(paramSearch.toLowerCase())
										? 'hidden'
										: ''
								"
							></option>
						</template>
					</select>

					<div
						v-if="
							parameter.type == 'input' &&
							parameter.values == 'kp genes'
						"
						id="kp_gene_search_wrapper"
						class="hidden"
					>
						<input
							v-model="geneSearch"
							placeholder=""
							class="form-control"
							@keyup="getGenes($event)"
							id="kp_gene_search"
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
										getRegion(gene, parameter.parameter)
									"
									class="custom-select-a-option"
								></a>
							</template>
						</div>
					</div>
					<input
						v-if="parameter.type == 'input'"
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
				<div class="col">
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
						class="
							badge badge-secondary badge-pill
							btn
							search-bubble
							clear-all-filters-bubble
						"
						@click="removeAllSearchParams()"
					>
						Clear all filters
					</b-badge>
				</div>
			</div>
		</div>

		<div
			class="filtering-ui-wrapper search-criteria"
			id="searchCriteria"
			v-if="!!this.dataFiles && this.dataFiles.length > 1"
		>
			<div
				class="open-close-search-criteria"
				id="openCloseSearch"
				@click="showHideSearch()"
			>
				Close search
			</div>
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
			<div class="filtering-ui-content row">
				<div
					:class="getFilterWidthClasses()"
					v-for="filter in this.filters"
					:key="filter.field"
				>
					<div class="label" v-html="filter.label"></div>
					<template
						v-if="
							filter.type == 'search' ||
							filter.type == 'search_gt' ||
							filter.type == 'search_lt' ||
							filter.type == 'search_or' ||
							filter.type == 'search_and'
						"
					>
						<input
							type="text"
							class="form-control"
							:id="'filter_' + filter.field.replace(/ /g, '')"
							@change="
								filterData($event, filter.field, filter.type)
							"
						/>
					</template>
					<template v-if="filter.type == 'search_cd'">
						<select
							class="egl-filter-direction"
							:id="
								'filter_' +
								filter.field.replace(/ /g, '') +
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
							:id="'filter_' + filter.field.replace(/ /g, '')"
							@change="
								filterData($event, filter.field, filter.type)
							"
						/>
					</template>
					<template v-else-if="filter.type == 'dropdown'">
						<select
							:id="'filter_' + filter.field.replace(/ /g, '')"
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
						value.labelInBubble == true
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
				class="
					badge badge-secondary badge-pill
					btn
					search-bubble
					clear-all-filters-bubble
				"
				@click="removeAllFilters()"
			>
				Clear all search
			</b-badge>
		</b-container>
	</div>
</template>

<script>
import Vue from "vue";

import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";

export default Vue.component("research-page-filters", {
	props: [
		"apiParameters",
		"dataComparisonConfig",
		"dataFiles",
		"dataType",
		"filesListLabels",
		"uid",
		"filters",
		"filterWidth",
		"dataset",
		"unfilteredDataset",
	],

	data() {
		return {
			filtersIndex: {},
			searchParamsIndex: {},
			paramSearch: "",
			geneSearch: "",
			kpGenes: [],
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
				tempObj["labelInBubble"] =
					!!f.labelInBubble && f.labelInBubble == "true"
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

			parametersArr.map((param, index) => {
				if (keyParams[param] != undefined) {
					document.getElementById("search_param_" + param).value =
						keyParams[param];

					this.searchParamsIndex[param].search.push(keyParams[param]);
					this.$store.dispatch(
						"searchParameters",
						this.searchParamsIndex
					);
				}
			});
		}
	},
	comuted: {},
	watch: {},
	methods: {
		...uiUtils,
		showHideElement(ELEMENT) {
			uiUtils.showHideElement(ELEMENT);
		},
		async getRegion(KEY, PARAM) {
			let searchPoint =
				"https://bioindex.hugeamp.org/api/bio/query/gene?q=" + KEY;

			var geneJson = await fetch(searchPoint).then((resp) => resp.json());

			if (geneJson.error == null) {
				let region =
					geneJson.data[0].chromosome +
					":" +
					geneJson.data[0].start +
					"-" +
					geneJson.data[0].end;
				document.getElementById("search_param_" + PARAM).value = region;
				this.geneSearch = "";
				this.kpGenes = [];
				uiUtils.hideElement("kp_gene_search_wrapper");
			}
		},
		async getGenes(EVENT) {
			if (EVENT.target.value.length > 2) {
				let searchPoint =
					"https://bioindex.hugeamp.org/api/bio/match/gene?q=" +
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
		getFileLabel(file) {
			if (this.filesListLabels != null) {
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
			this.showHideSearch();
			uiUtils.showElement("data-loading-indicator");

			for (const FIELD in this.filtersIndex) {
				this.filtersIndex[FIELD].search = [];
			}
			this.$store.state.initialSearch = 0;
			this.$store.state.bioIndexContinue = [];

			this.$store.dispatch("hugeampkpncms/cancelResearchData");
			this.setDataComparison();

			if (this.dataType == "bioindex") {
				/// set store.searchingPhenotype if searching BioIndex
				if (
					this.apiParameters.query.format.includes("phenotype") ==
					true
				) {
					var phenotype = document.getElementById(
						"search_param_phenotype"
					).value;

					this.$store.dispatch("searchingPhenotype", phenotype);
				}
			}

			let queryParams = "";
			if (this.apiParameters.query.type == "array") {
				let parametersArr = this.apiParameters.query.format;

				parametersArr.map((param, index) => {
					queryParams += document.getElementById(
						"search_param_" + param
					).value;
					if (index + 1 < parametersArr.length) {
						queryParams += ",";
					}

					// add to search parameters index
					if (this.$store.state.dataComparison == "newSearch") {
						this.searchParamsIndex[param].search = [];
						this.searchParamsIndex[param].search.push(
							document.getElementById("search_param_" + param)
								.value
						);
					} else {
						this.searchParamsIndex[param].search.push(
							document.getElementById("search_param_" + param)
								.value
						);
					}

					this.$store.dispatch(
						"searchParameters",
						this.searchParamsIndex
					);
				});
			}

			let APIPoint = this.dataFiles[0];
			if (this.dataType == "bioindex") {
				APIPoint +=
					"query/" +
					this.apiParameters.query.index +
					"?q=" +
					queryParams;
			}

			let fetchParam = { dataPoint: APIPoint, domain: "external" };

			this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);

			this.paramSearch = "";
		},
		switchData(event) {
			uiUtils.showElement("data-loading-indicator");

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
		filterData(EVENT, FIELD, TYPE, DATATYPE) {
			let searchValue = document.getElementById(
				"filter_" + FIELD.replace(/ /g, "")
			).value; //EVENT.target.value;
			let id = "#filter_" + FIELD.replace(/ /g, "");
			let inputField = document.querySelector(id);

			inputField.blur();
			inputField.value = "";

			if (TYPE == "search") {
				let searchTerms = searchValue.split(",");
				searchTerms.map((searchTerm) => {
					this.filtersIndex[FIELD]["search"].push(searchTerm.trim());

					this.filtersIndex[FIELD]["search"] = this.filtersIndex[
						FIELD
					]["search"].filter((v, i, arr) => arr.indexOf(v) == i);
				});
			} else if (
				TYPE == "search_gt" ||
				TYPE == "search_lt" ||
				TYPE == "search_or" ||
				TYPE == "search_and"
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
		},
		applyFilters() {
			let comparingFields =
				this.dataComparisonConfig != null
					? this.dataComparisonConfig.fieldsToCompare
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
							if (comparingFields == null) {
								if (searchIndex.type == "dropdown") {
									targetData.filter((row) => {
										if (search === row[searchIndex.field]) {
											tempFiltered.push(row);
										}
									});
								} else if (
									searchIndex.type == "search" ||
									searchIndex.type == "dropdown_word"
								) {
									targetData.filter((row) => {
										if (
											row[searchIndex.field]
												.toLowerCase()
												.includes(search.toLowerCase())
										) {
											tempFiltered.push(row);
										}
									});
								} else if (searchIndex.type == "search_gt") {
									targetData.filter((row) => {
										if (row[searchIndex.field] >= search) {
											tempFiltered.push(row);
										}
									});
								} else if (searchIndex.type == "search_lt") {
									targetData.filter((row) => {
										if (row[searchIndex.field] <= search) {
											tempFiltered.push(row);
										}
									});
								} else if (searchIndex.type == "search_or") {
									let searchVals = search.split(",");
									targetData.filter((row) => {
										if (
											row[searchIndex.field] <=
												searchVals[0].trim() ||
											row[searchIndex.field] >=
												searchVals[1].trim()
										) {
											tempFiltered.push(row);
										}
									});
								} else if (searchIndex.type == "search_cd") {
									let searchDirection =
										document.getElementById(
											"filter_" +
												searchIndex.field.replace(
													/ /g,
													""
												) +
												"_direction"
										).value;

									targetData.filter((row) => {
										if (searchDirection == "lt") {
											if (
												row[searchIndex.field] <= search
											) {
												tempFiltered.push(row);
											}
										} else if (searchDirection == "gt") {
											if (
												row[searchIndex.field] >= search
											) {
												tempFiltered.push(row);
											}
										}
									});
								} else if (searchIndex.type == "search_and") {
									let searchVals = search.split(",");
									targetData.filter((row) => {
										if (
											row[searchIndex.field] >=
												searchVals[0].trim() &&
											row[searchIndex.field] <=
												searchVals[1].trim()
										) {
											tempFiltered.push(row);
										}
									});
								}
							} else {
								if (searchIndex.type == "dropdown") {
									for (var rowNum in targetData) {
										let row = targetData[rowNum];
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
													search ===
													row[searchIndex.field][
														cellNum
													]
												) {
													meetSearch = true;
												}
											}
											if (meetSearch == true) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										} else {
											if (
												search ===
												row[searchIndex.field]
											) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										}
									}
								} else if (
									searchIndex.type == "search" ||
									searchIndex.type == "dropdown_word"
								) {
									for (var rowNum in targetData) {
										let row = targetData[rowNum];
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
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										} else {
											if (
												row[searchIndex.field]
													.toLowerCase()
													.includes(
														search.toLowerCase()
													)
											) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										}
									}
								} else if (searchIndex.type == "search_gt") {
									for (var rowNum in targetData) {
										let row = targetData[rowNum];
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
													row[searchIndex.field][
														cellNum
													] >= search
												) {
													meetSearch = true;
												}
											}
											if (meetSearch == true) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										} else {
											if (
												row[searchIndex.field] >= search
											) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										}
									}
								} else if (searchIndex.type == "search_lt") {
									for (var rowNum in targetData) {
										let row = targetData[rowNum];
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
													row[searchIndex.field][
														cellNum
													] <= search
												) {
													meetSearch = true;
												}
											}
											if (meetSearch == true) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										} else {
											if (
												row[searchIndex.field] <= search
											) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										}
									}
								} else if (searchIndex.type == "search_or") {
									let searchVals = search.split(",");
									for (var rowNum in targetData) {
										let row = targetData[rowNum];
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
													row[searchIndex.field][
														cellNum
													] <= searchVals[0].trim() ||
													row[searchIndex.field][
														cellNum
													] >= searchVals[1].trim()
												) {
													meetSearch = true;
												}
											}
											if (meetSearch == true) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										} else {
											if (
												row[searchIndex.field] <=
													searchVals[0].trim() ||
												row[searchIndex.field] >=
													searchVals[1].trim()
											) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										}
									}
								} else if (searchIndex.type == "search_cd") {
									let searchDirection =
										document.getElementById(
											"filter_" +
												searchIndex.field.replace(
													/ /g,
													""
												) +
												"_direction"
										).value;

									if (searchDirection == "lt") {
										for (var rowNum in targetData) {
											let row = targetData[rowNum];
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
														row[searchIndex.field][
															cellNum
														] <= search
													) {
														meetSearch = true;
													}
												}
												if (meetSearch == true) {
													tempFiltered[
														row[
															this.dataComparisonConfig.keyField
														]
													] = row;
												}
											} else {
												if (
													row[searchIndex.field] <=
													search
												) {
													tempFiltered[
														row[
															this.dataComparisonConfig.keyField
														]
													] = row;
												}
											}
										}
									} else if (searchDirection == "gt") {
										for (var rowNum in targetData) {
											let row = targetData[rowNum];
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
														row[searchIndex.field][
															cellNum
														] >= search
													) {
														meetSearch = true;
													}
												}
												if (meetSearch == true) {
													tempFiltered[
														row[
															this.dataComparisonConfig.keyField
														]
													] = row;
												}
											} else {
												if (
													row[searchIndex.field] >=
													search
												) {
													tempFiltered[
														row[
															this.dataComparisonConfig.keyField
														]
													] = row;
												}
											}
										}
									}
								} else if (searchIndex.type == "search_and") {
									let searchVals = search.split(",");
									for (var rowNum in targetData) {
										let row = targetData[rowNum];
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
													row[searchIndex.field][
														cellNum
													] >= searchVals[0].trim() &&
													row[searchIndex.field][
														cellNum
													] <= searchVals[1].trim()
												) {
													meetSearch = true;
												}
											}
											if (meetSearch == true) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
										} else {
											if (
												row[searchIndex.field] <=
													searchVals[0].trim() ||
												row[searchIndex.field] >=
													searchVals[1].trim()
											) {
												tempFiltered[
													row[
														this.dataComparisonConfig.keyField
													]
												] = row;
											}
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

			this.$store.dispatch("filteredData", filtered);
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
#kp_gene_search_wrapper {
	position: absolute;
	background-color: #efefef;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 10px 10px;
	z-index: 10;
	left: 50px;
}
.custom-select-search {
	width: auto !important;
	min-width: 175px;
}

.custom-select-search.hidden {
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
	position: absolute;
	z-index: 200;
	width: 210px;
	left: -25px;
	top: 10px;
	text-align: left;
	padding: 15px;
	padding-left: 25px;
	transition: all 0.5s;
	background-color: #ddefff;
	border: solid 1px #bbdfff;
}

.filtering-ui-wrapper.search-criteria.closed {
	left: -225px;
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
	margin-left: -7px;
}

.filtering-ui-wrapper.search-criteria div.filtering-ui-content div.col {
}
</style>
