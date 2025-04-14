<template>
	<div class="multi-page-search-wrapper" :class="searchVisible == false || displyingSearchNum == 0 ? 'hidden-search' : ''">
		<div class="filtering-ui-wrapper search-criteria multi-page-search" id="searchCriteria"
			v-if="searchParameters != null">
			<h4 class="card-title">Build search criteria</h4>
			<div class="filtering-ui-content row">
				<div class="col" :class="!!parameter.display && parameter.display == 'false' ? 'hidden-search' : ''"
					:type="!!parameter['in-section search']? 'in-section search':''"
					v-for="parameter, paramIndex in searchParameters" :key="parameter.parameter">
					<div class="label">
						<span v-html="parameter.label"></span>
					</div>

					<!-- single search -->
				<research-multi-search
					v-if="parameter.type == 'multi search'"
					:sectionsConfig="{'search parameters':parameter, 'sections':sections, 'phenotypes':phenotypesInUse}"
					:paramIndex="paramIndex+1"
					:parent="parentMethods"
					:utils="utils">

				</research-multi-search>

					<!-- end -->

					
					<select v-if="parameter.type == 'api list'"
						:id="'search_param_' + parameter.parameter"  class="custom-select custom-select-search"
						@change="updateSearchInputByEvent($event, paramIndex, parameter.parameter)">

						<option value="">{{ 'Set ' + parameter.parameter }}</option>
						
						<option v-for="param in parameterOptions[paramIndex]" :key="param.value" :value="param.value"
								v-html="param.label.trim()"></option>
					</select>

					<select v-if="parameter.type == 'list' &&
						parameter.values.length <= 10
						" :id="'search_param_' + parameter.parameter" class="custom-select custom-select-search"
						@change="updateSearchInputByEvent($event, paramIndex, parameter.parameter)">

						<option v-for="param in parameter.values" :key="param.value" :value="param.value"
							v-html="param.label.trim()"></option>
					</select>
					<template v-if="parameter.type == 'list' && parameter.values.length > 10">
						<input v-model="paramSearch[paramIndex]" class="form-control"
							@keyup="getListOptions($event, parameter)" :id="'search_param_' + parameter.parameter" />

						<div :id="'listOptions' + parameter.parameter" class="custom-select custom-select-search long-list"
							:size="!!listOptions[parameter.parameter] && listOptions[parameter.parameter].length >= 5 ? 5 : 'auto'"
							:style="!listOptions[parameter.parameter] || listOptions[parameter.parameter].length == 0
								? 'display:none !important;'
								: ''
								">
							<template v-for="option in listOptions[parameter.parameter]">
								<a href="javascript:;" v-html="option.label" :key="option.value" @click="setListValue(
									option.value,
									parameter.parameter,
									paramIndex,
									true
								)
									" class="custom-select-a-option"></a>
							</template>
						</div>
					</template>
					<div>
						<div class="col" v-if="parameter.type == 'string to array'">
							<textarea
								rows="4" cols="50"
								class="form-control research-textarea"
								:id="'search_param_' + parameter.parameter">

							</textarea>
						</div>
						<div v-if="parameter.type == 'input' && parameter.values == 'kp genes'"
							:id="'kp_gene_search_wrapper' + paramIndex"
							:style="!!parameter['expand region'] ? 'display: inline-block;' : ''">

							<input v-model="paramSearch[paramIndex]" class="form-control" @keyup="getGenes($event)"
								:id="'search_param_' + parameter.parameter" />

							<div class="custom-select custom-select-search" :size="kpGenes.length >= 5 ? 5 : 'auto'" :style="kpGenes.length == 0 || checkFocus('search_param_' + parameter.parameter) == false
								? 'display:none !important;'
								: ''
								">
								<template v-for="gene in kpGenes">
									<a href="javascript:;" v-html="gene" :key="gene" @click="
										parameter['convert to region'] &&
											parameter['convert to region'] ==
											'true'
											? setGene(
												gene,
												parameter.parameter,
												paramIndex,
												true,
												parameter['expand region by'],
												parameter['search point']
											)
											: setGene(
												gene,
												parameter.parameter,
												paramIndex
											)
										" class="custom-select-a-option"></a>
								</template>
							</div>
						</div>
						<div v-if="!!parameter['expand region']" class="expand-region">
							<select id="region_expander" class="expand-region-select-byor"
								@change="expandRegion($event, parameter.parameter, paramIndex)">
								<option selected="selected" value="null">
									Expand region by:
								</option>
								<option value="50000">± 50 kb</option>
								<option value="100000">± 100 kb</option>
								<option value="150000">± 150 kb</option>
							</select>
						</div>
					</div>
					<input v-if="parameter.type == 'input' &&
						parameter.values != 'kp genes'
						" type="text" class="form-control" :id="'search_param_' + parameter.parameter" />
				</div>
				<div class="col search-btn-wrapper">
					<div @click="updateSearch()" class="btn btn-sm btn-primary">
						Search
					</div>
				</div>
				<div class="col reset-btn-wrapper">
					<div @click="resetSearch()" class="btn btn-sm btn-warning ">
						Reset
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import ResearchMultiSearch from "@/components/researchPortal/ResearchMultiSearch.vue";

export default Vue.component("research-multi-sections-search", {
	props: [
		"searchParameters",
		"phenotypesInUse",
		"sections",
		"utils",
		"searchVisible"
	],
	components: {
		ResearchMultiSearch
	},
	data() {
		return {
			paramSearch: {
				1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "", 9: "", 10: "",
				11: "", 12: "", 13: "", 14: "", 15: "", 16: "", 17: "", 18: "", 19: "", 20: ""
			},
			parameterOptions: {
0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [], 13: [], 14: [], 15: [], 16: [], 17: [], 18: [], 19: [], 20: []
			},
			searchingValues: {},
			kpGenes: [],
			listOptions: {},
		};
	},
	created() {
		this.$root.$refs.multiSectionSearch = this;
		
		this.searchParameters.map((param, pIndex) =>{
			if(param.type == 'api list') {
				this.getList(param["data point"], pIndex);
			}
		})
	},
	beforeUpdate() {

	},
	updated() {

	},
	mounted() {
		window.addEventListener("scroll", this.onScroll);
		this.searchParameters.map(s => {
			if (!!this.utils.keyParams[s.parameter] && s.type != 'multi search') {
				document.getElementById("search_param_" + s.parameter).value = this.utils.keyParams[s.parameter];
			}
		})

	},
	beforeDestroy() {
		window.removeEventListener("scroll", this.onScroll);
	},
	computed: {
		displyingSearchNum() {
			let totalSearchNum = this.searchParameters.length;

			this.searchParameters.map(s=>{
				
				if(s.display && s.display == "false") {
					totalSearchNum --;
				}
			})

			return totalSearchNum;
		},
		parentMethods() {
			return {
				kpGenes: this.kpGenes,
				kpPhenotypes: this.phenotypesInUse,
				getGenes: this.getGenes,
				setListValue: this.setListValue,
				paramSearch: this.paramSearch,
				updateSearch: this.updateSearch
			}
		}
	},
	watch: {
		
	},
	methods: {
		
		checkFocus(ID) {
			if (!document.getElementById(ID).matches(':focus')) {
				return false;
			} else {
				return true;
			}
		},
		async getList(apiPoint, INDEX) {
			
			let searchPoint = apiPoint.url;
			let values = []; 

			if (!!apiPoint["parameters type"] && apiPoint["parameters type"] == "replace") {

				let PARAMS = apiPoint.parameters

				PARAMS.map((param, pIndex) => {
					searchPoint = searchPoint.replace("$" + param, this.utils.keyParams[param]);
				})
			}

			let valuesJson = await fetch(searchPoint).then((resp) => resp.json());

			if (valuesJson.error == null) {

				let data = valuesJson;

				if (!!apiPoint["data wrapper"]) {
					apiPoint["data wrapper"].map(mapper => {
						data = data[mapper];
					})
				}

				if (data.length > 0) {
					if(typeof data == 'string') {
						data = JSON.parse(data);
					}

					data.map(item => {
						
						if(typeof item == 'string' || typeof item == 'number') {
							values.push({"label":item, "value":item}) 
						} else if(typeof item == 'object' && !!Array.isArray(item)) {
							values.push({ "label": item[0], "value": item[0] })
						} else if(typeof item == 'object' && !Array.isArray(item)) {
							values.push(item);
						}
					})
				}
				this.parameterOptions[INDEX] = values;

			}
		},
		onScroll(e) {
			let windowTop = window.top.scrollY;

			let element = document.getElementsByClassName("multi-page-search")[0];
			let contentsTop = document.getElementsByClassName("kp-tabs-contents")[0];
			let rect = contentsTop.getBoundingClientRect();
			let scrollTop = document.documentElement.scrollTop
				? document.documentElement.scrollTop
				: document.body.scrollTop;

			let tableTop = rect.top + scrollTop;

			if (windowTop > tableTop) {
				if (!element.classList.contains("fixed-header")) {
					element.classList.add("fixed-header");
				}
			} else {
				if (element.classList.contains("fixed-header")) {
					element.classList.remove("fixed-header");
				}
			}
		},
		getListOptions(event, PARAM) {

			let options = [];
			if (event.target.value.length >= 2) {
				//let optionChrLength = 0;
				PARAM.values.map(option => {
					if (!!option.label.toLowerCase().includes(event.target.value.toLowerCase())) {
						options.push(option);
					}
				})

				let shorterFirst = options.sort((a, b) => a.label.length - b.label.length);

				this.listOptions[PARAM.parameter] = shorterFirst;
			} else {
				this.listOptions[PARAM.parameter] = [];
			}

		},
		setListValue(KEY, PARAMETER, INDEX) {

			console.log(KEY, PARAMETER, INDEX);

			this.paramSearch[INDEX] = KEY;
			this.searchingValues[PARAMETER] = KEY;

			this.listOptions[PARAMETER] = [];
		},
		updateSearchInputByEvent(event, INDEX, PARAMETER) {
			let paramValue = event.target.value;
			this.searchingValues[PARAMETER] = paramValue;
			this.paramSearch[INDEX] = paramValue;
		},
		expandRegion(EVENT, PARAM, INDEX) {
			let expandNumber = EVENT.target.value;

			if (EVENT.target.value != "null") {
				let currentRegion = this.searchingValues[PARAM].split(":");
				let chr = currentRegion[0];
				let region = currentRegion[1].split("-");
				let regionStart =
					Number(region[0]) - Number(expandNumber) <= 0
						? 0
						: Number(region[0]) - Number(expandNumber);

				let regionEnd = Number(region[1]) + Number(expandNumber);

				let newRegion = chr + ":" + regionStart + "-" + regionEnd;

				this.paramSearch[INDEX] = newRegion;
				this.searchingValues[PARAM] = newRegion;
			}
		},
		updateSearch(KEY,TARGET_SECTIONS) {

			this.$root.hoverPos = [];

			let paramsObj = {}

			if(!KEY) {
				this.searchParameters.map(s => {
					/*let paramValue = document.getElementById("search_param_" + s.parameter).value;
					
					paramValue = (s.type == "string to array")?	paramValue.replaceAll("\n",";"):paramValue;*/

					let paramValue;

					switch(s.type) {
						case "string to array":
							paramValue = document.getElementById("search_param_" + s.parameter).value.replaceAll("\n",";");

							break;

						case "multi search":

							s.parameters.map( p => {
								if(!!document.getElementById("search_param_" + p.parameter)) {
									paramValue = (p.type == "string to array")? 
										document.getElementById("search_param_" + p.parameter).value.replaceAll("\n",";") :
										document.getElementById("search_param_" + p.parameter).value;
								}
							})

							break;

						default:
							paramValue = document.getElementById("search_param_" + s.parameter).value;

							break;

					}

					switch(s.type) {
						case "multi search":

							s.parameters.map( p => {
								if(!!document.getElementById("search_param_" + p.parameter)) {
									paramsObj[p.parameter] = (paramValue.charAt(0) == "{") ? JSON.parse(paramValue).value : paramValue;
								}
							})

							break;

						default:
							paramsObj[s.parameter] = (paramValue.charAt(0) == "{") ? JSON.parse(paramValue).value : paramValue;
							break;
					}
					
				})
			} else {
				
				let paramValue = document.getElementById("search_param_" + KEY).value;
				
				paramsObj[KEY] = (paramValue.charAt(0) == "{") ? JSON.parse(paramValue).value : paramValue;
			}
			
			this.utils.keyParams.set(paramsObj);

			if (!KEY) {
				this.sections.map(s => {
					this.$root.$refs[s['section id']].getData();
				})
			} else if (!!KEY) {

				if(!!TARGET_SECTIONS) {
					const elements = document.querySelectorAll('.multi-section-card');

					elements.forEach(element => {
						element.classList.contains("hidden")? "" : element.classList.add("hidden");
					});



					TARGET_SECTIONS.map(s=>{
						document.getElementById('section_wrapper_' + s).classList.remove('hidden');
						
						this.utils.uiUtils.moveElement('section_wrapper_' + s, "custom_sections_list_wrapper");
						this.$root.$refs[s].getData();
					})
				} else {
					this.sections.map(s => {
						if (!!s["data point"] && !!s["data point"]["parameters"] && !!s["data point"]["parameters"].includes(KEY)) {
							
							if (!!document.getElementById("section_" + s['section id'])) {
							this.$root.$refs[s['section id']].getData();
							}
						}
					})
				}
			}

			this.$root.updateParams();
		},
		resetSearch() {
			let paramsObj = {}
			this.paramSearch = {
				1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "", 9: "", 10: "",
				11: "", 12: "", 13: "", 14: "", 15: "", 16: "", 17: "", 18: "", 19: "", 20: ""
			};

			this.$root.hoverPos = [];

			this.searchParameters.map(s => {

				switch (s.type) {
					case "multi search":

						s.parameters.map( p => {
							paramsObj[p.parameter] = "";
							 
							if(!!document.getElementById("search_param_" + p.parameter)) {
								document.getElementById("search_param_" + p.parameter).value = "";
							}
						})
						break;
					default:

						paramsObj[s.parameter] = "";
						document.getElementById("search_param_" + s.parameter).value = "";

					break;
				}
				
			})
			this.utils.keyParams.set(paramsObj);

			this.sections.map(s => {
				if (!!s["data point"] && !!s["data point"]["parameters"]) {
					if(!!document.getElementById("section_"+ s['section id'])) {

						this.$root.$refs[s['section id']].resetAll();

					}
					
				}
			})
		},
		async setGene(KEY, PARAMETER, INDEX, CONVERT_REGION, DEFALT_EXPAND,SEARCH_POINT) {
			
			if (!!CONVERT_REGION) {
				let searchPoint;
				if(!!SEARCH_POINT) {
					searchPoint = SEARCH_POINT + "/api/bio/query/gene?q=" + KEY;
				} else {
					searchPoint = this.utils.uiUtils.biDomain() + "/api/bio/query/gene?q=" + KEY;
				}
				

				let regionExpand = !!DEFALT_EXPAND? DEFALT_EXPAND/2 : 0;

				let geneJson = await fetch(searchPoint).then((resp) => resp.json());

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
			} else {
				this.paramSearch[INDEX] = KEY;
				this.searchingValues[PARAMETER] = KEY;
			}

			this.kpGenes = [];

		},
		async getGenes(EVENT) {
			if (EVENT.target.value.length > 2 && !EVENT.target.value.includes(",")) {
				let searchPoint = this.utils.uiUtils.biDomain() + "/api/bio/match/gene?q=" + EVENT.target.value;

				let geneJson = await fetch(searchPoint).then((resp) => resp.json());

				if (geneJson.error == null && geneJson.detail == null) {
					this.kpGenes = geneJson.data;
				} else {
					this.kpGenes = [];
				}
			} else {
				this.kpGenes = [];
			}
		},
	},
});
</script>

<style>
.form-control.research-textarea {
	width: auto !important;
	height: auto !important;
}

.hidden-search {
	display: none !important;
}

.multi-page-search-wrapper {
	position: relative;
	height: 100px;
}

.fixed-header {
	position: fixed !important;
	top: 0px;
	width: 100%;
	left: 0;
	z-index: 200;
	box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}

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
	white-space: nowrap;
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

.filtering-ui-wrapper.search-criteria>h4.card-title {
	position: absolute;
	font-size: 13px;
	font-weight: bold;
	color: #77afcf;
	left: 5px;
}

.filtering-ui-wrapper>h4.card-title {
	position: absolute;
	font-size: 13px;
	font-weight: bold;
	color: #aaaaaa;
	left: 5px;
}

.filtering-ui-wrapper.search-criteria div.filtering-ui-content div.col {}

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
