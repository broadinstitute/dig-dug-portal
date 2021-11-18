<template>
	<div>
		<div :id="pkgID"></div>
		<div id="viewers_collection">
			<kp-region-viewer
				:id="pkgID + '_kpRegionViewer'"
				:plotData="pkgConfig.kpRegionViewer.data"
				:plotLayout="pkgConfig.plotLayout"
				:renderConfig="pkgConfig.kpRegionViewer.viewerConfig"
				:region="pkgConfig.kpRegionViewer.region"
			></kp-region-viewer>
			<div :id="pkgID + '_kpGenesTrack'">kpGenesTrack</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";

import { BootstrapVueIcons } from "bootstrap-vue";

import kpRegionViewer from "@/components/kpDataViewer/kpRegionViewer.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("kp-data-viewer-pkg", {
	props: ["pkgConfig"],
	data() {
		return {};
	},
	modules: {
		uiUtils,
	},
	components: { kpRegionViewer },
	mounted: function () {
		if (this.pkgConfig != null) {
			console.log("mounted", this.pkgConfig.viewers);
			let viewersWrapper = document.getElementById(this.pkgConfig.pkgID);
			this.pkgConfig.viewers.map((v) => {
				let viewer = document.getElementById(
					this.pkgConfig.pkgID + "_" + v
				);
				viewersWrapper.appendChild(viewer);
			});
		}
	},
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



