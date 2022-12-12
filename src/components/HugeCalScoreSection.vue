<template>
	<div class="card-body">
		<span class="lead" style="font-size: 12px">
			*BF=Bayes Factor
			<div
				class="row"
				id="suggestionBox"
				style="
					color: #3fb54a;
					font-size: 15px;
					font-weight: bold;
					border-radius: 10px;
					background-color: #e4f4e4;
					padding: 5px 5px 5px 5px;
				"
			>
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
					<!--{{ $parent.bayesFactorCommonVariation }}(Common variation
					BF) * {{ $parent.bayesFactorRareVariation.rareBF }}(Rare
					variation BF) =
					{{ $parent.bayesFactorCombinedEvidencecomputed }}-->
				</div>
			</div>
			*HuGE Score(combined evidence) = BF of common variation X BF of rare
			variation
		</span>
		{{ commonVarBF }}:{{ rareVarBF.rareBF }}:{{ hugeScore }}
	</div>
</template>
        
<script>
import Vue from "vue";
import "bootstrap/dist/css/bootstrap.css";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";

import TooltipDocumentation from "@/components/TooltipDocumentation.vue";

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
	components: { TooltipDocumentation },
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
				: closestGene.name == this.selectedGene[0]
				? 45
				: 3;

			return commonBF;
		},
		rareVarBF() {
			let betararebfmap = {};
			let masks = [];
			let rareBF = 1;
			let rareBeta = 1;
			//let beta;
			//let stdErr;

			let rareAssoData = this.rareAssociations;

			let isExomeWideSignificant = false;
			rareAssoData.map((v) => {
				if (
					isExomeWideSignificant == false &&
					v.phenotype == this.selectedPhenotype &&
					v.pValue <= 2.5e-6
				) {
					isExomeWideSignificant = true;
				}
			});

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

							betararebfmap["rareBF"] =
								rareBF < 1
									? 1
									: Number.parseFloat(rareBF).toFixed(2);
							betararebfmap["beta"] =
								Number.parseFloat(beta).toFixed(2);

							return betararebfmap;
						}
					});
				}
			}

			betararebfmap["rareBF"] = rareBF;
			betararebfmap["beta"] = rareBeta;

			return betararebfmap;
		},
	},
	methods: {},
});
</script>

<style scoped>
</style>
