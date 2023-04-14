<template>
	<div>
		<div
			class="col-md-12 col"
			v-if="!!eglsList && !!eglsOnGene && eglsOnGene.length > 0"
		>
			<div class="row egls-list-header">
				<div class="col-md-4">Name</div>
				<div class="col-md-2">Trait</div>
				<div class="col-md-4">Reference</div>
				<div class="col-md-1">PMID</div>
				<div class="col-md-1">View full list</div>
			</div>
			<div class="row egls-list" v-for="egl in eglsOnGene">
				<template v-if="!!eglsList[egl.field_page_id]">
					<div
						class="col-md-4"
						v-html="
							eglsList[egl.field_page_id]['Effector list name']
						"
					></div>
					<div
						class="col-md-2"
						v-html="eglsList[egl.field_page_id]['Trait']"
					></div>
					<div
						class="col-md-4"
						v-html="
							eglsList[egl.field_page_id]['Title'] +
							'. ' +
							eglsList[egl.field_page_id]['Citation']
						"
					></div>
					<div
						class="col-md-1"
						v-html="
							eglsList[egl.field_page_id]['PMID'] !=
								'undefined' &&
							eglsList[egl.field_page_id]['PMID'] != undefined &&
							eglsList[egl.field_page_id]['PMID'] != ''
								? '<a target=\'_blank\'href=\'https://pubmed.ncbi.nlm.nih.gov/' +
								  eglsList[egl.field_page_id]['PMID'] +
								  '\'>' +
								  eglsList[egl.field_page_id]['PMID'] +
								  '</a>'
								: ''
						"
					></div>
					<div
						class="col-md-1"
						v-html="
							eglsList[egl.field_page_id]['Page ID'] !=
								'undefined' &&
							eglsList[egl.field_page_id]['Page ID'] !=
								undefined &&
							eglsList[egl.field_page_id]['Page ID'] != ''
								? '<a class=\'btn view-features-btn btn-secondary view-genes\' target=\'_blank\'href=\'\\research.html?pageid=' +
								  eglsList[egl.field_page_id]['Page ID'] +
								  '\' style=\'color: #ffffff !important;\'>View</a>'
								: ''
						"
					></div>
				</template>
			</div>
		</div>
		<div
			v-else
			class="well well-warning"
			style="background-color: #ff000050"
		>
			No predicted effector genes list found associated with
			{{ gene.name }}.
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import dataConvert from "@/utils/dataConvert";

export default Vue.component("egls-section-on-gene", {
	props: ["gene"],
	components: {},
	data() {
		return {
			eglsList: null,
			eglsOnGene: null,
		};
	},
	created() {
		this.loadEglsList();
		this.getEglsWithGene();
	},
	computed: {},
	watch: {
		gene(newGene, oldGene) {
			this.getEglsWithGene();
		},
	},
	methods: {
		async loadEglsList() {
			let dataPoint =
				"https://hugeampkpncms.org/rest/data?pageid=egl_241";

			let contJson = await fetch(dataPoint).then((resp) => resp.json());

			if (contJson.error == null) {
				//console.log(contJson[0]["field_data_points"]);
				let data = dataConvert.csv2Json(
					contJson[0]["field_data_points"]
				);

				let eglsList = {};

				data.map((d) => {
					eglsList[d["Page ID"]] = d;
				});

				//console.log("full list", eglsList);
				this.eglsList = eglsList;
			}
		},
		async getEglsWithGene() {
			let dataPoint =
				"https://hugeampkpncms.org/rest/egls?gene=" + this.gene.name;

			let contJson = await fetch(dataPoint).then((resp) => resp.json());

			if (contJson.error == null) {
				//console.log("with gene", contJson);
				//{"field_page_id":"richards_t2d_266"}
				this.eglsOnGene = contJson;
			}
		},
	},
});
</script>
<style scoped>
.egls-list-header {
	font-weight: bold;
	border-top: solid 2px #ddd;
	border-bottom: solid 1px #ddd;
	padding: 7px 0;
}
.egls-list {
	border-top: solid 1px #ddd;
	margin-bottom: 7px;
	padding-top: 7px;
}
.well.well-warning {
	padding: 15px;
	border-radius: 15px;
}
</style>