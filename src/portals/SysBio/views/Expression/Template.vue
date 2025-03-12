<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body">
            <h2>Differential gene expression across AMP programs</h2>
            <div class="f-row" style="gap:50px">
                <bulk-volcano-plot v-if="$parent.deData"
                    :renderData="$parent.deData"
                    :renderConfig="$parent.bulkVolcanoConfig"
                    :margin="$parent.margin"
                    sectionId="_bulk"
                />
                <div v-if="$parent.deData" class="f-col" style="flex:1">
                    <data-download
                        class="download"
                        :data="$parent.deData"
                        :filename="`sysbio_dge`"
                        style="width: 125px; align-self: flex-end;"
                        ></data-download>
                    <b-table
                        small
                        :items="$parent.deData"
                        :fields="['GENE', 'BETA', 'neg_log10_p']"
                        sortBy="neg_log10_p"
                        :sortDesc="true"
                        :per-page="10"
                        :current-page="$parent.dePage"
                    >
                    </b-table>
                    <b-pagination
                        v-model="$parent.dePage"
                        class="pagination-sm justify-content-center"
                        :total-rows="$parent.deData.length"
                        :per-page="10"
                    ></b-pagination>
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
::v-deep .download button{
    color: black;
    background-color: white;
    padding: .2em .2em;
    border: 0;
    box-shadow: 0px 1px 2px 0 black;
}
::v-deep .download button:hover{
    color: black;
    background-color: #ccc;
}
</style>