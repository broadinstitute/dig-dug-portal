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
	</div>
</template>
        
<script>
import Vue from "vue";
import "bootstrap/dist/css/bootstrap.css";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";

import TooltipDocumentation from "@/components/TooltipDocumentation.vue";

export default Vue.component("hugecal-score-section", {
	props: ["currentPage", "documentationMap", "associations"],
	data() {
		return {};
	},
	components: { TooltipDocumentation },
	computed: {
		CommonVarBF() {
			let commonBF = 1;
			let coding_variants = {
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
			let assoData = this.associations;

			assoData.sort(function (a, b) {
				return a.pValue - b.pValue;
			});

			let topVariant = data[0];
			let topVariant_consequence = topVariant.consequence;
			let genesInARegion = this.$store.state.genes.data;
			var filteredGenesInARegion = genesInARegion.filter(
				(a) => a.source == "symbol"
			);
			let distance = 0;
			//calculate the distance of topVariant to each gene and find the smallest distance
			filteredGenesInARegion.forEach(function (geneinregion) {
				let distanceFromStart =
					topVariant.position - geneinregion.start;
				let distanceFromEnd = topVariant.position - geneinregion.end;
				if (distanceFromStart * distanceFromEnd > 0) {
					distance = Math.min(
						Math.abs(distanceFromStart),
						Math.abs(distanceFromEnd)
					);
					geneinregion["distance"] = distance;
				} else {
					distance = 0;
					geneinregion["distance"] = distance;
				}
			});

			filteredGenesInARegion.sort(function (a, b) {
				return a.distance - b.distance;
			});
			let lowestPvalueClosestGene = filteredGenesInARegion[0];

			//find lowest p - value, is it closest gene - TO DO

			data.forEach(function (eachSNP) {
				if (coding_variants.hasOwnProperty(eachSNP.consequence)) {
					if (eachSNP.pValue < 5e-8) {
						commonBF = 20;
						return commonBF;
					}
				}
			});
			//if NOT GWAS significant
			if (
				!this.isGWASSignificantAssociation(
					data,
					this.selectedPhenotype[0]
				)
			) {
				commonBF = 1;
			}
			//if  GWAS significant
			else {
				//if top variant is coding and the impact of that coding variant is high or moderate (in the same Gene)
				let start = this.$store.state.gene.data[0].start;
				let end = this.$store.state.gene.data[0].end;
				if (
					coding_variants.hasOwnProperty(topVariant_consequence) &&
					topVariant.position >= start &&
					topVariant.position <= end
				) {
					if (
						coding_variants[topVariant_consequence] == "HIGH" ||
						"MODERATE"
					) {
						commonBF = 360;
					}
				} else if (
					lowestPvalueClosestGene.name == this.selectedGene[0]
				) {
					commonBF = 45;
					console.log(
						lowestPvalueClosestGene,
						"lowestPvalueClosestGene"
					);
				} else {
					commonBF = 3;
				}
			}

			return commonBF;
		},
	},
	methods: {},
});
</script>

<style scoped>
</style>
