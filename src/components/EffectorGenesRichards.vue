<template>
    <div>
        <div class="EGL-table-wrapper" v-if="tableGeneData">
            <div id="igv-div" class="hidden"></div>
            <div class="filtering-tools">
                <div id="traits">
                    <div class="form-group table-filter">
                        <label for="traits">Traits</label>
                        <select class="form-control" id="selectTrait" v-model="selected">
                            <option value="calcium">Calcium</option>
                            <option value="dbilirubin">Bbilirubin</option>
                            <option value="dbp">Diastolic blood pressure</option>
                            <option value="ebmd">Estimated bone mineral density</option>
                            <option value="glucose">Glucose</option>
                            <option value="height">Height</option>
                            <option value="ldl">LDL cholesterol</option>
                            <option value="lowtsh">Hypothyroidism</option>
                            <option value="rbc">Red blood cell count</option>
                            <option value="sbp">Systolic blood pressure</option>
                            <option value="t2d">Type 2 diabetes</option>
                            <option value="tg">Triglycerides</option>
                        </select>
                    </div>
                    <div class="table-filter">
                        <label>Search a gene</label>
                        <input
                            id="geneSearch"
                            type="text"
                            placeholder="Gene Name"
                            v-model="findGene"
                        />
                    </div>
                    <div class="table-filter">
                        <label>Filter by prob score</label>&GreaterEqual;
                        <input
                            id="probFilter"
                            type="text"
                            placeholder="Prob score"
                            v-model="findProb"
                        />
                    </div>
                </div>
                <div id="regionFilter">
                    <div class="form-group">
                        <div class="table-filter">
                            <label for="region">Chromosome</label>
                            <select class="form-control" id="selectChrom" disabled>
                                <option value="0" selected>All</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                                <option value="9">9</option>
                                <option value="10">10</option>
                                <option value="11">11</option>
                                <option value="12">12</option>
                                <option value="13">13</option>
                                <option value="14">14</option>
                                <option value="15">15</option>
                                <option value="16">16</option>
                                <option value="17">17</option>
                                <option value="18">18</option>
                                <option value="19">19</option>
                                <option value="20">20</option>
                                <option value="21">21</option>
                                <option value="22">22</option>
                            </select>
                        </div>
                        <div class="table-filter">
                            <label>Region start</label>
                            <input id="geneStart" type="text" placeholder="Start position" disabled />
                        </div>
                        <div class="table-filter">
                            <label>Region end</label>
                            <input id="geneEnd" type="text" placeholder="End position" disabled />
                        </div>
                    </div>
                </div>
            </div>
            <div id="setButton">
                <div id="colOptions" class="hidden">
                    <a class="colOptionClose" href="javascript:;">
                        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                    </a>
                    <h3>Set columns</h3>
                    <p>Check or un-check columns to specify which are displayed.</p>
                    <ul class="nav nav-tabs">
                        <li class="active">
                            <a data-toggle="tab" href="#annotations">Variant features</a>
                        </li>
                        <li>
                            <a data-toggle="tab" href="#top_features">Gene features</a>
                        </li>
                    </ul>
                    <div class="tab-content">
                        <div id="annotations" class="tab-pane fade in active">
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col1"
                                    checked
                                    key="snp.name"
                                    header="prob"
                                /> snp name
                            </span>
                            <div class="colInfo">
                                <span>SNP identifier (usually the dbSNP rs identifier).</span>
                                <span>string</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col2"
                                    checked
                                    key="snp.locus"
                                    header="prob"
                                /> snp locus
                            </span>
                            <div class="colInfo">
                                <span>Locus from where the FINEMAP statistics where obtained</span>
                                <span>string</span>
                                <span>If SNP was present in multiple overlapping FINEMAP loci, this is the locus with the lowest FINEMAP log10bf value.</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col3"
                                    checked
                                    key="snp.pos"
                                    header="prob"
                                /> snp pos
                            </span>
                            <div class="colInfo">
                                <span>position of SNP on the chromosome</span>
                                <span>integer</span>
                            </div>
                            <span class="column-option">
                                <input type="checkbox" value="col4" checked key="maf" header="prob" /> maf
                            </span>
                            <div class="colInfo">
                                <span>SNP minor allele frequency</span>
                                <span>float</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col5"
                                    checked
                                    key="beta"
                                    header="prob"
                                /> beta
                            </span>
                            <div class="colInfo">
                                <span>SNP effect estimate from the GWAS</span>
                                <span>float</span>
                            </div>
                            <span class="column-option">
                                <input type="checkbox" value="col6" checked key="se" header="prob" /> se
                            </span>
                            <div class="colInfo">
                                <span>Standard error of the effect estimate from the GWAS</span>
                                <span>float</span>
                            </div>
                            <span class="column-option">
                                <input type="checkbox" value="col7" checked key="z" header="prob" /> z
                            </span>
                            <div class="colInfo">
                                <span>SNP Z-score (beta/se) from the GWAS</span>
                                <span>float</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col8"
                                    checked
                                    key="prob"
                                    header="prob"
                                /> prob
                            </span>
                            <div class="colInfo">
                                <span>FINEMAP posterior probability of the SNP being causal</span>
                                <span>float</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col9"
                                    checked
                                    key="log10bf"
                                    header="prob"
                                /> log10bf
                            </span>
                            <div class="colInfo">
                                <span>FINEMAP log 10 Bayes factor of the SNP being causal</span>
                                <span>float</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col10"
                                    checked
                                    key="log10bf_group"
                                    header="prob"
                                /> log10bf group
                            </span>
                            <div class="colInfo">
                                <span>FINEMAP log 10 Bayes factor of the SNP group being causal</span>
                                <span>float</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col11"
                                    checked
                                    key="snpeff.impact"
                                    header="prob"
                                /> snpeff impact
                            </span>
                            <div class="colInfo">
                                <span>Impact of SNP as reported by SNPEff</span>
                                <span>string</span>
                                <span>set("HIGH", "MODERATE", "LOW", "MODIFIER", "NONE")</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col12"
                                    checked
                                    key="dbsnp.func"
                                    header="prob"
                                /> dbsnp func
                            </span>
                            <div class="colInfo">
                                <span>Functional consequence of the SNP as reported by dbSNP</span>
                                <span>string</span>
                                <span>set("unknown", "coding-synon", "intron", "near-gene-3", "near-gene-5", "ncRNA", "nonsense", "missense", "stop-loss", "frameshift", "cds-indel", "untranslated-3", "untranslated-5", "splice-3", "splice-5", "none")</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col13"
                                    checked
                                    key="is.dbsnp.delit"
                                    header="prob"
                                /> is dbsnp delit
                            </span>
                            <div class="colInfo">
                                <span>SWhether function of the SNP as reported by dbSNP is deliterious</span>
                                <span>boolean</span>
                                <span>value %in% set("missense", "stop-loss","nonsense","frameshift", "cds-indel", "splice-5", "splice-3")</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col14"
                                    checked
                                    key="is.snpeff.delit"
                                    header="prob"
                                /> is snpeff delit
                            </span>
                            <div class="colInfo">
                                <span>Whether impact of SNP as reported by SNPEff is deliterious</span>
                                <span>boolean</span>
                                <span>value %in% set("HIGH", "MODERATE")</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col15"
                                    checked
                                    key="snp.in.trait.DHS"
                                    header="prob"
                                /> snp in trait DHS
                            </span>
                            <div class="colInfo">
                                <span>The number of trait-matched openchromatin peaks that overlap the SNP</span>
                                <span>integer</span>
                                <span>Value of 0 denotes no overlap with one or more openchromatin peaks.</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col16"
                                    checked
                                    key="nearest.trait.DHS.from.gene"
                                    header="prob"
                                /> nearest trait DHS from gene
                            </span>
                            <div class="colInfo">
                                <span>Is this trait-matched openchromatin SNP the nearest one to this gene?</span>
                                <span>boolean</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col17"
                                    checked
                                    key="nearest.gene.from.trait.DHS"
                                    header="prob"
                                /> nearest gene from trait DHS
                            </span>
                            <div class="colInfo">
                                <span>Is this the nearest gene to the trait-matched openchromatin SNP?</span>
                                <span>boolean</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col18"
                                    checked
                                    key="snp.in.DHS"
                                    header="prob"
                                /> snp in DHS
                            </span>
                            <div class="colInfo">
                                <span>The number of openchromatin peaks that overlap the SNP</span>
                                <span>integer</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col19"
                                    checked
                                    key="nearest.DHS.from.gene"
                                    header="prob"
                                /> nearest DHS from gene
                            </span>
                            <div class="colInfo">
                                <span>Is this openchromatin SNP the nearest one to this gene?</span>
                                <span>boolean</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col20"
                                    checked
                                    key="nearest.gene.from.DHS"
                                    header="prob"
                                /> nearest gene from DHS
                            </span>
                            <div class="colInfo">
                                <span>Is this the nearest gene to the openchromatin SNP?</span>
                                <span>boolean</span>
                            </div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col21"
                                    checked
                                    key="in.gtex"
                                    header="prob"
                                /> in gtex
                            </span>
                            <div class="colInfo">
                                <span>Is SNP a GTEx eQTL for a trait-matched tissue or celltype</span>
                                <span>boolean</span>
                            </div>
                        </div>
                        <div id="top_features" class="tab-pane fade">
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col1ei"
                                    checked
                                    key="fn.locus.no.genes"
                                    header="ei"
                                /> Genes
                            </span>
                            <div class="colInfo"># genes at locus</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col2ei"
                                    checked
                                    key="fn.snpeff.rank"
                                    header="ei"
                                /> avg. SNPEff
                            </span>
                            <div class="colInfo">Mean SNPEff rank</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col3ei"
                                    checked
                                    key="fn.locus.no.SNPs"
                                    header="ei"
                                /> SNPs
                            </span>
                            <div class="colInfo"># SNVs at locus</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col4ei"
                                    checked
                                    key="fn.sum.nearest.gene.from.DHS"
                                    header="ei"
                                /> DHS SNPs
                            </span>
                            <div class="colInfo"># SNVs in DHS</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col5ei"
                                    checked
                                    key="fn.min.snp.tss.dist"
                                    header="ei"
                                /> SNP dist.
                            </span>
                            <div class="colInfo">Minimum SNV-gene distance (Δg)</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col6ei"
                                    checked
                                    key="fn.max.locus.z"
                                    header="ei"
                                /> Locus z-score
                            </span>
                            <div class="colInfo">Best GWAS z-score at locus</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col7ei"
                                    checked
                                    key="fn.sum.overlap.bf"
                                    header="ei"
                                /> log10(BF)
                            </span>
                            <div class="colInfo">Sum of log10(BF) for genic SNVs</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col8ei"
                                    checked
                                    key="fn.max.length"
                                    header="ei"
                                /> GeneLen
                            </span>
                            <div class="colInfo">Gene length</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col9ei"
                                    checked
                                    key="fn.mean.dist.prob"
                                    header="ei"
                                /> PostPr/dist
                            </span>
                            <div class="colInfo">Mean (SNV probability / Δg)</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col10ei"
                                    checked
                                    key="fn.max.overlap.1m.snpeff.one"
                                    header="ei"
                                /> Gene SNPEff
                            </span>
                            <div class="colInfo">Genic SNV with SNPEff Impact</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col11ei"
                                    checked
                                    key="fn.max.beta.overlap"
                                    header="ei"
                                /> Gene z-score
                            </span>
                            <div class="colInfo">Best GWAS effect for genic SNV</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col12ei"
                                    checked
                                    key="fn.max.maf"
                                    header="ei"
                                /> MAF
                            </span>
                            <div class="colInfo">Highest effect allele frequency</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col13ei"
                                    checked
                                    key="fn.mean.dist.prob.square"
                                    header="ei"
                                /> PostPr/dist^2
                            </span>
                            <div class="colInfo">Mean (SNV probability / Δg²)</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col14ei"
                                    checked
                                    key="fn.sum.snp.in.DHS.count.beta"
                                    header="ei"
                                /> Beta in DHS
                            </span>
                            <div class="colInfo">∑ (GWAS beta for SNV in DHS)</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col15ei"
                                    checked
                                    key="fn.max.1m.snpeff.impact.none"
                                    header="ei"
                                /> Any SNPEff
                            </span>
                            <div class="colInfo">Any SNV with SNPEff Impact</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col16ei"
                                    checked
                                    key="fn.sum.nearest.nearest.DHS.from.gene.snp.in.DHS"
                                    header="ei"
                                /> SNV in DHS
                            </span>
                            <div class="colInfo">Count of nearest SNV in DHS</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col17ei"
                                    checked
                                    key="fn.max.z"
                                    header="ei"
                                /> Gene z-score
                            </span>
                            <div class="colInfo">Max GWAS z-score</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col18ei"
                                    checked
                                    key="fn.mean.locus.prob"
                                    header="ei"
                                /> avg. PostPr
                            </span>
                            <div class="colInfo">Mean SNV probability</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col19ei"
                                    checked
                                    key="fn.mean.beta.overlap"
                                    header="ei"
                                /> Beta in Gene
                            </span>
                            <div class="colInfo">Mean GWAS beta for genic SNVs</div>
                            <span class="column-option">
                                <input
                                    type="checkbox"
                                    value="col20ei"
                                    checked
                                    key="fn.nearest.trait.DHS.from.gene.dist.inv"
                                    header="ei"
                                /> dhsSNP/dist
                            </span>
                            <div class="colInfo">Nearest SNP in DHS / Δg</div>
                        </div>
                    </div>
                </div>
                <button id="setColumn" class="btn btn-default">Set columns / view column description</button>
            </div>
            <div class="data">
                <div class="legends legends1">
                    <span class="legend">
                        <b>Gene probability:</b>
                    </span>
                    <span class="legend prob_5">&GreaterEqual; 0.8</span>
                    <span class="legend prob_4">&GreaterEqual; 0.6</span>
                    <span class="legend prob_3">&GreaterEqual; 0.4</span>
                    <span class="legend prob_2">&GreaterEqual; 0.2</span>
                    <span class="legend">
                        <b>Positive Control:</b>
                    </span>
                    <span class="legend locus_y_0">&nbsp;</span>= no&nbsp;
                    <span class="legend locus_y_1">&nbsp;</span>= yes&nbsp;
                    <span class="legend">
                        <b>SNP effect impact:</b>
                    </span>
                    <span class="legend snp_eff_4">high</span>
                    <span class="legend snp_eff_3">moderate</span>
                    <span class="legend snp_eff_2">low</span>
                    <span class="legend snp_eff_1">modifier</span>
                    <span class="legend snp_eff_5">none</span>
                </div>
                <div class="legends legends2">
                    <span>*Hover gene name for gene information</span>
                    <span>*Click probability value to see detailed annotations</span>
                </div>
                <div class="row headers">
                    <div>Gene Name</div>
                    <div>Gene Probability</div>
                    <div class="hidden">Locus ID</div>
                    <div>Locus Location</div>
                    <div>Top-20 Gene Features</div>
                </div>
                <div v-for="(row, i) in filteredData" :key="i">
                    <div class="sum geneName" @click="showGene(row.gene)">{{row.gene}}</div>
                    <div class="sum prediction">{{parseFloat(row.prediction).toFixed(decimals)}}</div>
                    <div class="probInfo">
                        <div class="probHeaders">
                            <div
                                class="col1"
                                title="SNP identifier (usually the dbSNP rs identifier)"
                            >snp name</div>
                            <div
                                class="col2"
                                title="Locus from where the FINEMAP statistics where obtained"
                            >snp locus</div>
                            <div class="col3" title="position of SNP on the chromosome">snp pos</div>
                            <div class="col4" title="SNP minor allele frequency">maf</div>
                            <div class="col5" title="SNP effect estimate from the GWAS">beta</div>
                            <div
                                class="col6"
                                title="Standard error of the effect estimate from the GWAS"
                            >se</div>
                            <div class="col7" title="SNP Z-score (beta/se) from the GWAS">z</div>
                            <div
                                class="col8"
                                title="FINEMAP posterior probability of the SNP being causal"
                            >prob</div>
                            <div
                                class="col9"
                                title="FINEMAP log 10 Bayes factor of the SNP being causal"
                            >log10bf</div>
                            <div
                                class="col10"
                                title="FINEMAP log 10 Bayes factor of the SNP group being causal"
                            >log10bf group</div>
                            <div
                                class="col11"
                                title="Impact of SNP as reported by SNPEff"
                            >snpeff impact</div>
                            <div
                                class="col12"
                                title="Functional consequence of the SNP as reported by dbSNP"
                            >dbsnp func</div>
                            <div
                                class="col13"
                                title="SWhether function of the SNP as reported by dbSNP is deliterious"
                            >is dbsnp delit</div>
                            <div
                                class="col14"
                                title="Whether impact of SNP as reported by SNPEff is deliterious"
                            >is snpeff delit</div>
                            <div
                                class="col15"
                                title="The number of trait-matched openchromatin peaks that overlap the SNP"
                            >snp in trait DHS</div>
                            <div
                                class="col16"
                                title="nearest trait DHS from gene"
                            >nearest trait DHS from gene</div>
                            <div
                                class="col17"
                                title="nearest gene from trait DHS"
                            >nearest gene from trait DHS</div>
                            <div class="col18" title="snp in DHS">snp in DHS</div>
                            <div
                                class="col19"
                                title="Is this openchromatin SNP the nearest one to this gene?"
                            >nearest DHS from gene</div>
                            <div
                                class="col20"
                                title="Is this the nearest gene to the openchromatin SNP?"
                            >nearest gene from DHS</div>
                            <div
                                class="col21"
                                title="Is SNP a GTEx eQTL for a trait-matched tissue or celltype"
                            >in gtex</div>
                        </div>
                        <div class="probDetails">
                            <div class="rowVariant" v-for="(v, i) in row.variants">
                                <div class="variantID">{{v.id}}</div>
                                <template v-for="(f,j) in v.features">
                                    <div :class="`${j}`">{{f}}</div>
                                </template>
                            </div>
                        </div>
                    </div>
                    <div class="eiInfo">
                        <div class="eiHeaders">
                            <div class="col0ei">Ei</div>
                            <div class="col1ei" title="# genes at locus">Genes</div>
                            <div class="col2ei" title="Mean SNPEff rank">avg. SNPEff</div>
                            <div class="col3ei" title="# SNVs at locus">SNPs</div>
                            <div class="col4ei" title="# SNVs in DHS">DHS SNPs</div>
                            <div class="col5ei" title="Minimum SNV-gene distance (Δg)">SNP dist.</div>
                            <div class="col6ei" title="Best GWAS z-score at locus">Locus z-score</div>
                            <div class="col7ei" title="Sum of log10(BF) for genic SNVs">log10(BF)</div>
                            <div class="col8ei" title="Gene length">GeneLen</div>
                            <div class="col9ei" title="Mean (SNV probability / Δg)">PostPr/dist</div>
                            <div class="col10ei" title="Genic SNV with SNPEff Impact">Gene SNPEff</div>
                            <div class="col11ei" title="Best GWAS effect for genic SNV">Gene z-score</div>
                            <div class="col12ei" title="Highest effect allele frequency">MAF</div>
                            <div class="col13ei" title="Mean (SNV probability / Δg²)">PostPr/dist^2</div>
                            <div class="col14ei" title="∑ (GWAS beta for SNV in DHS)">Beta in DHS</div>
                            <div class="col15ei" title="Any SNV with SNPEff Impact">Any SNPEff</div>
                            <div class="col16ei" title="Count of nearest SNV in DHS">SNV in DHS</div>
                            <div class="col17ei" title="Max GWAS z-score">Gene z-score</div>
                            <div class="col18ei" title="Mean SNV probability">avg. PostPr</div>
                            <div class="col19ei" title="Mean GWAS beta for genic SNVs">Beta in Gene</div>
                            <div class="col20ei" title="Nearest SNP in DHS / Δg">dhsSNP/dist</div>
                        </div>
                        <div class="eiDetails">
                            <template v-for="(f, i) in row.features.predictor">
                                <div :class="`${i}`" :key="i">{{f}}</div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-richards", {
    props: ["tableData"],
    data() {
        return {
            decimals: 3,
            selected: keyParams.trait || "t2d",
            findGene: "",
            findProb: ""
        };
    },
    mounted() {},
    computed: {
        tableGeneData() {
            //wait until prop is done loading before sorting
            if (this.tableData) {
                return this.tableData.data.sort((a, b) =>
                    a["prediction"] < b["prediction"] ? 1 : -1
                );
            }
        },
        graphData() {
            return this.tableData;
        },
        filteredData() {
            if (this.findGene) return this.filterGene(this.findGene);
            else if (this.findProb) return this.filterProb(this.findProb);
            else return this.tableGeneData;
        }
    },
    methods: {
        showGene(gene) {
            //console.log("gene", gene);
            this.$store.dispatch("selectGene", gene);
            uiUtils.showElement("feature-scores-wrapper");
        },
        filterGene(input) {
            if (!!input)
                return this.tableGeneData.filter(row => {
                    return (
                        row.gene.toLowerCase().indexOf(input.toLowerCase()) > -1
                    );
                });
        },
        filterProb(input) {
            if (!!input)
                return this.tableGeneData.filter(row => {
                    return row.prediction >= input;
                });
            else return data;
        }
    },
    watch: {
        selected(value) {
            window.location = `/effectorgenes.html?trait=${value}&dataset=${keyParams.dataset}`;
        }
    }
});
</script>

<style>
</style>
