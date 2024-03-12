<template>
	<div>
		<div
			class="filtering-ui-wrapper vertical"
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
					<div class="label" v-if="filter.type != 'checkbox'" v-html="filter.label"></div>
					<template v-if="filter.type == 'search'">
						<input
							v-if="
								!!filter.features &&
								!!filter.features.includes('autocomplete')
							"
							type="text"
							class="form-control"
							:id="'filter_' +sectionId+ getColumnId(filter.field)"
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
							:id="'filter_' + sectionId + getColumnId(filter.field)"
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
							:id="'filter_' + sectionId + getColumnId(filter.field)"
							@change="
								filterData($event, filter.field, filter.type)
							"
						/>
					</template>
					<template
							v-if="filter.type == 'slider'
								"
						>
						<div v-if="filter['slider type'] == 'single'"></div>
						<div v-if="filter['slider type'] == 'dual'">
							<div class="slide-container">
								<div class="sliders-control" :id="'filter_' + sectionId + getColumnId(filter.field)">
									<input style="padding:0;" class="slider from-slider" type="range" 
									 :id="'filter_' + sectionId + getColumnId(filter.field) + '_from_slider'"
									 :value="sliderRange[filter.field].from" 
									 :min="sliderRange[filter.field].min" 
									 :max="sliderRange[filter.field].max" 
									 :step="sliderRange[filter.field].step"
									 @input="setSliderTip($event, 'filter_' + sectionId + getColumnId(filter.field) + '_from')" 
									 @change="filterDataSlider($event, filter.field, 'dual')"/>
									<input style="padding:0;" class="slider to-slider" type="range" 
									 :id="'filter_' + sectionId + getColumnId(filter.field) + '_to_slider'"
									 :value="sliderRange[filter.field].to" 
									 :min="sliderRange[filter.field].min" 
									 :max="sliderRange[filter.field].max" 
									 :step="sliderRange[filter.field].step"
									 @input="setSliderTip($event, 'filter_' + sectionId + getColumnId(filter.field) + '_to')" 
									 @change="filterDataSlider($event, filter.field, 'dual')"/>
									 <output class="range-slider-tip range-from-value" 
									  :id="'filter_' + sectionId + getColumnId(filter.field)+'_from'" name="rangeFromValue"
									  >{{ Math.round(sliderRange[filter.field].from * 10000) / 10000 }}</output>
									 <output class="range-slider-tip range-to-value" 
									  :id="'filter_' + sectionId + getColumnId(filter.field) + '_to'" name="rangeToValue"
									  >{{ Math.round(sliderRange[filter.field].to * 10000) / 10000 }}</output>
								</div>
							</div>
						</div>
					</template>
					<template v-if="filter.type == 'search change direction'">
						<select
							class="egl-filter-direction"
							:id="
								'filter_' + sectionId +
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
							:id="'filter_' + sectionId + getColumnId(filter.field)"
							@change="
								filterData($event, filter.field, filter.type)
							"
						/>
					</template>
					<template v-else-if="filter.type == 'dropdown'">
						<select
							:id="'filter_' + sectionId + getColumnId(filter.field)"
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
					<template v-else-if="filter.type == 'sort'">
						<select
							:id="'filter_' + sectionId + getColumnId(filter.id)"
							@change="
								callSort($event, filter.direction)
								"
							class="custom-select"
						>
							<option></option>
							<option
								v-for="value in filter.fields"
								:key="value"
								:value="value"
							>
								{{ value }}
							</option>
						</select>
					</template>
					<template v-else-if="filter.type == 'sort-radio'">
						<div class="custom-select-radios">
							<div
								v-for="value in filter.fields"
								:key="value"
								class="custom-select-radio"
							>
								<input
									type="radio"
									:id="'filter_' + sectionId + getColumnId(filter.id) + '_' + value"
									:value="value"
									@change="callSort($event, filter.direction)"
									class="custom-radio"
									name="filter"
								>
								<label
									:for="'filter_' + sectionId + getColumnId(filter.id) + '_' + value"
								>
									{{ value }}
								</label>
							</div>
						</div>
					</template>
					<template v-else-if="filter.type == 'checkbox'">
						<div class="chkbox-combo">
							<div class="title btn btn-sm btn-light form-control chk-box-btn">{{ filter.label }} <span>&#9660;</span></div>
							<div class="options">
								<span>
									<input type="checkbox" class="chkbox"
										:id="'filter_' + sectionId + getColumnId(filter.field) + 'all'"
										@change="
											filterDataChkbox(
												$event,
												filter.field,
												filter.type,
												'all'
											)
											"
										checked
									/><label :for="'filter_' + sectionId + getColumnId(filter.field) + 'all'">Check / Uncheck all</label>
								</span>
								<span v-for="value, vIndex in buildOptions(filter.field,'chkbox')"
									:key="value"
									:class="filter.field.toLowerCase()==='omics'?[value, 'do-color']:''">
									<input type="checkbox" class="chkbox" :class="['filter-' + sectionId + getColumnId(filter.field)]"
										:id="'filter_' + sectionId + getColumnId(filter.field) + vIndex"
										:value="value"
										@change="
											filterDataChkbox(
												$event,
												filter.field,
												filter.type,
												vIndex
											)
											"
										checked
									/><label :for="'filter_' + sectionId + getColumnId(filter.field) + vIndex">{{ value }}</label>
								</span>
									
								</div>
							</div>
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
					v-if="value.type != 'checkbox' && value.search.length > 0"
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

export default Vue.component("research-section-filters-vertical", {
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
		"sectionId",
		"utils",
	],
	components: {
	},
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
			sliderRange: null
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

				if(f.type == 'slider') {
					this.getRange(f.field);
				}
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
		callSort(e, sortDirection) {
			this.$emit('clicked-sort', { "key": e.target.value, "direction": sortDirection });
		},
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

		/*async getRegion(KEY, PARAM) {
			let searchPoint =
				this.utils.uiUtils.biDomain() + "/api/bio/query/gene?q=" + KEY;

			var geneJson = await fetch(searchPoint).then((resp) => resp.json());

			if (geneJson.error == null) {
				let region =
					geneJson.data[0].chromosome +
					":" +
					geneJson.data[0].start +
					"-" +
					geneJson.data[0].end;

				this.geneSearch = region;
				this.kpGenes = [];
			}
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
		},*/
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
		/// test if string contains letters
		testLetters(STR) {
			return /[a-zA-Z]/.test(STR);
		},
		numberOfSearches() {
			let numberOfBubbles = 0;
			for (const FIELD in this.filtersIndex) {
				numberOfBubbles += (this.filtersIndex[FIELD].type !="checkbox")? this.filtersIndex[FIELD].search.length:0;
			}

			return numberOfBubbles;
		},
		numberOfSearchParams() {},
		buildOptions(field,TYPE) {
			if (this.dataComparisonConfig == null || (!!TYPE && TYPE == "chkbox")) {
				let data = (!!TYPE && TYPE == "chkbox") ? this.unfilteredDataset : this.dataset;

				let options = [];

				if(!!data) {
					data.map((v) => {
						let values = (typeof v[field] === "object" && v[field] !== null && !!Array.isArray(v[field]))? v[field] : [v[field]];

						values.map(i =>{
							options.push(i)
						})
					});

					options = options.filter((v, i, arr) => arr.indexOf(v) == i) //unique
									.filter((v, i, arr) => v != ""); //remove blank*/
				}

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

		getRange(FIELD) {

			console.log(FIELD);
			let data = this.unfilteredDataset;
				
			if(!this.sliderRange) { this.sliderRange = {} };
			let range = { min: null, max: null, step:0, from: null, to: null };

			data.map(d=>{
				
				if(!!d[FIELD] && typeof d[FIELD] === 'number') {
					range.min = (!range.min)? d[FIELD] : (d[FIELD] < range.min)? d[FIELD] : range.min;
					range.max = (!range.max) ? d[FIELD] : (d[FIELD] > range.max) ? d[FIELD] : range.max;
				}
			})
			range.from = Math.round(range.min * 10000) / 10000;
			range.to = Math.round(range.max * 10000) / 10000;
			range.step = (range.max - range.min) / 10000;

			if(!!document.getElementById("filter_" + this.sectionId + this.getColumnId(FIELD) + "_from")) {
				document.getElementById("filter_" + this.sectionId + this.getColumnId(FIELD) + "_from").value = range.from;
			}
			if (!!document.getElementById("filter_" + this.sectionId + this.getColumnId(FIELD) + "_to")) {
				document.getElementById("filter_" + this.sectionId + this.getColumnId(FIELD) + "_to").value = range.to;
			}

			this.sliderRange[FIELD] = range;
		},

		filterDataChkbox(EVENT, FIELD, TYPE, INDEX) {
			
			let searchValue = EVENT.target.value;
			let searchId = EVENT.target.id;

			this.lastFilter = { field: FIELD, value: searchValue };

			if (document.getElementById(searchId).checked) {
				if (INDEX == 'all') {
					this.filtersIndex[FIELD]["search"] = [];

					let className = '.filter-' + this.sectionId + this.getColumnId(FIELD);
					let allArr = document.querySelectorAll(className);

					for (let i = 0; i < allArr.length; ++i) {
						allArr[i].checked = true;
					}

				} else {
				this.filtersIndex[FIELD]["search"] = 
					[...new Set(this.filtersIndex[FIELD]["search"].filter(s=>s != searchValue))];
				}

			} else {
				if(INDEX == 'all') {
					this.filtersIndex[FIELD]["search"] = [];

					let className = '.filter-' + this.sectionId + this.getColumnId(FIELD);
 					let allArr = document.querySelectorAll(className);

					for (let i = 0; i < allArr.length; ++i) {
						allArr[i].checked = false;
						this.filtersIndex[FIELD]["search"].push(allArr[i].value);
					}

				} else {
					this.filtersIndex[FIELD]["search"].push(searchValue);
				}
			}

			this.applyFilters();
			
		},
		setSliderTip(EVENT,ID) {
			document.getElementById(ID).value = Math.round(EVENT.target.value * 10000) / 10000;
		},
		filterDataSlider(EVENT, FIELD, TYPE,) {
			if(TYPE == "single") {

			} else if (TYPE == "dual") {
				let searchValueFrom = document.getElementById("filter_" + this.sectionId + this.getColumnId(FIELD)+"_from").value
				let searchValueTo = document.getElementById("filter_" + this.sectionId + this.getColumnId(FIELD) + "_to").value
				let searchValue = searchValueFrom+","+ searchValueTo;

				this.sliderRange[FIELD].from = Number(searchValueFrom);
				this.sliderRange[FIELD].to = Number(searchValueTo);

				this.lastFilter = { field: FIELD, value: searchValue };

				this.filtersIndex[FIELD]["search"] = [searchValue];
			}

			this.applyFilters();
		},
		filterData(EVENT, FIELD, TYPE, DATATYPE, SUGGESTED) {
			let searchValue = !!SUGGESTED
				? SUGGESTED
				: document.getElementById("filter_" + this.sectionId + this.getColumnId(FIELD))
						.value; //EVENT.target.value;

			let id = "#filter_" + this.sectionId + this.getColumnId(FIELD);
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

				if (searchIndex.type != "checkbox" && searchIndex.search.length > 0) {
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
										switch (searchIndex.type) {
											case "dropdown":
												search ===
												row[
													searchIndex.field
												].toString()
													? tempFiltered.push(row)
													: "";

												break;
											case "search":
												row[searchIndex.field]
													.toLowerCase()
													.includes(
														search.toLowerCase()
													)
													? tempFiltered.push(row)
													: "";
												break;
											case "search exact":
												search.toLowerCase() ===
												row[searchIndex.field]
													.toString()
													.toLowerCase()
													? tempFiltered.push(row)
													: "";

												break;
											case "dropdown word":
												row[searchIndex.field]
													.toLowerCase()
													.includes(
														search.toLowerCase()
													)
													? tempFiltered.push(row)
													: "";

												break;

											case "search greater than":
												typeof row[searchIndex.field] == 'number' && row[searchIndex.field] >= search
													? tempFiltered.push(row)
													: "";
												break;
											case "search lower than":
											typeof row[searchIndex.field] == 'number' && row[searchIndex.field] <= search
													? tempFiltered.push(row)
													: "";

												break;
											case "search or":
												searchVals = search.split(",");

												typeof row[searchIndex.field] == 'number' && (row[searchIndex.field] <=
													searchVals[0].trim() ||
												row[searchIndex.field] >=
													searchVals[1].trim())
													? tempFiltered.push(row)
													: "";
												break;
											case "search change direction":
												let searchDirection =
													document.getElementById(
														"filter_" + this.sectionId +
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

												typeof row[searchIndex.field] == 'number' && (row[searchIndex.field] >=
													searchVals[0].trim() &&
												row[searchIndex.field] <=
													searchVals[1].trim())
													? tempFiltered.push(row)
													: "";
												break;

											case "slider":
												searchVals = search.split(",");

												typeof row[searchIndex.field] == 'number' && (row[searchIndex.field] >=
													searchVals[0].trim() &&
													row[searchIndex.field] <=
													searchVals[1].trim())
													? tempFiltered.push(row)
													: "";

												break;
										}
									}
								});
							} else {
								for (var rowNum in targetData) {
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
												for (var cellNum in row[
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
													"filter_" + this.sectionId +
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
											searchIndex.type == "search and" || searchIndex.type == "slider"
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

			///Since checkBox filters work different from other filters run filter separately

			if (!!filteredLength && filteredLength > 0) {
				if (comparingFields == null) {
					
					for (const [fKey, filter] of Object.entries(this.filtersIndex)) {
						if(filter.type == 'checkbox') {
							console.log("filter", filter)
							//console.log("filter.search", filter.search)
							//filtered = filtered.filter(row => !!row[filter.field] && !filter.search.includes(row[filter.field].toString()));
							let chkboxFiltered = [];

							filtered.map(row =>{
								if(!!row[filter.field] && typeof row[filter.field] != "object" && !filter.search.includes(row[filter.field].toString())) {
									chkboxFiltered.push(row);
								} else if(!!row[filter.field] && typeof row[filter.field] == "object" && !!Array.isArray(row[filter.field])) {
									let isRowTrue = null;
									row[filter.field].map(fV=>{
										if(!filter.search.includes(fV.toString())) {
											isRowTrue = true;
										}
									})

									if(!!isRowTrue) {
										chkboxFiltered.push(row);
									}
								}
							})

							filtered = chkboxFiltered;
						}
					}
				} else {

				}
			}

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
				this.$emit('on-filtering', filtered);
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
			this.getRange(FIELD);
		},
		removeSearch(FIELD, ITEM) {
		},
	},
});
</script>

<style>
div.filtering-ui-content div.col {
    vertical-align: bottom !important;
}
/* slider UI */
.slide-container {
  width: 175px;
    position: relative;
}

.sliders-control {
    position: relative;
    min-height: 30px;
    border-top: solid 2px #cccccc;
    margin-top: 10px;
    margin-bottom: -10px;
}

.slider {
	position: absolute;
	left: 0;
	top: 5px;
  -webkit-appearance: none;
  width: 100%;
  height: 2px !important;
  background: #d3d3d300;
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
  border-radius: 5px;
  z-index:1;
}

.slider:hover {
  opacity: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  margin-top: -15px;
  background: #666666;
  border-radius: 15px;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 15px;
  height: 15px;
  margin-top: -15px;
  background: #666666;
  border-radius: 15px;
  cursor: pointer;
}

.range-slider-tip {
	position: absolute;
	top: 5px;
	font-size: 12px;
}

.range-from-value {
	left: 0;
}

.range-to-value {
	right: 0;
}

/* */
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

.filtering-ui-wrapper.vertical {
	text-align: left !important;
	padding-left: 15px;
	background-color: #ffffff !important;
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

.chkbox-combo .options{
	display: none;
    position: absolute;
    background-color: #ffffff;
    border: solid 1px #dddddd;
    border-radius: 5px;
	z-index: 1001;
	max-height: 400px;
    overflow-y: auto;
    padding: 10px 10px;
}

.chkbox-combo .options span{
	display: block;
    text-align: left;
    padding: 3px 10px 0 5px;
    white-space: nowrap;
    height: 22px;
}

.chkbox-combo .options .chkbox{
	width: 13px;
	height: 13px;
	margin-right: 3px;
}

.chkbox-combo:hover .options{
	display: block;
}

.chk-box-btn {
	border: 1px solid #ced4da;
}


.custom-select-radios {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 10px;
}
.custom-select-radio {
    display: flex;
    align-items: baseline;
    gap: 10px;
    border-radius: 5px;
    padding: 0 10px;
    background: white;
    white-space: nowrap;
    height: 22px;
	cursor: pointer !important;
}
.custom-select-radio:hover {
    outline: 0.5px solid #aaaaaa;
}
.custom-select-radio input[type="radio"] {
    display: inline-block;
    margin: 0 5px 0 0;
    appearance: none;
    background: #34679a;
    border-radius: 50%;
    width: 10px !important;
    height: 10px !important;
    aspect-ratio: 1;
    position: relative;
}
.custom-select-radio input[type="radio"]:after {
    content: '';
    background: white;
    width: calc(100% - 5px);
    height: calc(100% - 5px);
    display: block;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.custom-select-radio input[type="radio"]:checked:after {
    background: #34679a;
}
.custom-select-radio label {
    margin: 0 !important;
	cursor: pointer;
}
</style>
