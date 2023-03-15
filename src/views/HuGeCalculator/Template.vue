<template>
	<div ref="huge" id="huge">
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card">
				<div class="card-body temporary-card">
					<documentation name="hugecal.header.info"></documentation>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<h1 class="card-title">HuGE Calculator</h1>

					<documentation
						style="margin-bottom: 30px"
						name="tools.hugecal.subheader"
					></documentation>

					<h4 class="card-title">Build search criteria</h4>

					<criterion-list-group
						v-model="$parent.hugecalSearchCriterion"
						:header="'Search Criterion'"
						class="searchwrap"
					>
						<!-- select gene -->
						<filter-enumeration-control
							:field="'gene'"
							placeholder="Select a gene ..."
							:options="$parent.matchingGenes"
							:pillFormatter="(filter) => filter.threshold"
							@input-change="$parent.lookupGenes($event)"
						>
							<div class="label">Gene</div>
						</filter-enumeration-control>
						<!-- select phenotype -->
						<filter-enumeration-control
							ref="phenotype"
							:field="'phenotype'"
							placeholder="Select a phenotype ..."
							:pillFormatter="
								(filter) =>
									!!$store.state.bioPortal.phenotypeMap[
										filter.threshold
									]
										? $store.state.bioPortal.phenotypeMap[
												filter.threshold
										  ].description
										: filter.threshold
							"
							:options="
								$parent.phenotypeOptions.map(
									(phenotype) => phenotype.name
								)
							"
							:multiple="false"
							:labelFormatter="
								(phenotype) =>
									!!$store.state.bioPortal.phenotypeMap[
										phenotype
									]
										? $store.state.bioPortal.phenotypeMap[
												phenotype
										  ].description
										: phenotype
							"
						>
							<div class="label">Phenotype</div>
						</filter-enumeration-control>
						<!-- <b-badge
                            v-if="$parent.numberOfSearches > 1"
                            class="badge badge-secondary badge-pill btn search-bubble clear-all-filters-bubble"
                            @click="removeAllFilters()"
                        >Clear all search</b-badge>-->
					</criterion-list-group>

					<div
						v-if="
							$store.state.associations.data.length > 0 &&
							$parent.selectedPhenotype.length != 0 &&
							$parent.selectedGene.length != 0 &&
							$store.state.gene.data.length > 0
						"
					>
						<div>
							<div class="card-body">
								<hugecal-score-section
									currentPage="huge calculator"
									:documentationMap="$parent.documentationMap"
									:commonAssociations="
										$store.state.associations.data
									"
									:geneData="$store.state.gene.data"
									:genesInARegion="$store.state.genes.data"
									:rareAssociations="
										$store.state.geneAssociations52k.data
									"
									:selectedGene="$parent.selectedGene[0]"
									:selectedPhenotype="
										$parent.selectedPhenotype[0]
									"
									:prior="$store.state.prior"
								></hugecal-score-section>

								<div
									v-if="$parent.geneAssociations52k"
									style="cursor: pointer"
									v-on:click="
										$parent.showHideFeature('ppasection')
									"
								>
									<div class="headerexpander">
										Posterior probability
									</div>
								</div>

								<div
									:id="'ppasection'"
									class="row hidden"
									v-if="!!this.$store.state.hugeScore"
								>
									<div class="col-md-8">
										<h6
											style="
												font-weight: bold;
												margin-top: 10px;
											"
										>
											How is PPA calculated?
										</h6>
										<span>
											<documentation
												name="hugecal.ppa.subheader"
												:content-fill="
													$parent.documentationMap
												"
											></documentation>
										</span>
										<hugecal-table
											style="
												padding: 50px 250px 50px 250px;
											"
											:hugeScore="
												this.$store.state.hugeScore
											"
										></hugecal-table>
									</div>
									<div class="col-md-4">
										<posterior-probability-plot
											:geneAssociationsData="
												$parent.geneAssociations52k
											"
											:priorVariance="
												this.$store.state.prior
											"
											:bayes_factor="
												this.$store.state.hugeScore
											"
											:universalPriorList="
												this.$store.state
													.universalPriorList
											"
										></posterior-probability-plot>
									</div>
								</div>
								<!-- End of Posterior probability Collapsible section -->
							</div>

							<!-- NEW COMMON VARIATION -->

							<div
								class="card-body"
								style="margin-block-end: 20px cursor"
								v-if="!!this.$store.state.commonVarBF"
							>
								<span
									style="cursor: pointer"
									v-on:click="
										$parent.showHideFeature(
											'commonvariation'
										)
									"
								>
									<div
										v-if="
											this.$store.state.associations.data
										"
										class="row"
										style="
											color: #254ca6;
											font-size: 15px;
											font-weight: bold;
											border-radius: 10px;
											background-color: #e7edf7;
											padding: 5px 5px 5px 5px;
										"
									>
										<div class="col-md-6">
											Common Variation
											<tooltip-documentation
												name="hugecal.commonvariation.tooltip.hover"
												:content-fill="
													$parent.documentationMap
												"
												:isHover="true"
												:noIcon="false"
											></tooltip-documentation>
										</div>
										<div
											class="col-md-6"
											style="text-align: right"
										>
											BF:{{
												this.$store.state.commonVarBF
											}}
										</div>
									</div>
								</span>
								<div
									id="commonvariation"
									style="cursor: pointer"
									class="hidden"
								>
									<div
										v-if="
											$parent.isGenomeWideSignificant(
												this.$store.state.associations
													.data,
												$parent.selectedPhenotype[0]
											)
										"
									>
										<div
											class="lead"
											style="font-size: 12px"
										>
											*Common variation BF = 1 if a gene
											is not genome wide significant
											<br />*If a gene is genome-wide
											significant, common variation BF =
											BF of GWAS evidence * BF of coding
											evidence * BF of regulatory evidence
										</div>

										<h6
											style="
												font-weight: bold;
												margin-top: 15px;
												margin-bottom: 10px;
											"
										>
											How is common variation BF
											calculated?
										</h6>
										<span>
											<documentation
												name="hugecal.commonvar.subheader"
												:content-fill="
													$parent.documentationMap
												"
											></documentation>
										</span>
										<div class="container">
											<span
												class="center"
												style="
													font-weight: bold;
													white-space: nowrap;
												"
												>Does the common variation have
												genome-wide significance?</span
											>
										</div>
										<div
											style="padding: 5px 0px 5px 0px"
										></div>

										<commonvariation-genomesig-table
											:isGenomeWideSignificant="true"
											:gwasEvidence="'3(P-value <= 5e-8)'"
											:commonBF="
												this.$store.state.commonVarBF
											"
										></commonvariation-genomesig-table>
									</div>
									<div v-else>
										<span
											class="lead"
											style="font-size: 12px"
										>
											*Common variation BF = 1 if a gene
											is not genome wide significant
											<br />*If a gene is genome-wide
											significant, common variation BF =
											BF of GWAS evidence * BF of coding
											evidence * BF of regulatory evidence
										</span>

										<h6
											style="
												font-weight: bold;
												margin-top: 15px;
												margin-bottom: 10px;
											"
										>
											How is common variation BF
											calculated?
										</h6>
										<span>
											<documentation
												name="hugecal.commonvar.subheader"
												:content-fill="
													$parent.documentationMap
												"
											></documentation>
										</span>
										<div class="container">
											<span
												class="center"
												style="
													font-weight: bold;
													white-space: nowrap;
												"
												>Does the common variation have
												genome-wide significance?</span
											>
										</div>
										<div
											style="padding: 5px 0px 5px 0px"
										></div>

										<commonvariation-not-genomesig-table
											:isGenomeWideSignificant="false"
											:gwasEvidence="'1(No Evidence)'"
											:commonBF="
												this.$store.state.commonVarBF
											"
										></commonvariation-not-genomesig-table>
									</div>

									<div class="container">
										<div class="center">
											<color-bar-plot
												:category="
													$parent.getCategory(
														this.$store.state
															.commonVarBF
													)
												"
												:elementid="'commonVariation'"
												:score="
													this.$store.state
														.commonVarBF
												"
											></color-bar-plot>
										</div>
									</div>
									<div style="margin-block-end: 30px"></div>
									<div
										style="cursor: pointer"
										v-on:click="
											$parent.showHideSvg('lzplot')
										"
									>
										<div class="headerexpander">
											View
											{{ $parent.selectedGene[0] }} on
											LocusZoom
										</div>
									</div>
								</div>

								<div
									v-if="$parent.region"
									id="lzplot"
									class="svg-wrapper hidden-svg"
								>
									<locuszoom
										ref="locuszoom"
										:chr="$parent.region.chromosome"
										:start="$parent.region.start - 50000"
										:end="$parent.region.end + 50000"
										:refSeq="true"
										:ldpop="false"
									>
										<lz-associations-panel
											:phenotype="
												$parent.selectedPhenotype[0]
											"
											@input="
												$parent.updateAssociationsTable
											"
										></lz-associations-panel>
									</locuszoom>
								</div>
								<br />
								<!-- NEW RARE VARIATION -->
								<div v-if="!!this.$store.state.rareVarBF">
									<span
										style="cursor: pointer"
										v-on:click="
											$parent.showHideFeature(
												'rarevariation'
											)
										"
									>
										<div
											v-if="
												this.$store.state.associations
													.data
											"
											class="row"
											style="
												color: #af5934;
												font-size: 15px;
												font-weight: bold;
												border-radius: 10px;
												background-color: #fef8dc;
												padding: 5px 5px 5px 5px;
											"
										>
											<div class="col-md-6">
												Rare Variation
												<tooltip-documentation
													name="hugecal.rarevariation.tooltip.hover"
													:content-fill="
														$parent.documentationMap
													"
													:isHover="true"
													:noIcon="false"
												></tooltip-documentation>
											</div>
											<div
												class="col-md-6"
												style="text-align: right"
											>
												BF:{{
													this.$store.state.rareVarBF
														.rareBF
												}}
											</div>
										</div>
									</span>
									<div class="hidden" id="rarevariation">
										<div
											v-if="
												$parent.isExomeWideSignificant(
													this.$store.state
														.geneAssociations52k
														.data,
													$parent.selectedPhenotype[0]
												)
											"
										>
											<h6
												style="
													font-weight: bold;
													margin-top: 10px;
												"
											>
												How is rare variation BF
												calculated?
											</h6>
											<span>
												<documentation
													name="hugecal.rarevar.subheader"
													:content-fill="
														$parent.documentationMap
													"
												></documentation>
											</span>

											<div class="container">
												<span
													class="center"
													style="
														font-weight: bold;
														white-space: nowrap;
													"
													>Does the rare variation
													have exome-wide
													significance?</span
												>
											</div>
											<div
												style="padding: 5px 0px 5px 0px"
											></div>

											<rarevariation-exomesig-table
												:isExomeWideSignificant="true"
												:exomeEvidence="
													$parent
														.rareVariationScoreEvidenceMap[
														'exomeEvidence'
													]
												"
												:rareBF="
													this.$store.state.rareVarBF
														.rareBF
												"
											></rarevariation-exomesig-table>

											<div class="container">
												<div class="center">
													<color-bar-plot
														:category="
															$parent.getCategory(
																this.$store
																	.state
																	.rareVarBF
																	.rareBF
															)
														"
														:elementid="'rareVariation'"
														:score="
															this.$store.state
																.rareVarBF
																.rareBF
														"
													></color-bar-plot>
												</div>
											</div>
											<div
												style="margin-block-end: 30px"
											></div>
											<div
												style="
													cursor: pointer;
													margin-bottom: 30px;
												"
												v-on:click="
													$parent.showHideFeature(
														'masktable'
													)
												"
											>
												<div
													v-if="
														$parent.geneAssociations52k
													"
													class="headerexpander"
												>
													View Burden Association
													Summary statistics
												</div>
											</div>

											<div
												class="
													EGLT-table
													fiftytwo
													masktable
													hidden
												"
												id="masktable"
											>
												<mask-table
													v-if="$parent.masks.length"
													:maskData="$parent.masks"
													:index="`${$parent.selectedGene}_0`"
													:dichotomous="true"
												></mask-table>
											</div>
											<div
												v-if="$parent.masks.length == 0"
											>
												<ul>
													<li>
														No mask data available
													</li>
												</ul>
											</div>
										</div>
										<div style="cursor: pointer" v-else>
											<h6
												style="
													font-weight: bold;
													margin-top: 10px;
												"
											>
												How is rare variation BF
												calculated?
											</h6>
											<span>
												<documentation
													name="hugecal.rarevar.subheader"
													:content-fill="
														$parent.documentationMap
													"
												></documentation>
											</span>
											<div class="container">
												<span
													class="center"
													style="
														font-weight: bold;
														white-space: nowrap;
													"
													>Does the rare variation
													have exome-wide
													significance?</span
												>
											</div>
											<div
												style="padding: 5px 0px 5px 0px"
											></div>

											<rarevariation-not-exomesig-table
												:isExomeWideSignificant="false"
												:priorVariance="
													$store.state.prior
												"
												:rareBF="
													this.$store.state.rareVarBF
														.rareBF
												"
												:burdenAssocEvidence="
													this.$store.state.rareVarBF
														.beta
												"
											></rarevariation-not-exomesig-table>

											<div class="container">
												<div class="center">
													<color-bar-plot
														:category="
															$parent.getCategory(
																this.$store
																	.state
																	.rareVarBF
																	.rareBF
															)
														"
														:elementid="'rareVariation'"
														:score="
															this.$store.state
																.rareVarBF
																.rareBF
														"
													></color-bar-plot>
												</div>
											</div>
											<div
												style="margin-block-end: 30px"
											></div>
											<div
												style="
													cursor: pointer;
													margin-bottom: 30px;
												"
												v-on:click="
													$parent.showHideFeature(
														'masktable'
													)
												"
											>
												<div
													v-if="
														$parent.geneAssociations52k
													"
													class="headerexpander"
												>
													View Burden Association
													Summary statistics
												</div>
											</div>
											<div
												id="masktable"
												class="
													EGLT-table
													fiftytwo
													masktable
													hidden
												"
											>
												<mask-table
													v-if="$parent.masks.length"
													:maskData="$parent.masks"
													:index="`${$parent.selectedGene}_1`"
													:dichotomous="true"
												></mask-table>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>

<script>
</script>
<style>
.color-bar-plot-wrapper {
	width: calc(100% - 32px);
	margin-left: 16px;
}

.color-bars-wrapper {
	background-color: #eee;
	font-weight: 500;
	font-size: 13px;
}

.color-bar-plot-wrapper .each-bar-section {
	width: calc(100% / 7);
	text-align: center;
}

* {
	box-sizing: border-box;
}

/* Container for flexboxes */
.row {
	display: flex;
	flex-wrap: wrap;
}

/* Create four equal columns */
.column {
	flex: 25%;
	padding: 20px;
}

/* On screens that are 992px wide or less, go from four columns to two columns */
@media screen and (max-width: 992px) {
	.column {
		flex: 50%;
	}
}

/* On screens that are 600px wide or less, make the columns stack on top of each other instead of next to each other */
@media screen and (max-width: 600px) {
	.row {
		flex-direction: column;
	}
}

/* coding and regulatory evidence */
.codingEvidence1C {
	background-color: #ffd62e;
	padding: 5px;
	border-radius: 25px;
	font-weight: 700;
}
.codingEvidence2C {
	background-color: #ffec2e;
	padding: 5px;
	border-radius: 25px;
	font-weight: 700;
}
.regulatoryEvidence2R {
	background-color: #bfd730;
	padding: 5px;
	border-radius: 25px;
	font-weight: 700;
}
.regulatoryEvidence3R {
	background-color: #bfd73050;
	padding: 5px;
	border-radius: 25px;
	font-weight: 700;
}

/* color bar plot */
.arrow-up {
	width: 0;
	/*height: 40px;*/
	border-left: 10px solid transparent;
	border-right: 10px solid transparent;
	border-bottom: 10px solid #de202c;
	animation: moveright 1s alternate 1s;
	margin-left: auto;
	margin-right: auto;
}
.arrow-side {
	width: 0;
	height: 0;
	border-top: 10px solid transparent;
	border-left: 10px solid rgb(0, 0, 0);
	border-bottom: 10px solid transparent;
	margin-left: auto;
	margin-right: auto;
}

.arrow {
	border: solid black;
	border-width: 0 3px 3px 0;
	display: inline-block;
	padding: 3px;
}

.right {
	transform: rotate(-45deg);
	-webkit-transform: rotate(-45deg);
}

#commonVariation .variationCausal {
	background-color: #375fbd;
	font-weight: bold;
}
#commonVariation .variationStrong {
	background-color: #496fc9;
	font-weight: bold;
}
#commonVariation .variationModerate {
	background-color: #587dd6;
	font-weight: bold;
}
#commonVariation .variationPossible {
	background-color: #6488de;
	font-weight: bold;
}
#commonVariation .variationPotential {
	background-color: #7193e3;
	font-weight: bold;
}
#commonVariation .variationWeak {
	background-color: #85a4ed;
	font-weight: bold;
}

#commonVariation .variationEquivocal {
	background-color: #92aef0;
	font-weight: bold;
}

#commonVariation .variationNoEvidence {
	background-color: #a3bcf7;
	font-weight: bold;
}
#rareVariation .variationCausal {
	background-color: #f1c206;
	font-weight: bold;
}
#rareVariation .variationStrong {
	background-color: #f3d14a;
	font-weight: bold;
}
#rareVariation .variationModerate {
	background-color: #f5db74;
	font-weight: bold;
}
#rareVariation .variationPossible {
	background-color: #f6e5a0;
	font-weight: bold;
}
#rareVariation .variationPotential {
	background-color: #f3e3a4;
	font-weight: bold;
}
#rareVariation .variationWeak {
	background-color: #f3e9c5;
	font-weight: bold;
}
#rareVariation .variationEquivocal {
	background-color: #eee8d4;
	font-weight: bold;
}
#rareVariation .variationNoEvidence {
	background-color: #ebe8de;
	font-weight: bold;
}

#combinedVariation .variationCausal {
	background-color: #3fb54a;
	font-weight: bold;
}
#combinedVariation .variationStrong {
	background-color: #4ebf59;
	font-weight: bold;
}
#combinedVariation .variationModerate {
	background-color: #5ecc69;
	font-weight: bold;
}
#combinedVariation .variationPossible {
	background-color: #71d97b;
	font-weight: bold;
}
#combinedVariation .variationPotential {
	background-color: #7ee087;
	font-weight: bold;
}
#combinedVariation .variationWeak {
	background-color: #91eb9a;
	font-weight: bold;
}
#combinedVariation .variationEquivocal {
	background-color: #a1f0a9;
	font-weight: bold;
}

#combinedVariation .variationNoEvidence {
	background-color: #c4edc8;
	font-weight: bold;
}

.divider {
	border: 0;
	height: 3px;
	background: #095484;
	background-image: linear-gradient(to right, #ccc, #095484, #ccc);
}

.hr {
	width: 70%;
	margin-left: auto;
	margin-right: auto;
	height: 3px;
	border: 6 6 6 6;
	background: #042e47;
	padding: 10px;
}
#toggle {
	display: block;
}
div.headerexpander {
	position: relative;
	padding-left: 15px;
	height: 15px;
	font-size: 15px;
	line-height: 15px;
	display: flex;
}
div.headerexpander:before {
	content: "";
	position: absolute;
	border-left: 7.5px solid rgb(10, 10, 10);
	border-top: 7.5px solid transparent;
	border-bottom: 7.5px solid transparent;
	top: 0;
	bottom: 5px;
	left: 0;
}
div.headerexpander:after {
	content: "";
	flex: 1;
	border-bottom: 1px solid;
	padding: 0px 5px 5px 5px;
	margin: auto;
}
.searchwrap div.filtering-ui-wrapper {
	background-color: #ddefff;
	border: solid 1px #bbdfff;
}
</style>
