<template>
    <div>
        <div class="sum geneName">{{this.gene.gene}}</div>
        <div class="sum prob">
            {{parseFloat(this.gene.prediction).toFixed(decimals)}}
            <button
                class="btn btn-xs btn-default probBtn"
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
                    <div class="variantID">{{v.id}}</div>
                    <template v-for="(f,j) in v.features">
                        <div :class="`${j}`">{{f}}</div>
                    </template>
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
                <template v-for="(f, i) in this.gene.features.predictor">
                    <div :class="`${i}`" :key="i">{{f}}</div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("effector-genes-item", {
    props: ["gene"],
    data() {
        return {
            decimals: 3,
            showVariants: false,
            showFeatures: false
        };
    },
    methods: {
        plotGene() {
            this.$store.dispatch("selectGene", this.gene.gene);
            uiUtils.showElement("feature-scores-wrapper");
        }
    }
});
</script>

<style>
</style>
