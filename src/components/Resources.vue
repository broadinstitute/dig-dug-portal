<template>
	<div class="row">
		<div class="col-md-3">
			<ul>
				<li v-for="(row, i) in documentResourcesList">
					<a
						:href="'#' + row.nid"
						v-html="row.title"
						v-on:click="setSeletedResource(row.nid)"
					></a>
				</li>
			</ul>
		</div>
		<div class="col-md-9">
			<h2>Videos</h2>
			<div class="page-info-wrapper">
				<div
					v-for="(row, i) in videoResourcesList"
					class="resource-item-wrapper"
				>
					<h3 :id="'resource_content_title' + row.nid">
						<a
							href="javascript:;"
							v-on:click="setSeletedResource(row.nid)"
							>{{ row.title }}</a
						>
					</h3>
					<div>
						<span v-html="row.body"></span>&nbsp;&nbsp;
						<span>
							<a
								href="javascript:;"
								v-on:click="setSeletedResource(row.nid)"
								>View video...</a
							>
						</span>
					</div>
					<div
						:id="'resource_content' + row.nid"
						class="resource-content-wrapper"
						:class="
							selectedResource != null &&
							row.nid == selectedResource
								? ''
								: 'hidden'
						"
					>
						<p v-html="row.body_1"></p>
						<div class="resources-iframe-wrapper">
							<iframe
								width="560"
								height="315"
								:src="
									'https://www.youtube.com/embed/' +
									row.field_video_id
								"
								frameborder="0"
								allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							></iframe>
						</div>
					</div>
				</div>
			</div>

			<h2>Help documentation</h2>
			<div class="page-info-wrapper">
				<div
					v-for="(row, i) in documentResourcesList"
					class="resource-item-wrapper"
					:id="row.nid"
				>
					<h3 :id="'resource_content_title' + row.nid">
						<a
							:href="'#' + row.nid"
							v-on:click="setSeletedResource(row.nid)"
							>{{ row.title }}</a
						>
					</h3>
					<div>
						<span v-html="row.body"></span>&nbsp;&nbsp;
						<span>
							<a
								:href="'#' + row.nid"
								v-on:click="setSeletedResource(row.nid)"
								>View tutorial...</a
							>
						</span>
					</div>
					<div
						v-html="row.body_1"
						:id="'resource_content' + row.nid"
						class="resource-content-wrapper"
						:class="
							selectedResource != null &&
							row.nid == selectedResource
								? ''
								: 'hidden'
						"
					></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("resources-section", {
	props: ["resources", "nid"],
	data() {
		return {
			selectedResource: this.nid,
		};
	},
	computed: {
		videoResourcesList: function () {
			let rawResources = this.resources;

			let content = [].slice
				.call(rawResources)
				.filter((r) => r["field_resource_type"] == "Video");

			return content;
		},
		documentResourcesList: function () {
			let rawResources = this.resources;

			let content = [].slice
				.call(rawResources)
				.filter((r) => r["field_resource_type"] == "Document");

			return content;
		},
	},
	updated: function () {
		if (this.selectedResource != null) {
			let element = document.getElementById(
				"resource_content_title" + this.selectedResource
			);
			if (!!element) {
				element.scrollIntoView(true);
				element.scrollIntoView({
					behavior: "smooth",
					block: "start",
					inline: "nearest",
				});
			}
		}
	},
	methods: {
		...uiUtils,
		setSeletedResource(nid) {
			this.selectedResource == nid
				? (this.selectedResource = null)
				: (this.selectedResource = nid);
		},
	},
});
</script>

