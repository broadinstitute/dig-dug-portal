<template>
	<div
		class="row"
		:class="
			page == 'front'
				? 'disease-systems-front'
				: 'disease-systems-sub-pages'
		"
	>
		<div
			class="custom-phenotypes-list-builder hidden"
			id="pheno_list_builder"
		>
			<h5>Build phenotypes list</h5>
			<div>
				<select @change="openPhenotypesBuilder(null, $event)">
					<template v-for="system in diseaseSystems">
						<option class="disease-name" value="">
							{{ system }}
						</option>
						<option
							class="disease-name"
							v-for="disease in diseaseOptions(system)"
							:value="disease"
						>
							{{ disease }}
						</option>
					</template>
				</select>
			</div>
			<div class="table-wrapper">
				<table class="table table-striped table-sm">
					<thead>
						<tr>
							<th>Select</th>
							<th>Phenotypes</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="phenotype in getPhenotypes()">
							<td><input type="checkbox" checked /></td>
							<td>{{ phenotype.description }}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="session-info">
				<div><input type="text" id="session_id" /></div>
				<button type="button" class="btn btn-primary">Save list</button>
			</div>
		</div>
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
						<h5>Limit phenotypes by a disease</h5>
						<div
							class="disease-name"
							v-for="disease in diseaseOptions(system)"
							:key="disease"
						>
							<a
								href="javascript:;"
								@click="openPhenotypesBuilder(disease)"
								>{{ disease }}</a
							>
						</div>
						<p></p>
						<h5 v-if="kpDiseasePair(system).length > 0">
							Community portals
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
				<img
					class="disease-systems-icon"
					src="https://kp4cd.org/sites/default/files/images/disease_systems/setting.svg"
				/>
				<span>Custom setting</span>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils.js";
import sessionUtils from "@/utils/sessionUtils.js";
import sortUtils from "@/utils/sortUtils.js";

export default Vue.component("disease-systems", {
	props: ["page", "phenotypes", "diseases", "diseaseGroups"],

	data() {
		return {
			diseaseSystems: [],
			sessionId: null,
			selectedDisease: null,
		};
	},
	mounted() {
		this.setDiseaseSystems();
		this.setSessionId();
	},
	methods: {
		...sessionUtils,
		...uiUtils,
		...sortUtils,
		openPhenotypesBuilder(DISEASE, EVENT) {
			console.log("called: " + DISEASE);
			this.selectedDisease = !!EVENT ? EVENT.target.value : DISEASE;

			uiUtils.showElement("pheno_list_builder");
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
		setPhenotypesInSession(DISEASE) {
			/*let phAssoDisease = [
				...new Set(
					this.$store.state.bioPortal.diseaseSystems
						.filter((d) => d.disease == DISEASE)
						.map((d) => d.phenotype)
				),
			];*/

			this.$store.dispatch("phenotypesInSession", phAssoDisease);
			this.selectedDisease = null;

			uiUtils.hideElement("pheno_list_builder");
		},
		setSessionId() {
			let newSessionId = sessionUtils.generate();
			this.sessionId = newSessionId;
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
			let rawList = [
				{
					"kp id": "autoimmune",
					disease: "Allergic disease",
					system: "Immune",
				},
				{
					"kp id": "autoimmune",
					disease: "Celiac disease",
					system: "Immune",
				},
				{
					"kp id": "autoimmune",
					disease: "Inflammatory bowel disease",
					system: "Immune",
				},
				{
					"kp id": "autoimmune",
					disease: "Multiple sclerosis",
					system: "Immune",
				},
				{
					"kp id": "autoimmune",
					disease: "Nephrotic syndrome",
					system: "Immune",
				},
				{
					"kp id": "autoimmune",
					disease: "Rheumatoid arthritis",
					system: "Immune",
				},
				{
					"kp id": "autoimmune",
					disease: "Systemic lupus erythematosus",
					system: "Immune",
				},
				{
					"kp id": "autoimmune",
					disease: "Type 1 diabetes",
					system: "Immune",
				},
				{
					"kp id": "cd",
					disease: "Cerebrovascular disease",
					system: "Cardiovascular",
				},
				{
					"kp id": "cvd",
					disease: "Atrial fibrillation",
					system: "Cardiovascular",
				},
				{
					"kp id": "cvd",
					disease: "Coronary artery disease",
					system: "Cardiovascular",
				},
				{
					"kp id": "cvd",
					disease: "Heart failure",
					system: "Cardiovascular",
				},
				{
					"kp id": "cvd",
					disease: "Mitral valve prolapse",
					system: "Cardiovascular",
				},
				{
					"kp id": "cvd",
					disease: "Nonischemic cardiomyopathy",
					system: "Cardiovascular",
				},
				{
					"kp id": "cvd",
					disease: "Vascular disease",
					system: "Cardiovascular",
				},
				{
					"kp id": "lung",
					disease: "Asthma",
					system: "Respiratory",
				},
				{
					"kp id": "lung",
					disease: "Chronic obstructive pulmonary disease",
					system: "Respiratory",
				},
				{
					"kp id": "lung",
					disease: "COVID-19",
					system: "Respiratory",
				},
				{
					"kp id": "lung",
					disease: "Idiopathic pulmonary fibrosis",
					system: "Respiratory",
				},
				{
					"kp id": "msk",
					disease: "Musculoskeletal disorders",
					system: "Musculoskeletal",
				},
				{
					"kp id": "ndkp",
					disease: "ALS",
					system: "Nervous",
				},
				{
					"kp id": "ndkp",
					disease: "Alzheimer's disease",
					system: "Nervous",
				},
				{
					"kp id": "ndkp",
					disease: "Lewy body dementia",
					system: "Nervous",
				},
				{
					"kp id": "ndkp",
					disease: "Parkinson's disease",
					system: "Nervous",
				},
				{
					"kp id": "ocular",
					disease: "Age-related macular degeneration",
					system: "Sensory",
				},
				{
					"kp id": "ocular",
					disease: "Glaucoma",
					system: "Sensory",
				},
				{
					"kp id": "reproductive",
					disease: "Gestational diabetes",
					system: "Reproductive",
				},
				{
					"kp id": "sleep",
					disease: "Sleep disorders",
					system: "Nervous",
				},
				{
					"kp id": "t1d",
					disease: "Type 1 diabetes",
					system: "Endocrine",
				},
				{
					"kp id": "t1d",
					disease: "Type 1 diabetes",
					system: "Immune",
				},
				{
					"kp id": "t2d",
					disease: "Cirrhosis",
					system: "Endocrine",
				},
				{
					"kp id": "t2d",
					disease: "Gestational diabetes",
					system: "Endocrine",
				},
				{
					"kp id": "t2d",
					disease: "Kidney disease",
					system: "Endocrine",
				},
				{
					"kp id": "t2d",
					disease: "NAFLD",
					system: "Endocrine",
				},
				{
					"kp id": "t2d",
					disease: "Obesity",
					system: "Growth & Development",
				},
				{
					"kp id": "t2d",
					disease: "Type 1 diabetes",
					system: "Endocrine",
				},
				{
					"kp id": "t2d",
					disease: "Type 2 diabetes",
					system: "Endocrine",
				},
				{
					"kp id": "t2d",
					disease: "Vascular disease",
					system: "Cardiovascular",
				},
				{
					"kp id": "md",
					disease: "Cerebrovascular disease",
					system: "Cardiovascular",
				},
				{
					"kp id": "md",
					disease: "Atrial fibrillation",
					system: "Cardiovascular",
				},
				{
					"kp id": "md",
					disease: "Coronary artery disease",
					system: "Cardiovascular",
				},
				{
					"kp id": "md",
					disease: "Heart failure",
					system: "Cardiovascular",
				},
				{
					"kp id": "md",
					disease: "Mitral valve prolapse",
					system: "Cardiovascular",
				},
				{
					"kp id": "md",
					disease: "Nonischemic cardiomyopathy",
					system: "Cardiovascular",
				},
				{
					"kp id": "md",
					disease: "Vascular disease",
					system: "Cardiovascular",
				},
				{
					"kp id": "md",
					disease: "Sleep disorders",
					system: "Nervous",
				},
				{
					"kp id": "md",
					disease: "Type 1 diabetes",
					system: "Endocrine",
				},
				{
					"kp id": "md",
					disease: "Type 1 diabetes",
					system: "Immune",
				},
				{
					"kp id": "md",
					disease: "Cirrhosis",
					system: "Endocrine",
				},
				{
					"kp id": "md",
					disease: "Gestational diabetes",
					system: "Endocrine",
				},
				{
					"kp id": "md",
					disease: "Kidney disease",
					system: "Endocrine",
				},
				{
					"kp id": "md",
					disease: "NAFLD",
					system: "Endocrine",
				},
				{
					"kp id": "md",
					disease: "Obesity",
					system: "Growth & Development",
				},
				{
					"kp id": "md",
					disease: "Type 1 diabetes",
					system: "Endocrine",
				},
				{
					"kp id": "md",
					disease: "Type 2 diabetes",
					system: "Endocrine",
				},
				{
					"kp id": "md",
					disease: "Vascular disease",
					system: "Cardiovascular",
				},
			];
			let content = [];

			rawList.map((r) => {
				if (r["system"].toLowerCase() == SYSTEM.toLowerCase()) {
					if (DISEASE != null && r["disease"] == DISEASE) {
						content.push(r["kp id"]);
					} else if (DISEASE == null) {
						content.push(r["kp id"]);
					}
				}
			});

			content = [...new Set(content)];

			let kps = [];

			content.map((c) => {
				let tempArr = this.diseaseGroups.filter((dg) => dg.name == c);

				kps.push(tempArr[0]);
			});

			return kps;
		},
	},
});
</script>
<style scoped>
.custom-phenotypes-list-builder {
	position: fixed;
	top: 15%;
	left: calc(50% - 250px);
	width: 500px;
	height: 75%;
	text-align: left;
	background-color: #fff;
	padding: 10px 0 10px 10px;
	-webkit-box-shadow: 10px 10px 10px 10px rgb(0 0 0 / 20%);
	box-shadow: 10px 10px 10px 10px rgb(0 0 0 / 20%);
	border-radius: 5px;
	z-index: 101;
	text-align: center;
}

.custom-phenotypes-list-builder .table-wrapper {
	width: 100%;
	height: calc(100% - 150px);
	overflow-y: auto;
	margin-bottom: 15px;
	padding: 0 10px 0 10px;
}
.custom-phenotypes-list-builder table td {
	text-align: left;
}

.session-info {
	height: 150px;
	width: 100%;
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
