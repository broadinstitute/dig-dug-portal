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
		{{ CommonVarBF }}
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
	],
	data() {
		return {};
	},
	components: { TooltipDocumentation },
	computed: {
		CommonVarBF() {
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
	},
	methods: {},
});
</script>

<style scoped>
</style>
