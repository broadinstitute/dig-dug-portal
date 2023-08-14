<template>
	<div>
		<template v-if="currentPage == 'huge calculator'">
			<div class="row" id="suggestionBox">
				<div class="col-md-6">
					HuGE Score (Combined Evidence)
					<tooltip-documentation
						name="hugecal.combined.tooltip.hover"
						:content-fill="documentationMap"
						:isHover="true"
						:noIcon="false"
					></tooltip-documentation>
				</div>
				<div
					class="col-md-6"
					style="text-align: right; white-space: nowrap"
				>
					{{ commonVarBF }}(Common variation BF) *
					{{ rareVarBF.rareBF }}(Rare variation BF) =
					{{ hugeScore }}
				</div>
			</div>
			<div class="lead block-end">
				*BF=Bayes Factor &nbsp;&nbsp;*HuGE Score(combined evidence) = BF
				of common variation X BF of rare variation
			</div>

			<hugescore-table
				:commonBF="commonVarBF"
				:rareBF="rareVarBF.rareBF"
				:hugeScore="hugeScore"
				:exomeSignificant="isExomeWideSignificant(rareAssociations)"
			></hugescore-table>
		</template>
		<template v-if="currentPage != 'huge calculator'">
			<div class="container">
				<div class="center">
					<b-table-simple borderless fixed small>
						<b-tbody>
							<b-tr>
								<b-td
									style="
										width: 30px;
										background-color: #e7edf7;
									"
									class="text-center"
									>{{ commonVarBF }}</b-td
								>
								<b-td style="width: 15px" class="text-center"
									>X</b-td
								>
								<b-td
									style="
										width: 30px;
										background-color: #fef8dc;
									"
									class="text-center"
									>{{ rareVarBF.rareBF }}</b-td
								>
								<b-td style="width: 15px" class="text-center"
									>=</b-td
								>
								<b-td
									style="
										width: 30px;
										background-color: #c4edc8;
									"
									class="text-center"
									>{{ hugeScore }}</b-td
								>
								<b-td style="width: 20px" class="text-left"
									><-- HuGE Score</b-td
								>
							</b-tr>
						</b-tbody>
						<!-- <hr style="padding:-20px;width:550px;text-align:right;margin-left:20px" /> -->
					</b-table-simple>
				</div>
			</div>
			<div style="margin-bottom: 25px" class="container">
				<ul class="legend center" style="white-space: nowrap">
					<li>
						<span class="superawesome"></span> Common Variation
						Bayes Factor
					</li>
					<li>
						<span class="awesome"></span> Rare Variation Bayes
						Factor
					</li>
					<li>
						<a
							:href="`/hugecalculator.html?gene=${selectedGene}&phenotype=${selectedPhenotype}`"
							>View evidence in HuGE calculator >></a
						>
					</li>
				</ul>
				<br />
			</div>
		</template>
		<div class="container color-bar">
			<div class="center">
				<color-bar-plot
					v-if="rareVarBF.rareBF"
					:category="getCategory(hugeScore)"
					:elementid="'combinedVariation'"
					:score="hugeScore"
					class="block-end"
				></color-bar-plot>
			</div>
		</div>
	</div>
</template>
        
<script>
import Vue from "vue";
import "bootstrap/dist/css/bootstrap.css";
import Formatters from "@/utils/formatters";

import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import ColorBarPlot from "@/components/ColorBarPlot.vue";
import Hugescoretable from "@/components/Hugescoretable.vue";

export default Vue.component("hugecal-score-section", {
	props: [
		"currentPage",
		"documentationMap",
		"commonAssociations",
		"geneData",
		"genesInARegion",
		"rareAssociations",
		"selectedGene",
		"selectedPhenotype",
		"prior",
	],
	data() {
		return {};
	},
	components: { TooltipDocumentation, ColorBarPlot, Hugescoretable },
	computed: {
		commonVarBF() {
			let commonBF = 1;
			let codingVariants = {
				transcript_ablation: "HIGH",
				splice_acceptor_variant: "HIGH",
				splice_donor_variant: "HIGH",
				stop_gained: "HIGH",
				frameshift_variant: "HIGH",
				stop_lost: "HIGH",
				start_lost: "HIGH",
				transcript_amplification: "HIGH",
				inframe_insertion: "MODERATE",
				inframe_deletion: "MODERATE",
				missense_variant: "MODERATE",
				protein_altering_variant: "MODERATE",
			};
			let assoData = this.commonAssociations;

			let topVariant = assoData[0];
			assoData.map((v) => {
				topVariant = v.pValue < topVariant.pValue ? v : topVariant;
			});

			let filteredGenesInARegion = this.genesInARegion.filter(
				(a) => a.source == "symbol"
			);

			let closestGene = null;
			//calculate the distance of topVariant to each gene and find the smallest distance
			filteredGenesInARegion.map((gene) => {
				let distanceFromStart = topVariant.position - gene.start;
				let distanceFromEnd = topVariant.position - gene.end;

				//get distance to the genes other than the one topVarint belongs to.
				gene["distance"] =
					distanceFromStart * distanceFromEnd > 0
						? Math.min(
								Math.abs(distanceFromStart),
								Math.abs(distanceFromEnd)
						  )
						: 0;

				closestGene =
					closestGene == null
						? gene
						: closestGene.distance <= gene.distance
						? closestGene
						: gene;
			});

			assoData.map((eachSNP) => {
				if (
					!!codingVariants.hasOwnProperty(eachSNP.consequence) &&
					eachSNP.pValue < 5e-8
				) {
					commonBF = 20;
					return commonBF; //BF of common variation:
				}
			});

			//if NOT GWAS significant
			let isGWASSignificantAssociation = false;

			assoData.map((variant) => {
				if (
					isGWASSignificantAssociation == false &&
					variant.phenotype == this.selectedPhenotype &&
					variant.pValue <= 5e-8
				) {
					isGWASSignificantAssociation = true;
				}
			});

			let isCodingVariant =
				codingVariants.hasOwnProperty(topVariant.consequence) &&
				topVariant.position >= this.geneData[0].start &&
				topVariant.position <= this.geneData[0].end
					? true
					: false;

			let isHighImpcat =
				codingVariants[topVariant.consequence] == "HIGH" || "MODERATE"
					? true
					: false;

			//if top variant is coding and the impact of that coding variant is high or moderate (in the same Gene)
			commonBF = !isGWASSignificantAssociation
				? 1
				: !!isCodingVariant && !!isHighImpcat
				? 360
				: closestGene.name == this.selectedGene
				? 45
				: 3;

			if (this.currentPage == "huge calculator") {
				this.$store.dispatch("commonVarBF", parseFloat(commonBF));
			}

			return parseFloat(commonBF);
		},
		rareVarBF() {
			let betaRareBFMap = {};
			let masks = [];
			let rareBF = 1;
			let rareBeta = 1;

			let rareAssoData = this.rareAssociations;

			let isExomeWideSignificant =
				this.isExomeWideSignificant(rareAssoData);

			if (!!isExomeWideSignificant) {
				rareBF = 348;
				rareBeta = 1;
			} else {
				if (rareAssoData.length > 0) {
					rareAssoData.map((v) => {
						if (
							!!v.phenotype &&
							v.phenotype == this.selectedPhenotype
						) {
							//filter with selected phenotype
							masks = v.masks;

							let stdErr, beta, wn, vn, f1, sqrtF1, f2, f3, f4;

							if (!!masks && masks.length > 0) {
								let d = masks.sort(
									(a, b) => a.pValue - b.pValue
								);

								//d[0] is the most significant mask
								stdErr = d[0].stdErr;
								beta = d[0].beta;
								wn = this.prior;
								vn = Math.pow(stdErr, 2);
								f1 = vn / (vn + wn);
								sqrtF1 = Math.sqrt(f1);
								f2 = wn * Math.pow(beta, 2);
								f3 = 2 * vn * (vn + wn);
								f4 = f2 / f3;

								rareBF = sqrtF1 * Math.exp(f4);
							}

							rareBF = rareBF < 1 ? 1 : rareBF;
							rareBeta = beta;
						}
					});
				}
			}

			betaRareBFMap["rareBF"] = parseFloat(rareBF.toFixed(2));
			betaRareBFMap["beta"] = parseFloat(rareBeta.toFixed(2));

			if (this.currentPage == "huge calculator") {
				this.$store.dispatch("rareVarBF", betaRareBFMap);
			}

			return betaRareBFMap;
		},
		hugeScore() {
			let score = parseFloat(
				Formatters.floatFormatter(
					this.commonVarBF * this.rareVarBF.rareBF
				)
			);

			if (this.currentPage == "huge calculator") {
				this.$store.dispatch("hugeScore", score);
			}

			return score;
		},
	},
	methods: {
		getCategory(BF) {
			let category =
				BF >= 350
					? "Compelling"
					: BF >= 100
					? "Extreme"
					: BF >= 30
					? "Very Strong"
					: BF >= 10
					? "Strong"
					: BF >= 3
					? "Moderate"
					: BF > 1
					? "Anecdotal"
					: "No";
			return category;
		},
		isExomeWideSignificant(DATA) {
			let isExomeWideSignificant = false;
			DATA.map((v) => {
				if (
					isExomeWideSignificant == false &&
					v.phenotype == this.selectedPhenotype &&
					v.pValue <= 2.5e-6
				) {
					isExomeWideSignificant = true;
				}
			});

			return isExomeWideSignificant;
		},
	},
});
</script>

<style scoped>
#suggestionBox {
	color: #3fb54a;
	font-size: 15px;
	font-weight: bold;
	border-radius: 10px;
	background-color: #e4f4e4;
	padding: 5px 5px 5px 5px;
}
.lead {
	font-size: 12px;
	text-align: right;
}
.block-end {
	margin-block-end: 60px;
}
/* basic positioning */
.legend {
	list-style: none;
}
.legend li {
	float: left;
	margin-right: 10px;
}
.legend span {
	border: 0px;
	float: left;
	width: 12px;
	height: 12px;
	margin: 2px;
}
/* your colors */
.legend .superawesome {
	background-color: #e7edf7;
}
.legend .awesome {
	background-color: #fef8dc;
}
</style>
