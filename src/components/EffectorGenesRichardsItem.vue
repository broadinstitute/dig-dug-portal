<template>
    <div class="row-summary">
        <div class="sum geneName">
            {{this.gene.gene}}
            <div class="geneInfo">
                <span>NCBI ID:</span>
                <span>Ensembl ID:</span>
                <span>Location:</span>
                <span>Gene strand: {{this.gene.variants[0].features["gene.strand"]}}</span>
                <span>Gene TSS:</span>
                <span>
                    <a :href="'/gene.html?gene='+this.gene.gene">Go to gene page</a>
                </span>
                <span>
                    <a :href="'javascript:;'">Go to region page</a>
                </span>
            </div>
        </div>
        <div class="sum prob" :class="this.classProb">
            {{parseFloat(this.gene.prediction).toFixed(decimals)}}
            <button
                class="btn btn-sm btn-default probBtn"
                @click="showVariants = !showVariants"
            >View variant features</button>
        </div>
        <div class="sum ei">
            <button
                class="btn btn-sm btn-info eiButton"
                @click="showFeatures = !showFeatures"
            >View gene features</button>
            <button
                :id="`eiPlotBtn${this.gene.gene}`"
                class="btn btn-sm btn-info eiPlot"
                @click="plotGene"
            >View summary plots</button>
        </div>
        <div class="probInfo" :id="`info_${this.gene.gene}`" v-show="showVariants">
            <div class="probHeaders">
                <div class="col1" title="SNP identifier (usually the dbSNP rs identifier)">snp name</div>
                <div
                    class="col2"
                    title="Locus from where the FINEMAP statistics where obtained"
                >snp locus</div>
                <div class="col3" title="position of SNP on the chromosome">snp pos</div>
                <div class="col4" title="SNP minor allele frequency">maf</div>
                <div class="col5" title="SNP effect estimate from the GWAS">beta</div>
                <div class="col6" title="Standard error of the effect estimate from the GWAS">se</div>
                <div class="col7" title="SNP Z-score (beta/se) from the GWAS">z</div>
                <div class="col8" title="FINEMAP posterior probability of the SNP being causal">prob</div>
                <div
                    class="col9"
                    title="FINEMAP log 10 Bayes factor of the SNP being causal"
                >log10bf</div>
                <div
                    class="col10"
                    title="FINEMAP log 10 Bayes factor of the SNP group being causal"
                >log10bf group</div>
                <div class="col11" title="Impact of SNP as reported by SNPEff">snpeff impact</div>
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
                <div class="col16" title="nearest trait DHS from gene">nearest trait DHS from gene</div>
                <div class="col17" title="nearest gene from trait DHS">nearest gene from trait DHS</div>
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
                <div class="rowVariant" v-for="(v, i) in this.gene.variants">
                    <div class="variantID probDetail">{{v.id}}</div>
                    <div class="probDetail">{{v.features["snp.locus"]}}</div>
                    <div class="probDetail">{{v.features["snp.pos"]}}</div>
                    <div class="probDetail">{{v.features["maf"]}}</div>
                    <div class="probDetail">{{v.features["beta"]}}</div>
                    <div class="probDetail">{{v.features["se"]}}</div>
                    <div class="probDetail">{{v.features["z"]}}</div>
                    <div class="probDetail">{{v.features["prob"]}}</div>
                    <div class="probDetail">{{v.features["log10bf"]}}</div>
                    <div class="probDetail">{{v.features["log10bf_group"]}}</div>
                    <div
                        :class="'probDetail snp_eff_' + v.features['snpeff.rank']"
                    >{{v.features["snpeff.impact"]}}</div>
                    <div class="probDetail">{{v.features["dsbsnp.func"]}}</div>
                    <div class="probDetail">{{v.features["is.dbsnp.delit"]}}</div>
                    <div class="probDetail">{{v.features["is.snpeff.delit"]}}</div>
                    <div class="probDetail">{{v.features["snp.in.trait.DHS"]}}</div>
                    <div class="probDetail">{{v.features["nearest.trait.DHS.from.gene"]}}</div>
                    <div class="probDetail">{{v.features["nearest.gene.from.trait.DHS"]}}</div>
                    <div class="probDetail">{{v.features["snp.in.DHS"]}}</div>
                    <div class="probDetail">{{v.features["nearest.DHS.from.gene"]}}</div>
                    <div class="probDetail">{{v.features["nearest.gene.from.DHS"]}}</div>
                    <div class="probDetail">{{v.features["in.gtex"]}}</div>

                    <!--<template v-for="(f,j) in v.features">
                        <div :class="classImpact(v,j)">{{f}}</div>
                    </template>-->
                </div>
            </div>
        </div>
        <div class="eiInfo" v-show="showFeatures">
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
                <div class v-for="(v, i) in this.gene.features">
                    <div :class="'col'+i+'ei eiDetail'">{{v["Ei"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.locus.no.genes"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.snpeff.rank"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.locus.no.SNPs"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.sum.nearest.gene.from.DHS"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.min.snp.tss.dist"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.max.locus.z"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.sum.overlap.bf"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.max.length"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.mean.dist.prob"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.max.overlap.1m.snpeff.one"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.max.beta.overlap"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.max.maf"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.mean.dist.prob.square"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.sum.snp.in.DHS.count.beta"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.max.1m.snpeff.impact.none"]}}</div>
                    <div
                        :class="'col'+i+'ei eiDetail'"
                    >{{v["fn.sum.nearest.nearest.DHS.from.gene.snp.in.DHS"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.max.z"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.mean.locus.prob"]}}</div>
                    <div :class="'col'+i+'ei eiDetail'">{{v["fn.mean.beta.overlap"]}}</div>
                    <div
                        :class="'col'+i+'ei eiDetail'"
                    >{{v["fn.nearest.trait.DHS.from.gene.dist.inv"]}}</div>
                </div>
                <!--<template v-for="(f, i) in this.gene.features.predictor">
                    <div :class="`${i}`" :key="i">{{f}}</div>
                </template>-->
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("effector-genes-richards-item", {
    props: ["gene"],
    data() {
        return {
            decimals: 3,
            showVariants: false,
            showFeatures: false,
        };
    },
    computed: {
        classProb() {
            let prob = this.gene.prediction;
            let lvl = "";
            switch (true) {
                case prob >= 0.8:
                    lvl = "5";
                    break;
                case prob >= 0.6:
                    lvl = "4";
                    break;
                case prob >= 0.4:
                    lvl = "3";
                    break;
                case prob >= 0.2:
                    lvl = "2";
                    break;
                default:
                    lvl = "1";
            }
            return `prob_score_${lvl}`;
        },
    },
    methods: {
        plotGene() {
            this.$store.dispatch("selectGene", this.gene.gene);
            uiUtils.showElement("feature-scores-wrapper");
        },
        classImpact(variant, column) {
            if (column != "snpeff.impact") return column;
            else return `${column} snp_eff_${variant.features["snpeff.rank"]}`;
        },
    },
});
</script>

<style>
</style>
