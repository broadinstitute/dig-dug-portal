<template>
	<div class="row" :id="pkgID">{{ pkgID }}</div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";

import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("kp-data-viewer-pkg", {
	props: ["pkgConfig"],
	data() {
		return {};
	},
	modules: {
		uiUtils,
	},
	components: {},
	mounted: function () {},
	beforeDestroy() {},
	computed: {
		pkgID() {
			if (this.pkgConfig == null) {
				return null;
			} else {
				return this.pkgConfig.pkgID;
			}
		},
	},
	watch: {},
	methods: {
		...uiUtils,
	},
});
</script>

<style>
</style>



