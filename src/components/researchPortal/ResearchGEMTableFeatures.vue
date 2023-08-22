<template>
	<div class="research-data-table-features-wrapper">
		<div
			v-for="(value, index) in featuresFormat['features']"
			:key="index"
			class="research-data-table-features"
		>
			<table
				class="table table-sm feature-table"
				v-if="
					!!featuresData &&
					!!featuresData[value] &&
					!!featuresFormat[value]
				"
			>
				<tr>
					<th
						:rowspan="featuresData[value].length + 1"
						:class="'feature-title-th feature-th-' + index"
					>
						<span class="feature-title">{{ value }}</span>
					</th>

					<th
						v-for="(headerValue, headerIndex) in featuresFormat[
							value
						]"
						:key="headerIndex"
						:class="'feature-th-' + index"
						:style="
							!!headerValue.includes(':array')
								? 'display:none'
								: ''
						"
						v-html="
							!!headerValue.includes(':array')
								? headerValue.replace(':array', '')
								: headerValue
						"
					></th>
				</tr>

				<tr
					v-for="(featureValue, featureIndex) in featuresData[value]"
					:key="featureIndex"
				>
					<td
						v-for="(headerValue, headerIndex) in featuresFormat[
							value
						]"
						:key="headerIndex"
						:style="
							!!headerValue.includes(':array') ? 'padding: 0' : ''
						"
						v-html="
							!!headerValue.includes(':array')
								? getFeatureContent(
										featureValue[headerValue],
										headerIndex
								  )
								: formatValue(
										featureValue[headerValue],
										headerValue
								  )
						"
					></td>
				</tr>
			</table>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
//import Formatters from "@/utils/formatters";

export default Vue.component("research-gem-table-features", {
	props: ["featuresData", "featuresFormat","utils"],
	data() {
		return {};
	},
	modules: {},
	components: {},
	created() {},
	beforeMount() {},

	mounted() {},
	updated() {},
	methods: {
		getFeatureContent(VALUE, INDEX) {
			let content =
				"<table class='feature-content-table table table-striped table-sm'>";

			VALUE.map((v, vIndex) => {
				if (vIndex == 0) {
					let thArr = Object.keys(v);

					content += "<thead><tr>";

					thArr.map((t) => {
						content +=
							"<th class='feature-th-" +
							INDEX +
							"'>" +
							t +
							"</th>";
					});
					content += "</tr></thead><tbody>";
				}

				content += "<tr>";

				for (const [vKey, vValue] of Object.entries(v)) {
					content +=
						"<td>" + this.formatValue(vValue, vKey) + "</td>";
				}
				content += "</tr>";
			});
			content += "</tbody></table>";
			return content;
		},
		formatValue(tdValue, tdKey) {
			if (
				this.featuresFormat["column formatting"] != undefined &&
				this.featuresFormat["column formatting"][tdKey] != undefined
			) {
				let formatTypes =
					this.featuresFormat["column formatting"][tdKey]["type"];

				let linkToNewTab = !!this.featuresFormat["column formatting"][
					tdKey
				]["new tab"]
					? this.featuresFormat["column formatting"][tdKey]["new tab"]
					: null;

				let cellValue = tdValue;

				formatTypes.map((type) => {
					if (type == "scientific notation") {
						cellValue = this.utils.Formatters.pValueFormatter(tdValue);

						cellValue = cellValue == "-" ? 0 : cellValue;
					}

					/*if (type == "link") {
						let linkString =
							"<a href='" +
							this.newTableFormat["column formatting"][tdKey][
								"link to"
							] +
							cellValue;

						linkString +=
							linkToNewTab == "true"
								? "' target='_blank'>" + cellValue + "</a>"
								: "'>" + cellValue + "</a>";

						cellValue = linkString;
					}*/
					if (type == "link") {
						let linkString =
							"<a href='" +
							this.featuresFormat["column formatting"][tdKey][
								"link to"
							] +
							cellValue;

						linkString +=
							!!this.featuresFormat["column formatting"][tdKey][
								"link type"
							] &&
							this.featuresFormat["column formatting"][tdKey][
								"link type"
							] == "button"
								? "' class='btn btn-sm btn-outline-secondary link-button"
								: "";

						let linkLabel = !!this.featuresFormat[
							"column formatting"
						][tdKey]["link label"]
							? this.featuresFormat["column formatting"][tdKey][
									"link label"
							  ]
							: cellValue;

						linkString +=
							linkToNewTab == "true"
								? "' target='_blank'>" + linkLabel + "</a>"
								: "'>" + linkLabel + "</a>";

						cellValue = linkString;
					}

					if (type == "render background percent") {
						let fieldValue =
							typeof tdValue != "number"
								? this.featuresFormat["column formatting"][
										tdKey
								  ]["percent if empty"]
								: tdValue;

						let weight = Math.floor(
							((Number(fieldValue) - this.dataScores[tdKey].low) /
								(this.dataScores[tdKey].high -
									this.dataScores[tdKey].low)) *
								100
						);

						let weightClasses = "cell-weight-" + weight + " ";

						weightClasses +=
							tdValue < 0 ? "weight-negative" : "weight-positive";

						cellValue =
							"<span class='" +
							weightClasses +
							"'>" +
							cellValue +
							"</span>";
					}
				});

				return cellValue;
			} else {
				return tdValue;
			}
		},
	},
	computed: {
		topRowNumber() {
			let topRows =
				this.tableFormat["features"] != undefined
					? this.tableFormat["top rows"].length + 1
					: this.tableFormat["top rows"].length;
			return topRows;
		},
	},
	watch: {},
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

.feature-content-table {
	width: 100%;
}

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
