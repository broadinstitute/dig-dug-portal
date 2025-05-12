<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body">
            <div v-if="$parent.pageInfo" style="margin:0 0 40px">
                <h2>{{ $parent.pageInfo.title }}</h2>
                <div v-html="$parent.pageInfo.body"></div>
            </div>
            <h2>SysBio FAIRplex Genome-Wide Association Studies</h2>
            <div style="font-size: 16px;">
                Explore visualizations of Genome-Wide Association Studies (GWAS) from the Accelerating 
                Medicines Partnership (AMP) programs. Case versus case Genome-Wide Association Studies 
                (GWAS) were performed on individuals with Alzheimer's Disease (AD) from AMP-AD versus 
                individuals with Parkinson's disease (PD) from AMP-PD. In the Manhattan plot, the x-axis 
                represents the genome as if all chromosomes were laid end-to-end, ordered by their chromosome 
                number. The y-axis shows the -log10(p-value) of each association. Each point represents a variant. In the Quantile-Quantile (Q-Q) probability plot, the x-axis represents the expected quantiles of all associations under a uniform distribution function, and the y-axis shows the actual values. 
            </div>
            <div class="f-row gwas-plots" style="margin:20px 0">
                <div style="flex:1">
                    <img src="https://sysbio.hugeampkpnbi.org/api/raw/plot/dataset/GWAS/SysBio_Nalls2025_ADvPD_EU/SysBio_ADvPD/manhattan.png" />
                </div>
                <div style="flex:1">
                    <img src="https://sysbio.hugeampkpnbi.org/api/raw/plot/dataset/GWAS/SysBio_Nalls2025_ADvPD_EU/SysBio_ADvPD/qq.png" />
                </div>
            </div>
            <div v-if="$parent.tableData">
                <b-table
                    small
                    hover
                    responsive="sm"
                    :items="$parent.tableData"
                    :fields="$parent.tableFields"
                    :per-page="10"
                    :current-page="$parent.currPage"
                    :sort-icon-left="true"
                >
                </b-table>
                <div class="f-row fill-width align-v-center align-h-center">
                    <b-pagination
                        v-model="$parent.currPage"
                        class="pagination-sm justify-content-center"
                        style="justify-self:center; margin: 0 !important"
                        :total-rows="$parent.totalRows"
                        :per-page="10"
                    />
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
    </div>
</template>

<script>
export default {

}
</script>

<style scoped>
.gwas-plots img {
  width: 100%;
  height: auto;
  display: block;
}
</style>