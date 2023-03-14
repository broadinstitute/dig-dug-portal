<template>
	<div class="byor-projects">
		<h3>Projects on BYOR.science</h3>
		<div
			v-for="item in byorProjects"
			:key="item.field_page_id"
			class="row project-wrapper"
		>
			<div class="col-md-3 project-img-wrapper">
				<img :src="item.field_image_byor_front" class="project-img" />
			</div>
			<div class="col-md-9">
				<h5 v-html="item.title"></h5>
				<p>
					{{ item.field_byor_project_summary }} |
					<a :href="item.field_url_to_page">Open project</a>
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-byor-projects", {
	props: [],
	data() {
		return {
			byorProjects: null,
		};
	},
	modules: {
		uiUtils,
	},
	components: {},
	mounted: function () {
		this.getByorProjects();
	},
	beforeDestroy() {},
	computed: {},
	watch: {},
	methods: {
		async getByorProjects() {
			let cmsServer =
				"https://config.byor.science/rest/views/byor_projects";

			let projectsJson = await fetch(cmsServer).then((resp) =>
				resp.json()
			);

			if (projectsJson.error == null) {
				this.byorProjects = projectsJson;
			}
		},
	},
});

$(function () {});
</script>

<style>
.byor-projects {
	padding: 35px 0 55px 0;
}
.project-wrapper {
	margin: 10px 0;
	border-top: solid 1px #ddd;
	padding-top: 15px;
}
.project-img {
	max-width: 230px;
	max-height: 150px;
	border: solid 1px #aaa;
	background-color: #ddd;
}

.project-img-wrapper {
	text-align: center;
	padding: 0;
}
</style>



