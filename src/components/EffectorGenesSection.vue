<template>
	<div>
		{{ eglsList }}
	</div>
</template>

<script>
import Vue from "vue";
import dataConvert from "@/utils/dataConvert";

export default Vue.component("egls-section", {
	props: ["phenotype"],
	components: {},
	data() {
		return {
			eglsList: null,
		};
	},
	created() {
		this.loadEglsList();
	},
	computed: {},
	watch: {},
	methods: {
		async loadEglsList() {
			let dataPoint =
				"https://hugeampkpncms.org/rest/data?pageid=egl_241&accessid=egls&accesskey=egls_pw";

			let contJson = await fetch(dataPoint).then((resp) => resp.json());

			if (contJson.error == null) {
				//console.log(contJson[0]["field_data_points"]);
				let data = dataConvert.csv2Json(
					contJson[0]["field_data_points"]
				);

				let eglList = [];

				data.map((e) => {
					//console.log(e);
					if (
						!!e["Trait ID"] &&
						!!e["Trait ID"].includes(this.phenotype.name)
					) {
						eglList.push(e);
					}
				});
				console.log("json data", eglList);
				this.eglsList = eglList;
			}
		},
	},
});
</script>
<style scoped>
</style>