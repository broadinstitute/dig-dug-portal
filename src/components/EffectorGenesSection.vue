<template>
	<div>
		{{ eglsList }}
		<div class="col-md-12 col">
			<div class="row egls-list-header">
				<div class="col-md-4">Name</div>
				<div class="col-md-4">Reference</div>
				<div class="col-md-2">PMID</div>
				<div class="col-md-2">View Genes</div>
			</div>
			<div class="row egls-list" v-for="item in eglsList">
				<div class="col-md-4" v-html="item['Effector list name']"></div>
				<div
					class="col-md-4"
					v-html="item['Title'] + '. ' + item['Citation']"
				></div>
				<div
					class="col-md-2"
					v-html="
						item['PMID'] != 'undefined' &&
						item['PMID'] != undefined &&
						item['PMID'] != ''
							? '<a target=\'_blank\'href=\'https://pubmed.ncbi.nlm.nih.gov/' +
							  item['PMID'] +
							  '\'>' +
							  item['PMID'] +
							  '</a>'
							: ''
					"
				></div>
				<div
					class="col-md-2"
					v-html="
						item['Page ID'] != 'undefined' &&
						item['Page ID'] != undefined &&
						item['Page ID'] != ''
							? '<a class=\'btn btn-sm btn-primary view-genes\' target=\'_blank\'href=\'\\research.html?pageid=' +
							  item['Page ID'] +
							  '\' style=\'color: #ffffff !important;\'>View genes</a>'
							: ''
					"
				></div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import dataConvert from "@/utils/dataConvert";
import byorEffectorGenes from "@/utils/byorEffectorGenes";

export default Vue.component("egls-section", {
	props: ["phenotype"],
	components: {},
	modules: {},
	data() {
		return {
			//eglsList: null,
		};
	},
	created() {
		//this.loadEglsList();
	},
	computed: {
		eglsList() {
			let eglsList = byorEffectorGenes.getEglsList(this.phenotype);

			console.log("eglsList", eglsList);

			return eglsList;
		},
	},
	watch: {},
	methods: {
		loadEglsList() {},
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
</style>