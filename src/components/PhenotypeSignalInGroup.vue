<template>
	<div>
		<div class="new-phenotypes-with-signal-wrapper">
			<a
				href="javascript:;"
				v-on:click="popOutElement('pws-bar-view')"
				class="pop-out-icon"
				>&nbsp;</a
			>
			<div class="p-bellow-section-header">
				<sup>*</sup> Colored bars summarize bottom-line meta-analyzed
				associations for phenotypes in a group. Hover over bar or expand
				the group to see associations for individual phenotypes.
			</div>

			<div class="pws-phenotype-group-container">
				<div class="pws-phenotype-group-row">
					<div class="pws-phenotype-group-header">
						Phenotype group
					</div>
					<div class="pws-phenotype-group-wrapper">
						<div class="legend-scale">
							<span class="legend-left">0</span>
							<span class="legend-center">-log10(p)</span>
							<span class="legend-right" v-if="phenotypes[0]">
								{{ getEvalue(phenotypes[0]["pValue"]) }}
							</span>
						</div>
						<div class="legend"></div>
					</div>
				</div>
			</div>
			<div
				v-for="key in Object.keys(topAssociationsGrouped)"
				class="pws-phenotype-group-container pws-phenotype-group"
				:class="key"
				:key="key"
			>
				<div class="pws-phenotype-group-row">
					<div
						class="pws-phenotype-group-header"
						v-on:click="
							showHideByClass('pws-phenotype-row ' + key2id(key))
						"
					>
						{{ key }}
						<b-icon-arrows-expand></b-icon-arrows-expand>
					</div>
					<div class="pws-phenotype-group-wrapper">
						<template
							v-for="(item, i) in topAssociationsGrouped[key]"
						>
							<template v-if="i != 0">
								<div
									v-if="item.pValue <= 5e-3"
									class="pws-phenotype-summary-row"
									:style="{
										width: +pValueCss(item.pValue) + '%',
									}"
									@click="
										showHideByClass(
											'pws-phenotype-row ' + key2id(key)
										)
									"
									:key="item.phenotype"
								>
									<div
										class="pws-progress-bar"
										style="width: 100%"
									></div>

									<span class="tool-tip">
										{{
											item.description +
											" (" +
											pValueFormatter(item.pValue) +
											")"
										}}
									</span>
								</div>
							</template>
							<div
								class="pws-phenotype-row"
								:class="i != 0 ? key2id(key) + ' hidden' : ''"
								:key="i"
							>
								<div
									class="pws-progress-bar"
									:key="item.phenotype"
									:value="pValueCss(item.pValue)"
									:style="
										'background-color: ' +
										getColor(key) +
										' !important; width: ' +
										pValueCss(item.pValue) +
										'%;'
									"
									@click="
										i === 0
											? showHideByClass(
													'pws-phenotype-row ' +
														key2id(key)
											  )
											: i
									"
								>
									<!--<div
									class="pws-progress-bar"
									:key="item.phenotype"
									:value="pValueCss(item.pValue)"
									:style="{
										width: +pValueCss(item.pValue) + '%',
										'background-color':
											+getColor(key) + ' !important',
									}"
									@click="
										i === 0
											? showHideByClass(
													'pws-phenotype-row ' +
														key2id(key)
											  )
											: i
									"
								>-->
									<span
										class="bar-desc"
										:style="{
											'margin-left':
												'calc(' +
												pValueCss(item.pValue) +
												'% + 10px)',
										}"
									>
										{{ item.description }} ({{
											pValueFormatter(item.pValue)
										}})
										<div class="options-4-actions">
											<div
												@click="
													addPhenotype(item.phenotype)
												"
											>
												Add this phenotype below
											</div>

											<div
												v-on:click="
													openPage('phenotype.html', {
														phenotype:
															item.phenotype,
													})
												"
											>
												Go to phenotype page
											</div>
										</div>
									</span>
								</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import groupBy from "lodash/groupBy";
import { BootstrapVueIcons } from "bootstrap-vue";
import uiUtils from "@/utils/uiUtils";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVueIcons);

export default Vue.component("phenotype-signal-in-group", {
	modules: {
		uiUtils,
	},
	components: {},
	props: {
		phenotypes: Array,
		legends: Boolean,
		colors: Array,
	},

	data() {
		return {
			isActive: false,
			limit: 10,
		};
	},

	computed: {
		topAssociationsHighest: function () {
			return this.phenotypes[0]["pValue"];
		},
		topAssociationsGrouped: function () {
			let data = this.phenotypes;
			let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

			data.forEach((element) => {
				let phenotype = phenotypeMap[element.phenotype];

				element["group"] = phenotype.group;
				element["description"] = phenotype.description;
			});

			return groupBy(data, "group");
		},
		topAssociations: function () {
			let data = this.phenotypes;
			let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

			data.forEach((element) => {
				let phenotype = phenotypeMap[element.phenotype];

				element["group"] = phenotype.group.toUpperCase();
				element["description"] = phenotype.description;
			});

			return data;
		},
		topAssociationsFiltered() {
			let data = this.phenotypes;
			let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
			let filteredData = [];

			data.forEach((element) => {
				let phenotype = phenotypeMap[element.phenotype];

				element["group"] = phenotype.group.toUpperCase();
				element["description"] = phenotype.description;

				if (element.pValue <= 5e-8) filteredData.push(element);
			});
			return filteredData;
		},
		topAssociationsLimit() {
			return this.limit
				? this.topAssociationsFiltered.slice(0, this.limit)
				: this.topAssociationsFiltered;
		},
		phenotypeGroups: function () {
			let data = this.phenotypes;

			let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
			let groups = [];

			for (const [pKey, pValue] of Object.entries(phenotypeMap)) {
				groups.push(pValue.group);
			}

			groups = groups
				.filter(function (value, index, self) {
					return self.indexOf(value) === index;
				})
				.sort();

			return groups;
		},
	},
	methods: {
		getColor(PGROUP) {
			let colorIndex = this.phenotypeGroups.indexOf(PGROUP);
			return this.colors[colorIndex];
		},
		log2css(value) {
			const maxWidth = Math.log10(this.topAssociationsHighest);
			const barWidth = Math.log10(value);

			let calculated = (barWidth / maxWidth) * 100;

			return calculated > 100 ? 100 : calculated;
		},
		key2id(key) {
			return key.toLowerCase().split(" ").join("_");
		},
		getEvalue(number) {
			return -Math.floor(Math.log10(number));
		},
		showHideElement(ELEMENT, FOCUSINPUT) {
			uiUtils.showHideElement(ELEMENT, FOCUSINPUT);
		},
		popOutElement(ELEMENT) {
			uiUtils.popOutElement(ELEMENT);
		},
		openPage(PAGE, PARAMETER) {
			uiUtils.openPage(PAGE, PARAMETER);
		},
		showHideByClass(CLASS) {
			uiUtils.showHideByClass(CLASS);
		},
		pValueCss(value) {
			return Formatters.pValueCss(value, this.topAssociationsHighest);
		},
		pValueFormatter(pValue) {
			return Formatters.pValueFormatter(pValue);
		},
		addPhenotype(phenotype) {
			this.$parent.$parent.pushCriterionPhenotype(phenotype);
			window.location.href = "#associations-table";
		},
		setPhenotype(phenotype) {
			this.$parent.$parent.setCriterionPhenotypes([phenotype]);
			window.location.href = "#associations-table";
		},
	},
});
</script>

<style>
@import url("/css/phenotypeGroups.css");
</style>
