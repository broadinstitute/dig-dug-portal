<template>
	<!-- Menu header-->
	<div v-if="diseaseGroup" class="container-fluid">
		<div class="row amp-header" v-if="diseaseGroup.default">
			<div class="amp-banner-right">
				<div class="amp-banner-left">
					<a
						href="http://www.nih.gov/research-training/accelerating-medicines-partnership-amp/type-2-diabetes"
					>ACCELERATING MEDICINES PARTNERSHIP (AMP)</a>
				</div>
			</div>
		</div>
		<div class="row amp-header" v-if="!diseaseGroup.default" style="height: 50px;">
			<div class="amp-banner-right" style="height: 50px;">
				<a :href="url2Md">
					<div class="amp-banner-left" style="padding: 5px; text-align: center;height: 50px;">
						<img
							:src="'http://kp4cd.org/sites/default/files/vueportal/portals2mdkp_banner.svg'"
							:class="'portals-2-mdkp-logo'"
						/>
					</div>
				</a>
			</div>
		</div>
		<div :class="'row '+diseaseGroup.name+'kp-header'">
			<div :class="diseaseGroup+'kp-logo-wrapper col-md-4'">
				<img
					:src="'http://kp4cd.org/sites/default/files/vueportal/'+frontContents.field_banner_logo"
					:class="diseaseGroup.name+'kp-logo'"
				/>
				<div
					:class="'header-disease-group-select-wrapper'"
					v-if="diseaseGroup.default && currentPage != '/' && currentPage != ''"
				>
					<disease-group-select :disease-groups="diseaseGroups"></disease-group-select>
				</div>
			</div>
			<div :class="diseaseGroup.name+'kp-menu-wrapper col-md-8'">
				<ul :class="diseaseGroup.name+'kp-menu'">
					<li>
						<a href="/">Home</a>
					</li>
					<li>
						<a :href="translatedDataPage">Data</a>
					</li>
					<li>
						<a href>Tools</a>
					</li>
					<li>
						<a href>Information</a>
					</li>
					<li>
						<a href>Help</a>
					</li>
					<li v-if="user">
						<a href="/logout" :class="diseaseGroup.name+'kp-login'">Logout</a>
					</li>
					<li v-else>
						<a href="/login" @click="saveCurrentPage" :class="diseaseGroup.name+'kp-login'">Login</a>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import VueCookies from "vue-cookies";

import host from "@/utils/hostUtils";
import DiseaseGroupSelect from "@/components/DiseaseGroupSelect.vue";

Vue.use(VueCookies);

export default Vue.component("page-header", {
	props: ["diseaseGroups", "diseaseGroup", "frontContents"],

	components: {
		DiseaseGroupSelect
	},

	data() {
		return {};
	},
	created() {
		this.user = Vue.$cookies.isKey("email") || false; //check email for now, will check session when implemented
	},
	computed: {
		currentPage() {
			return window.location.pathname;
		},
		url2Md() {
			return host.urlWithSubdomain().href;
		},
		translatedDataPage() {
			let kp4cd_xform = {
				t2d: "t2d",
				sleep: "sleep",
				cvd: "mi",
				cd: "stroke"
			};

			let name = kp4cd_xform[this.diseaseGroup.name];

			return `http://kp4cd.org/datasets/${name || "md"}`;
		}
	},
	methods: {
		saveCurrentPage() {
			Vue.$cookies.set("whereAmI", location.href);
		}
	}
});
</script>
