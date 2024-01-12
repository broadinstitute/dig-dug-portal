<template>
	<div class="research-data-table-features-wrapper">
		<!--{{ featuresFormat['features'] }}<br />
		{{ featuresData }}-->
		<div
			v-for="(value, index) in featuresFormat['features']"
			:key="index"
			class="research-data-table-features"
			:v-if="!!featuresData && !!featuresFormat['features']"
		>
		
			<table class="table table-sm feature-table">
				<tr>
					<th
						:rowspan="featuresData[value].length + 1"
						class="byor-tooltip"
						:class="'feature-title-th feature-th-' + index"
					>
						<span class="feature-title">{{ value }}</span>
					</th>
					<th
						v-for="(headerValue, headerIndex) in featuresFormat[
							value
						]"
						:key="headerIndex"
						class="byor-tooltip"
						:class="'feature-th-' + index"
					>
						<span v-html="headerValue"></span>
						<span
							v-if="
								!!featuresFormat['tool tips'] &&
								!!featuresFormat['tool tips'][headerValue]
							"
							class="tooltiptext"
							v-html="featuresFormat['tool tips'][headerValue]"
						></span>
					</th>
				</tr>
				<tr
					v-for="(featureValue, featureIndex) in featuresData[value]"
					:key="featureIndex"
				>
					<template v-for="headerValue in featuresFormat[value]">
						<td
							v-if="!!featuresFormat[value].includes(headerValue)"
							:key="headerValue"
							v-html="
								formatValue(
									featureValue[headerValue],
									headerValue
								)
							"
						></td>
					</template>
				</tr>
			</table>
		</div>
	</div>
</template>

<script>
import Vue from "vue";

export default Vue.component("research-data-table-features", {
	props: ["featuresData", "featuresFormat", "phenotypeMap","utils"],
	data() {
		return {};
	},
	modules: {},
	components: {},
	created() {},
	beforeMount() {},

	mounted() {},
	updated() {},
	computed: {
		dataScores() {
			if (
				!!this.featuresData &&
				!!this.featuresFormat &&
				this.featuresFormat["column formatting"] != undefined
			) {
				let scores = {};
				let columnFormatting = this.featuresFormat["column formatting"];

				for (const column in columnFormatting) {
					if (
						columnFormatting[column].type.includes(
							"render background percent"
						) ||
						columnFormatting[column].type.includes(
							"render background percent negative"
						)
					) {
						scores[column] = { high: null, low: null };
					}
				}

				this.featuresFormat["features"].map((feature) => {
					this.featuresData[feature].map((row) => {
						for (const field in scores) {
							let fieldValue =
								typeof row[field] != "number"
									? columnFormatting[field][
											"percent if empty"
									  ]
									: row[field];
							scores[field].high =
								scores[field].high == null
									? fieldValue
									: scores[field].high < fieldValue
									? fieldValue
									: scores[field].high;

							scores[field].low =
								scores[field].low == null
									? fieldValue
									: scores[field].low > fieldValue
									? fieldValue
									: scores[field].low;
						}
					});
				});

				return scores;
			}
		},
	},
	watch: {},
	methods: {
		//...Formatters,
		formatValue(tdValue, tdKey) {
			let content;

			if (
				!!this.featuresFormat &&
				!!this.featuresFormat["column formatting"] &&
				!!this.featuresFormat["column formatting"][tdKey]
			) {
				let types =
					this.featuresFormat["column formatting"][tdKey].type;

				if (
					!!types.includes("render background percent") ||
					!!types.includes("render background percent negative")
				) {
					content = this.utils.Formatters.BYORColumnFormatter(
						tdValue,
						tdKey,
						this.featuresFormat,
						null,
						this.dataScores
					);
				} else if (!!types.includes("kp phenotype link")) {
					content = this.utils.Formatters.BYORColumnFormatter(
						tdValue,
						tdKey,
						this.featuresFormat,
						this.phenotypeMap,
						null
					);
				} else {
					content = this.utils.Formatters.BYORColumnFormatter(
						tdValue,
						tdKey,
						this.featuresFormat,
						null,
						null
					);
				}
			} else {
				content = tdValue;
			}

			return content;
		},
	},
});
</script>

<style>
.research-data-table-features {
	position: relative;
}
/*
.feature-title {
    position: absolute;
    -webkit-transform: rotate(-90deg);
    transform: rotate(-90deg);
    background-color: #000;
    color: #fff;
    transform-origin: left top;
    width: 54px;
    font-size: 12px;
    top: 54px;
    left: 0px;
}
*/

.feature-table > tr > th {
	background-color: #eeeeee;
	border: none !important;
	border-left: solid 1px #ddd !important;
	border-bottom: solid 2px #ccc !important;
	font-size: 13px;
}

.feature-table > tr > th.feature-title-th {
	background-color: #000 !important;
	color: #000;
	/*width: 20px !important;
    position: relative;*/
	text-align: center;
	white-space: nowrap;
	vertical-align: middle;
	width: 1.5em;
	border: none !important;
	border-bottom: solid 2px #ccc !important;
}

.feature-table > tr > th.feature-title-th span.feature-title {
	display: block;
	/*
    -webkit-transform: rotate(-90deg);
    transform: rotate(-90deg);
    position: absolute;
    -webkit-transform-origin: left top;
    transform-origin: left top;
    top: 54px;
    left: 0;
    max-width: 50px;
    min-width: 50px;
    text-align: right;
    height: 20px;
    overflow: hidden;*/
	transform: rotate(-90deg);
	-moz-transform: rotate(-90deg); /* FF3.5+ */
	-o-transform: rotate(-90deg); /* Opera 10.5 */
	-webkit-transform: rotate(-90deg); /* Saf3.1+, Chrome */
	filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=0.083); /* IE6,IE7 */
	-ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=0.083)"; /* IE8 */
	margin-left: -100em;
	margin-right: -100em;
	overflow: hidden;
	font-size: 12px;
}

table.feature-table {
	margin-bottom: 0;
	background-color: #f7f7f7;
}

table.feature-table th.feature-th-0 {
	background-color: #75def850 !important;
}
table.feature-table th.feature-th-1 {
	background-color: #04884550 !important;
}
table.feature-table th.feature-th-2 {
	background-color: #8490c850 !important;
}
table.feature-table th.feature-th-3 {
	background-color: #bf61a550 !important;
}
table.feature-table th.feature-th-4 {
	background-color: #ee312450 !important;
}
table.feature-table th.feature-th-5 {
	background-color: #fcd700 !important;
}
table.feature-table th.feature-th-6 {
	background-color: #5555ff50 !important;
}
table.feature-table th.feature-th-7 {
	background-color: #7aaa1c50 !important;
}
table.feature-table th.feature-th-8 {
	background-color: #9f78ac50 !important;
}
table.feature-table th.feature-th-9 {
	background-color: #f8808450 !important;
}
table.feature-table th.feature-th-10 {
	background-color: #f5a4c7 !important;
}
table.feature-table th.feature-th-11 {
	background-color: #cee6c1 !important;
}
table.feature-table th.feature-th-12 {
	background-color: #cccc00 !important;
}
table.feature-table th.feature-th-13 {
	background-color: #6fc7b6 !important;
}
table.feature-table th.feature-th-14 {
	background-color: #d5a768 !important;
}
table.feature-table th.feature-th-15 {
	background-color: #d4d4d4 !important;
}
</style>
