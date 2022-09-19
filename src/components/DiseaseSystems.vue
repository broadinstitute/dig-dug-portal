<template>
	<div>
		<div v-if="page != 'front'" class="disease-systems-sub-pages">
			<div class="select-disease-wrapper">
				<label>{{ diseaseInSession }}</label>
				<div class="select-disease">
					<span class="menu-arrow">></span>
					<div class="options-wrapper">
						<div
							class="option"
							@click="callCustomPhActions('disease')"
						>
							By disease
						</div>
						<div
							class="option"
							@click="callCustomPhActions('correlation')"
						>
							By Phenotype correlation
						</div>
						<div
							class="option"
							@click="callCustomPhActions('reset')"
						>
							Reset focus
						</div>
					</div>
				</div>
			</div>
		</div>
		<div v-if="page == 'front'" class="row disease-systems-front">
			<div class="disease-systems-tree col-md-12">
				<template v-for="(system, systemIndex) in diseaseSystems">
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
							<h5>Select a disease</h5>
							<div
								class="disease-name"
								v-for="disease in diseaseOptions(system)"
								:key="disease"
							>
								<a
									href="javascript:;"
									@click="
										openPhenotypesBuilder(
											disease,
											null,
											'disease'
										)
									"
									>{{ disease }}</a
								>
							</div>
							<p></p>
							<h5 v-if="kpDiseasePair(system).length > 0">
								Or visit a community portal
							</h5>
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
					<a
						href="javascript:;"
						@click="
							openPhenotypesBuilder(null, null, 'correlation')
						"
						><img
							class="disease-systems-icon"
							src="https://kp4cd.org/sites/default/files/images/disease_systems/correlation.svg"
						/>
					</a>
					<span>By Phenotype Correlation</span>
				</div>
				<button
					type="button"
					class="btn btn-sm btn-warning reset-button"
					@click="resetCustomPhenotypes()"
				>
					Reset focus
				</button>
			</div>
		</div>
		<div
			class="custom-phenotypes-list-builder hidden"
			id="pheno_list_builder"
		>
			<div class="ph-builder-filters-wrapper" v-if="focusBy == 'disease'">
				<label class="select-disease-label">Select disease: </label>
				<select
					class="select-disease form-control form-control-sm"
					@change="openPhenotypesBuilder(null, $event, 'disease')"
				>
					<template v-for="system in diseaseSystems">
						<option class="disease-name" value="" disabled>
							{{ system }}
						</option>
						<option
							class="disease-name"
							v-for="disease in diseaseOptions(system)"
							:value="disease"
							:selected="
								disease == selectedDisease ? true : false
							"
						>
							{{ disease }}
						</option>
					</template>
				</select>
			</div>
			<div
				class="ph-builder-filters-wrapper"
				v-if="focusBy == 'correlation'"
			>
				correlations UI
				<phenotype-selectpicker
					v-if="!!phenotypes"
					:phenotypes="phenotypes"
					:clearOnSelected="true"
					:useInLocal="true"
					localPlace="diseaseSystems"
				></phenotype-selectpicker>
			</div>

			<div class="table-wrapper" v-if="!!phenotypeCorrelation">
				<table class="table table-striped table-sm">
					<thead>
						<tr>
							<th>Select</th>
							<th>Phenotypes</th>
							<th>P-Value</th>
							<th>Correlation</th>
							<th>Standard error</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="phenotype in phenotypeCorrelation.data">
							<td>
								<input
									class="phenotype-chkbox"
									type="checkbox"
									:value="phenotype.other_phenotype"
									checked
								/>
							</td>
							<td class="phenotype-name">
								{{ phenotype.other_phenotype }}
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
									formatValue("pValueFormatter", phenotype.rg)
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
						</tr>
					</tbody>
				</table>
			</div>
			<div class="session-info" v-if="!!phenotypeCorrelation">
				<button
					type="button"
					class="btn btn-primary btn-sm"
					@click="saveCustomPhenotypes()"
				>
					Save list
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
			selectedDisease: null,
			focusBy: null,
		};
	},
	components: { PhenotypeSelectPicker },
	mounted() {
		this.setDiseaseSystems();
		this.getCustomPhenotypes();
	},
	methods: {
		...sessionUtils,
		...uiUtils,
		...sortUtils,
		...userUtils,
		...Formatters,
		getCorrelation() {
			console.log("fire 2");
		},
		formatValue(FORMATTER, VALUE) {
			return Formatters[FORMATTER](VALUE);
		},
		callCustomPhActions(EVENT) {
			switch (EVENT) {
				case "reset":
					this.resetCustomPhenotypes();
					break;
				case "correlation":
					this.openPhenotypesBuilder(null, null, "correlation");
					break;
				case "disease":
					this.openPhenotypesBuilder(
						this.diseaseInSession,
						null,
						"disease"
					);
					break;
			}
		},
		getCustomPhenotypes() {
			let customPhsSet = userUtils.getPhenotypes();
			let selectedDisease = !!customPhsSet ? customPhsSet.id : null;
			let selectedPhs = !!customPhsSet ? customPhsSet.list : null;

			this.selectedDisease = selectedDisease;
			this.$store.dispatch("phenotypesInSession", selectedPhs);
			this.$store.dispatch("diseaseInSession", selectedDisease);
		},
		resetCustomPhenotypes() {
			userUtils.clearPhenotypes();
			this.getCustomPhenotypes();
			uiUtils.hideElement("pheno_list_builder");
		},
		saveCustomPhenotypes() {
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

			this.$store.dispatch("phenotypesInSession", phList);
			this.$store.dispatch("diseaseInSession", id);
			this.selectedDisease = null;

			uiUtils.hideElement("pheno_list_builder");
		},
		closePhenotypesBuilder() {
			uiUtils.hideElement("pheno_list_builder");
		},
		openPhenotypesBuilder(DISEASE, EVENT, TYPE) {
			this.selectedDisease = !!EVENT ? EVENT.target.value : DISEASE;
			uiUtils.showElement("pheno_list_builder");
			if (TYPE == "disease") {
				this.focusBy = "disease";
			} else if (TYPE == "correlation") {
				this.focusBy = "correlation";
			}
		},
		getPhenotypes() {
			let phAssoDisease = [
				...new Set(
					this.$store.state.bioPortal.diseaseSystems
						.filter((d) => d.disease == this.selectedDisease)
						.map((d) => d.phenotype)
				),
			];

			let rawPhs = this.phenotypes;
			let filteredPhs = [];

			phAssoDisease.map((p) => {
				rawPhs.map((rp) => {
					if (rp.name.toLowerCase() == p.toLowerCase()) {
						filteredPhs.push(rp);
					}
				});
			});

			sortUtils.sort(filteredPhs, "description", false, true);

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
			let diseaseSystems = [
				...new Set(
					this.diseases
						.filter((d) => d.system == ID + " system")
						.map((d) => d.disease)
				),
			];

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

.disease-systems-sub-pages .select-disease-wrapper {
	position: absolute;
	z-index: 200;
	top: 16px;
	left: 140px;
	color: #fff;
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
	margin-left: 8px;
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
	left: calc(50% - 250px);
	width: 500px;
	height: 75%;
	text-align: left;
	background-color: #fff;
	padding: 15px;
	-webkit-box-shadow: 10px 10px 10px 10px rgb(0 0 0 / 20%);
	box-shadow: 10px 10px 10px 10px rgb(0 0 0 / 20%);
	border-radius: 5px;
	z-index: 101;
	text-align: center;
}

.custom-phenotypes-list-builder .table-wrapper {
	width: 100%;
	height: calc(100% - 130px);
	overflow-y: auto;
	margin-bottom: 15px;
	border: solid 1px #ddd;
	font-size: 14px;
}

.custom-phenotypes-list-builder .table-wrapper table {
	margin-top: -1px;
}
.custom-phenotypes-list-builder table td.phenotype-name {
	text-align: left;
}

.session-info {
	width: 100%;
}

.session-info button {
	margin: 0 5px 0 5px;
}

.reset-button {
	font-size: 14px;
	padding: 0 10px;
	border-radius: 15px;
	position: absolute;
	top: -40px;
	right: 20px;
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
	margin: 0 10px 5px 10px;
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

.disease-name {
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
</style>
