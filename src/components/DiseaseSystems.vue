<template>
	<div>
		<div v-if="page != 'front'" class="disease-systems-sub-pages">
			<div class="select-disease-wrapper">
				<label v-if="!!diseaseInSession && diseaseInSession != ''">{{
					diseaseInSession
				}}</label>
				<label v-if="!diseaseInSession || diseaseInSession == ''"
					>Set focus</label
				>
				<div class="select-disease">
					<span class="menu-arrow">></span>
					<div class="options-wrapper">
						<div
							class="option"
							@click="openPhenotypesBuilder('system')"
						>
							By organ system
						</div>
						<div
							class="option"
							@click="openPhenotypesBuilder('disease')"
						>
							By disease
						</div>
						<div
							class="option"
							@click="openPhenotypesBuilder('group')"
						>
							By Phenotype groups
						</div>
						<div
							class="option"
							@click="openPhenotypesBuilder('correlation')"
						>
							By Phenotype correlation
						</div>
						<div
							class="option reset"
							@click="resetCustomPhenotypes()"
						>
							Remove focus
						</div>
					</div>
				</div>
			</div>
		</div>
		<div v-if="page == 'front'" class="row disease-systems-front">
			<div class="disease-systems-tree col-md-12">
				<template v-for="system in diseaseSystems">
					<div class="disease-system col-md-2" :key="system">
						<img
							class="disease-systems-icon"
							:src="
								'https://kp4cd.org/sites/default/files/images/disease_systems/' +
								system.toLowerCase().split(' ')[0] +
								'.svg'
							"
						/>
						<div>{{ system }}</div>
						<div
							class="disease-system-options"
							:id="system.split(' ')[0] + '_options'"
						>
							<h6>
								<a
									href="javascript:;"
									@click="
										openPhenotypesBuilder('system', {
											system: system,
										})
									"
									>{{
										"Select " +
										system.toLowerCase() +
										" system"
									}}</a
								>
							</h6>
							<h6>Or select by disease</h6>
							<div
								class="disease-name"
								v-for="disease in diseaseOptions(system)"
								:key="disease"
							>
								<a
									href="javascript:;"
									@click="
										openPhenotypesBuilder('disease', {
											system: system,
											disease: disease,
										})
									"
									>{{ disease }}</a
								>
							</div>
							<p></p>
							<h6 v-if="kpDiseasePair(system).length > 0">
								Or visit a community portal
							</h6>
							<div
								class="community-portal"
								v-for="kp in kpDiseasePair(system)"
								:key="kp.name"
							>
								<a :href="communityPortalLink(kp.name)"
									><img
										:src="
											'https://kp4cd.org/sites/default/files/images/disease_systems/' +
											kp.name +
											'kp.svg'
										"
								/></a>
							</div>
						</div>
					</div>
				</template>
				<div class="disease-system col-md-2">
					<img
						class="disease-systems-icon"
						src="https://kp4cd.org/sites/default/files/images/disease_systems/correlation.svg"
					/>

					<div class="disease-system-options">
						<h6>
							<a
								href="javascript:;"
								@click="openPhenotypesBuilder('group')"
								>By Phenotype group
							</a>
						</h6>
						<h6>
							<a
								href="javascript:;"
								@click="openPhenotypesBuilder('correlation')"
								>By Phenotype Correlation
							</a>
						</h6>
					</div>
					<span>By Phenotype</span>
				</div>
				<button
					type="button"
					:class="
						!this.$store.state.diseaseInSession
							? 'hidden'
							: 'btn btn-sm btn-warning reset-button'
					"
					@click="resetCustomPhenotypes()"
				>
					Remove focus
				</button>
			</div>
		</div>
		<div
			class="custom-phenotypes-list-builder hidden"
			id="pheno_list_builder"
		>
			<!-- UI for System list
			-->
			<div
				class="ph-builder-filters-wrapper filtering-ui-wrapper"
				v-if="focusBy == 'system'"
			>
				<div class="filtering-ui-content">
					<div class="col filter-col-md">
						<div class="label">Select disease system</div>
						<select
							class="select-disease form-control form-control-sm"
							@change="
								openPhenotypesBuilder('system', null, $event)
							"
						>
							<option
								v-if="!diseaseSystems.includes(selectedDisease)"
								class="disease-name"
								value=""
							>
								Select one
							</option>
							<template v-for="system in diseaseSystems">
								<option
									class="disease-name"
									:value="system"
									:selected="
										system == selectedDisease ? true : false
									"
								>
									{{ system }}
								</option>
							</template>
						</select>
					</div>
				</div>
			</div>

			<!-- UI for disease list
			-->
			<div
				class="ph-builder-filters-wrapper filtering-ui-wrapper"
				v-if="focusBy == 'disease'"
			>
				<div class="filtering-ui-content">
					<div class="col filter-col-md">
						<div class="label">Select disease system</div>
						<select
							class="select-disease form-control form-control-sm"
							v-model="PBuilderDSystem"
						>
							<option class="disease-name" value="">
								Select one
							</option>
							<template v-for="system in diseaseSystems">
								<option class="disease-name" :value="system">
									{{ system }}
								</option>
							</template>
						</select>
					</div>
					<div class="col filter-col-md">
						<div class="label">Select disease</div>
						<select
							class="select-disease form-control form-control-sm"
							@change="
								openPhenotypesBuilder('disease', null, $event)
							"
						>
							<option class="disease-name" value="">
								Select one
							</option>
							<option
								v-for="disease in diseaseOptions(
									PBuilderDSystem
								)"
								class="disease-name"
								:value="disease"
								:selected="
									disease == selectedDisease ? true : false
								"
								:key="disease"
							>
								{{ disease }}
							</option>
						</select>
					</div>
				</div>
			</div>

			<!-- UI for phenotype groups
			-->
			<div
				class="ph-builder-filters-wrapper filtering-ui-wrapper"
				v-if="focusBy == 'group'"
			>
				<div><strong>Select phenotype groups</strong></div>

				<div
					v-for="group in phenotypGroups"
					:key="group"
					class="ph-group-option"
				>
					<input
						type="checkbox"
						:value="group"
						@click="addRemovePhenotypeGroup(group)"
						:checked="!!selectedGroups.includes(group)"
					/>
					{{ group }}
				</div>
			</div>
			<!-- table for "system", "disease", "group" -->
			<template
				v-if="
					focusBy == 'system' ||
					focusBy == 'disease' ||
					focusBy == 'group'
				"
			>
				<strong class="number-of-phenotypes"
					>Number of phenotypes: {{ getPhenotypes().length }}</strong
				>
				<div class="table-wrapper" :class="focusBy">
					<table class="table table-striped table-sm">
						<thead>
							<tr>
								<th></th>
								<th>Phenotype</th>
								<th>Group</th>
								<th>Dichotomous</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="phenotype in getPhenotypes()">
								<td>
									<input
										class="phenotype-chkbox"
										type="checkbox"
										:value="phenotype.name"
										checked
									/>
								</td>
								<td class="phenotype-name">
									{{ phenotype.description }}
								</td>
								<td class="phenotype-group">
									{{ phenotype.group }}
								</td>
								<td class="phenotype-dichotomous">
									{{ phenotype.dichotomous }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="session-info">
					<button
						type="button"
						class="btn btn-primary btn-sm"
						@click="saveCustomPhenotypes(focusBy, 'set')"
					>
						Set focus
					</button>
					<button
						type="button"
						class="btn btn-warning btn-sm"
						@click="closePhenotypesBuilder()"
					>
						Cancel
					</button>
				</div>
			</template>

			<!-- UI for phenotype correlations
			-->
			<div
				class="ph-builder-filters-wrapper filtering-ui-wrapper"
				v-if="focusBy == 'correlation'"
			>
				<div class="filtering-ui-content">
					<div class="col filter-col-md">
						<div class="label">Select phenotype</div>

						<phenotype-selectpicker
							v-if="!!phenotypes"
							:phenotypes="phenotypes"
							:clearOnSelected="true"
							:useInLocal="true"
							localPlace="diseaseSystems"
						></phenotype-selectpicker>
					</div>
					<div class="col filter-col-sm">
						<div class="label">P-Value(<=)</div>

						<input
							type="text"
							v-model="pCorPValue"
							class="form-control"
						/>
					</div>
					<div class="col filter-col-sm">
						<div class="label">Correlation(>=)</div>

						<input
							type="text"
							v-model="pCorCorrelation"
							class="form-control"
						/>
					</div>
					<div class="col filter-col-sm">
						<div class="label">Sort by</div>

						<select v-model="pCorDirection" class="form-control">
							<option value="pValue">P-Value</option>
							<option value="rg">Correlation</option>
						</select>
					</div>
				</div>
			</div>
			<strong
				class="number-of-phenotypes"
				v-if="focusBy == 'correlation' && !!correlatedPhenotypes"
				>Number of phenotypes: {{ correlatedPhenotypes.length }}</strong
			>
			<div
				class="table-wrapper"
				v-if="focusBy == 'correlation' && !!correlatedPhenotypes"
			>
				<table class="table table-striped table-sm">
					<thead>
						<tr>
							<th></th>
							<th>Phenotype</th>
							<th>P-Value</th>
							<th>Correlation</th>
							<th>Standard error</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="phenotype in correlatedPhenotypes">
							<template
								v-if="
									!!phenotypeNames[phenotype.other_phenotype]
								"
							>
								<td>
									<input
										class="phenotype-chkbox"
										type="checkbox"
										:value="phenotype.other_phenotype"
										checked
									/>
								</td>
								<td class="phenotype-name">
									{{
										phenotypeNames[
											phenotype.other_phenotype
										]
									}}
								</td>
								<td class="phenotype-name">
									{{
										formatValue(
											"pValueFormatter",
											phenotype.pValue
										)
									}}
								</td>
								<td class="phenotype-name">
									{{
										formatValue(
											"pValueFormatter",
											phenotype.rg
										)
									}}
								</td>
								<td class="phenotype-name">
									{{
										formatValue(
											"pValueFormatter",
											phenotype.stdErr
										)
									}}
								</td>
							</template>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="session-info" v-if="focusBy == 'correlation'">
				<button
					v-if="!!correlatedPhenotypes"
					type="button"
					class="btn btn-primary btn-sm"
					@click="saveCustomPhenotypes('correlation', 'set')"
				>
					Set focus
				</button>
				<button
					type="button"
					class="btn btn-warning btn-sm"
					@click="closePhenotypesBuilder()"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils.js";
import keyParams from "@/utils/keyParams";
import userUtils from "@/utils/userUtils.js";
import sessionUtils from "@/utils/sessionUtils.js";
import sortUtils from "@/utils/sortUtils.js";
import Formatters from "@/utils/formatters";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";

export default Vue.component("disease-systems", {
	props: [
		"page",
		"phenotypes",
		"phenotypeCorrelation",
		"diseases",
		"diseaseGroups",
		"diseaseInSession",
	],

	data() {
		return {
			diseaseSystems: [],
			selectedSystem: null,
			selectedDisease: null,
			selectedGroups: [],
			focusBy: null,
			pCorPValue: 0.05,
			pCorCorrelation: null,
			pCorDirection: "pValue",
			PBuilderDSystem: null,
		};
	},
	components: { PhenotypeSelectPicker },
	mounted() {
		this.setDiseaseSystems();
		this.getCustomPhenotypes();
	},
	computed: {
		phenotypGroups() {
			if (!!this.phenotypes) {
				let phGroups = [
					...new Set(this.phenotypes.map((p) => p.group).sort()),
				];
				return phGroups;
			} else {
				return null;
			}
		},
		phenotypeNames() {
			if (!!this.phenotypes) {
				let content = {};

				this.phenotypes.map((p) => {
					content[p.name] = p.description;
				});

				return content;
			} else {
				return null;
			}
		},
		correlatedPhenotypes() {
			if (!!this.phenotypeCorrelation) {
				let content =
					!!this.pCorPValue && this.pCorPValue != ""
						? this.phenotypeCorrelation.data.filter(
								(p) => p.pValue <= this.pCorPValue
						  )
						: this.phenotypeCorrelation.data;

				if (!!this.pCorCorrelation && this.pCorCorrelation != "") {
					content = content.filter(
						(p) => p.rg >= this.pCorCorrelation
					);
				}

				if (this.pCorDirection == "rg") {
					content = sortUtils.sort(content, "rg", true, null);
				}

				return content;
			} else {
				return null;
			}
		},
	},
	methods: {
		...sessionUtils,
		...uiUtils,
		...sortUtils,
		...userUtils,
		...Formatters,
		...keyParams,
		currentFocus() {
			let customPhsSet = userUtils.getPhenotypes();

			if (!!customPhsSet) {
				let content = {
					system: null,
					disease: null,
					groups: null,
					phenotypes: [],
				};

				let focusLabel = customPhsSet.id.split(": ");

				switch (focusLabel[0]) {
					case "Disease system":
						content.system = focusLabel[1];
						break;

					case "Disease":
						content.system = this.diseases.filter(
							(d) => d.disease == focusLabel[1]
						)[0]["system"];
						content.disease = focusLabel[1];
						break;

					case "Phenotype groups":
						content.groups = focusLabel[1].slice(0, -1).split(",");
						break;

					case "Phenotype correlation":
						break;
				}

				content.phenotypes = customPhsSet.list;

				return content;
			} else {
				return null;
			}
		},
		formatValue(FORMATTER, VALUE) {
			return Formatters[FORMATTER](VALUE);
		},
		addRemovePhenotypeGroup(GROUP) {
			let index = this.selectedGroups.indexOf(GROUP);
			if (index > -1) {
				this.selectedGroups.splice(index, 1);
			} else {
				this.selectedGroups.push(GROUP);
			}
		},
		getCustomPhenotypes() {
			let customPhsSet = userUtils.getPhenotypes();

			let selectedDisease = !!customPhsSet ? customPhsSet.id : null;
			let selectedPhs = !!customPhsSet ? customPhsSet.list : null;

			if (
				!!selectedDisease &&
				!!selectedDisease.includes("Phenotype group")
			) {
				let groupArr = selectedDisease.split(":");
				let groups = groupArr[1].split(",");
				if (groups.length > 2) {
					selectedDisease =
						"Phenotype groups:" +
						groups[0] +
						"+" +
						(groups.length - 2);
				} else {
					selectedDisease = "Phenotype group:" + groups[0];
				}
			}

			this.selectedDisease = selectedDisease;

			this.$store.dispatch("diseaseInSession", selectedDisease);
			this.$store.dispatch("phenotypesInSession", selectedPhs);
		},
		resetCustomPhenotypes() {
			userUtils.clearPhenotypes();
			this.getCustomPhenotypes();
			uiUtils.hideElement("pheno_list_builder");
		},
		saveCustomPhenotypes(TYPE, ACTION) {
			switch (TYPE) {
				case "system":
					this.selectedDisease =
						"Disease system: " + this.selectedDisease;
					break;
				case "disease":
					this.selectedDisease = "Disease: " + this.selectedDisease;
					break;
				case "group":
					let groups = "";
					this.selectedGroups.map((g) => {
						groups += g + ",";
					});
					this.selectedDisease = "Phenotype groups: " + groups;
					break;
				case "correlation":
					this.selectedDisease =
						"Phenotype correlation: " +
						this.phenotypeNames[
							this.correlatedPhenotypes[0].phenotype
						];
					break;
			}

			let id = this.selectedDisease;
			let phenotypeIds = [];
			let phenotypesChkboxes =
				document.querySelectorAll(".phenotype-chkbox");

			phenotypesChkboxes.forEach(function (chkbox) {
				if (!!chkbox.checked) {
					phenotypeIds.push(chkbox.value);
				}
			});

			let phList = [];

			this.phenotypes.map((p) => {
				phenotypeIds.map((id) => {
					if (p.name == id) {
						phList.push(p);
					}
				});
			});

			let customPhList = { id: id, list: phList };

			userUtils.savePhenotypes(customPhList);

			if (!!id.includes("Phenotype group")) {
				let groupArr = id.split(":");
				let groups = groupArr[1].split(",");
				if (groups.length > 2) {
					id =
						"Phenotype groups:" +
						groups[0] +
						"+" +
						(groups.length - 2);
				} else {
					id = "Phenotype group:" + groups[0];
				}
			}

			this.$store.dispatch("phenotypesInSession", phList);
			this.$store.dispatch("diseaseInSession", id);

			this.selectedDisease = null;

			uiUtils.hideElement("pheno_list_builder");

			let currentUrl = uiUtils.getUrl();

			if (!!currentUrl.pathname.includes("region.html")) {
				//console.log(keyParams.chr, keyParams.start, keyParams.end);

				let nextUrl =
					currentUrl.pathname +
					"?chr=" +
					keyParams.chr +
					"&start=" +
					keyParams.start +
					"&end=" +
					keyParams.end;

				location.href = nextUrl;
			}
		},
		closePhenotypesBuilder() {
			uiUtils.hideElement("pheno_list_builder");
		},
		openPhenotypesBuilder(TYPE, PARAMS, EVENT) {
			this.focusBy = TYPE;
			//console.log("TYPE", TYPE);
			//console.log("currentFocus", this.currentFocus());

			let params = !!PARAMS ? PARAMS : this.currentFocus();

			switch (TYPE) {
				case "system":
					if ((!!params && !!params.system) || !!EVENT) {
						this.selectedDisease = !!EVENT
							? EVENT.target.value
							: params.system.replaceAll(" system", "");
					}
					break;
				case "disease":
					if (
						(!!params && !!params.system && !!params.disease) ||
						!!EVENT
					) {
						this.selectedDisease = !!EVENT
							? EVENT.target.value
							: params.disease;

						this.PBuilderDSystem = !!EVENT
							? this.diseases
									.filter(
										(d) => d.disease == EVENT.target.value
									)[0]
									["system"].replaceAll(" system", "")
							: params.system.replaceAll(" system", "");
					}

					break;
				case "group":
					if (!!params && !!params.groups) {
						params.groups.map((g) => {
							if (g != "") {
								this.selectedGroups.push(g.trim());
							}
						});
					}

					break;
				case "correlation":
					break;
			}

			//open phenotype Builder
			uiUtils.showElement("pheno_list_builder");
		},
		getPhenotypes() {
			let phAssoDisease;

			if (this.focusBy == "system") {
				phAssoDisease = [
					...new Set(
						this.$store.state.bioPortal.diseaseSystems
							.filter(
								(d) => !!d.system.includes(this.selectedDisease)
							)
							.map((d) => d.phenotype)
					),
				];
			}

			if (this.focusBy == "disease") {
				phAssoDisease = [
					...new Set(
						this.$store.state.bioPortal.diseaseSystems
							.filter((d) => d.disease == this.selectedDisease)
							.map((d) => d.phenotype)
					),
				];
			}

			let rawPhs = this.phenotypes;
			let filteredPhs = [];

			if (this.focusBy == "system" || this.focusBy == "disease") {
				phAssoDisease.map((p) => {
					rawPhs.map((rp) => {
						if (rp.name.toLowerCase() == p.toLowerCase()) {
							filteredPhs.push(rp);
						}
					});
				});
			}

			if (this.focusBy == "group") {
				this.selectedGroups.map((g) => {
					rawPhs.map((rp) => {
						if (rp.group.toLowerCase() == g.toLowerCase()) {
							filteredPhs.push(rp);
						}
					});
				});
			}

			sortUtils.sort(filteredPhs, "description", false, true);
			sortUtils.sort(filteredPhs, "group", false, true);

			return filteredPhs;
		},
		setDiseaseSystems() {
			this.diseaseSystems = [];
			let diseaseSystems = [
				...new Set(this.diseases.map((d) => d.system)),
			].sort();

			diseaseSystems.map((d) => {
				let shortName = d.replaceAll(" system", "");
				this.diseaseSystems.push(shortName);
			});
		},
		communityPortalLink(ID) {
			let host = window.location.host.split(".");
			if (!!window.location.host.includes("localhost")) {
				host = host.length == 2 ? host[1] : host[0];
			} else {
				host =
					host.length == 3
						? host[1] + "." + host[2]
						: host[0] + "." + host[1];
			}

			return "https://" + ID + "." + host;
		},
		diseaseOptions(ID) {
			//console.log("id", ID);
			let diseaseSystems = [
				...new Set(
					this.diseases
						.filter((d) => d.system == ID + " system")
						.map((d) => d.disease)
				),
			];

			//console.log("diseaseSystems", diseaseSystems);

			return diseaseSystems;
		},
		kpDiseasePair(SYSTEM, DISEASE) {
			let kpList = "";
			this.diseases.map((d) => {
				if (d.system.replaceAll(" system", "") == SYSTEM) {
					kpList = d.portals;
				}
			});

			let kps = [];
			if (kpList != "" && !!kpList) {
				kpList.split(",").map((c) => {
					let tempArr = this.diseaseGroups.filter(
						(dg) => dg.name == c
					);

					kps.push(tempArr[0]);
				});
			}

			return kps;
		},
	},
});
</script>
<style scoped>
.ph-builder-filters-wrapper {
	margin-bottom: 20px;
}

.ph-group-option {
	font-size: 14px;
	margin-right: 10px;
	display: inline-block;
}

.ph-group-option input[type="checkbox"] {
	width: 14px;
	height: 14px;
}

.disease-systems-sub-pages .select-disease-wrapper {
	position: absolute;
	z-index: 200;
	top: 16px;
	left: 140px;
	color: #fff;
}

.select-disease-wrapper label {
	display: inline-block !important;
	margin: 0 !important;
	margin-bottom: 0.5rem !important;
}

.disease-systems-sub-pages .select-disease {
	width: 15px;
	font-size: 14px;
	background: #fff;
	border: solid 0px #fff;
	border-radius: 10px;
	color: #f7835c;
	padding: 0 8px;
	height: 16px;
	text-align: center;
	display: inline-block;
	margin-left: 5px;
	vertical-align: -2px;
	position: relative;
}

.disease-systems-sub-pages .select-disease:hover {
	cursor: pointer;
}

.disease-systems-sub-pages .select-disease .menu-arrow {
	display: block;
	font-weight: bold;
	position: absolute;
	top: -2px;
	left: 5px;
}

.disease-systems-sub-pages .select-disease:hover .menu-arrow {
	left: 8px;
}

.select-disease .options-wrapper {
	display: none;
	position: absolute;
	margin-left: -90px;
	margin-top: 8px;
	box-shadow: 3px 3px 3px 3px rgb(0 0 0 / 20%);
}

.select-disease:hover .options-wrapper {
	display: block;
}

.select-disease .option {
	color: #666666;
	background-color: #ffffff;
	width: 200px;
	font-size: 14px;
	border-bottom: solid 1px #ddd;
	text-align: left;
	padding: 3px 10px;
}

.select-disease .option.reset {
	background-color: #ffdddd;
}

.select-disease .option:hover {
	cursor: pointer;
	color: #000000;
}

.disease-systems-front .select-disease {
	margin: 5px 5% 20px 5%;
	width: 90%;
}

.select-disease-label {
	display: block;
	font-size: 14px;
	font-weight: bold;
	text-align: left;
	padding-left: 5%;
	margin: 0;
}

.custom-phenotypes-list-builder {
	position: fixed;
	top: 15%;
	left: calc(50% - 380px);
	width: 760px;
	height: 75%;
	text-align: left;
	background-color: #fff;
	padding: 15px;
	-webkit-box-shadow: 0px 10px 10px 10px rgb(0 0 0 / 20%);
	box-shadow: 0px 10px 10px 10px rgb(0 0 0 / 20%);
	border-radius: 5px;
	z-index: 101;
	text-align: center;
}

.custom-phenotypes-list-builder .table-wrapper {
	width: 100%;
	height: calc(100% - 160px);
	overflow-y: auto;
	margin-bottom: 15px;
	border: solid 1px #ddd;
	font-size: 14px;
}

.custom-phenotypes-list-builder .table-wrapper.group {
	height: calc(100% - 260px);
}

.custom-phenotypes-list-builder .table-wrapper table {
	margin-top: -1px;
}
.custom-phenotypes-list-builder table td.phenotype-name {
	text-align: left;
}

.custom-phenotypes-list-builder table td.phenotype-group {
	background: none !important;
}

.session-info {
	width: 100%;
}

.session-info button {
	margin: 0 5px 0 5px;
}

.reset-button {
	font-size: 16px;
	padding: 0 10px;
	border-radius: 15px;
	margin-top: 20px;
	/*position: absolute;
	top: -40px;
	right: 20px;*/
}

/* For front page */
.disease-systems-front .disease-systems-tree {
	text-align: center;
	display: block;
	max-width: 760px !important;
	color: #fff;
	margin-top: 10px;
	position: relative;
	margin-left: auto;
	margin-right: auto;
}
.disease-systems-front .disease-system {
	width: 100px;
	text-align: center;
	font-size: 14px;
	display: inline-grid;
	vertical-align: top;
	margin: 0 30px 5px -10px;
}

.disease-systems-front .disease-systems-icon {
	width: 100px;
	height: 100px;
}

/* For sub page */

.disease-systems-sub-pages .disease-systems-tree {
	text-align: center;
	display: block;
	width: 100%;
	color: #fff;
	margin-top: 10px;
	position: relative;
}
.disease-systems-sub-pages .disease-system {
	width: 100px;
	text-align: center;
	font-size: 14px;
	display: inline-block;
	vertical-align: top;
	margin: 0 10px 0px 10px;
}

.disease-systems-sub-pages .disease-systems-icon {
	width: 40px;
	height: 40px;
}

/* for options part */
.disease-system-options {
	visibility: hidden;
	color: #000;
	text-align: left;
	position: absolute;
	width: 400px;
	height: auto;
	border-radius: 5px;
	background-color: #fff;
	z-index: 100;
	top: 100px;
	left: -140px;
	padding: 15px;
	box-shadow: 10px 10px 10px 10px rgba(0, 0, 0, 0.2);
}
.disease-system:hover > .disease-system-options {
	visibility: visible;
}

div.disease-name {
	padding-left: 5px;
	font-size: 14px;
}

.community-portal {
	margin-bottom: 10px;
	padding-left: 5px;
}

.community-portal img {
	height: 40px !important;
	width: auto !important;
}

.number-of-phenotypes {
	font-size: 12px;
	float: left;
}
</style>
