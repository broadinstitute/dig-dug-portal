<template>
	<div>
		<b-container fluid="sm" v-for="key in Object.keys(topAssociationsGrouped)">
			<b-form-row>
				<div class="phenotype-group-header col-sm-3" v-b-toggle="key2id(key)">{{ key }}:</div>

				<div class="col-sm-9 pt-1">
					<b-progress class="phenotype-group" :class="key" height="2rem">
						<template v-for="(item, i) in topAssociationsGrouped[key]">
							<b-progress-bar v-if="i == 0" :value="log2css(item.pValue)">
								<span class="bar-desc">{{item.description}} - {{item.pValue}}</span>
							</b-progress-bar>
							<span
								v-b-tooltip
								v-b-hover="highlight"
								class="marker"
								v-else
								:title="item.description"
								:style="{'margin-left': 'calc('+log2css(item.pValue)+'% - 10px'}"
							>&nbsp;</span>
						</template>
					</b-progress>
					<b-collapse :id="key2id(key)" accordion="my-accordion">
						<div v-for="item in topAssociationsGrouped[key]">
							{{item.description}} - {{item.pValue}} - {{log2css(item.pValue)}}
							<b-progress
								height="2rem"
								class="phenotype-group"
								:class="item.group"
								:value="log2css(item.pValue)"
							></b-progress>
						</div>
					</b-collapse>
				</div>
			</b-form-row>
		</b-container>
	</div>
</template>

<script>
import Vue from "vue";
import groupBy from "lodash/groupBy";

export default Vue.component("phenotype-signal", {
	props: ["phenotypes"],

	data() {
		return {};
	},
	computed: {
		topAssociationsHighest() {
			return this.phenotypes[0]["pValue"];
		},

		topAssociationsGrouped() {
			let data = this.phenotypes;

			data.forEach(
				element => (
					(element[
						"group"
					] = this.$store.state.bioPortal.phenotypeMap[
						element.phenotype
					].group),
					(element[
						"description"
					] = this.$store.state.bioPortal.phenotypeMap[
						element.phenotype
					].description)
				)
			);
			return groupBy(data, "group");
		}
	},
	methods: {
		log2css(value) {
			const minp = 0;
			const maxp = 100;
			const minv = -Math.log10(10);
			const maxv = -Math.log10(this.topAssociationsHighest);

			const scale = (maxv - minv) / (maxp - minp);

			return -(Math.log(value) - minv) / scale + minp;
		},
		key2id(key) {
			return key
				.toLowerCase()
				.split(" ")
				.join("_");
		},
		highlight(isHovered) {
			if (isHovered) {
				console.log("Hi");
			}
		}
	}
});
</script>

<style>
@import url("/css/phenotypeGroups.css");
</style>
