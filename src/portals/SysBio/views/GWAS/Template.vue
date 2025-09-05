<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body">
            <div v-if="$parent.pageInfo">
                <h2>{{ $parent.pageInfo.title }}</h2>
                <div v-html="$parent.pageInfo.body"></div>
            </div>
            <div class="f-row gwas-plots" style="margin:20px 0 40px 0">
                <div style="flex:1">
                    <img src="https://sysbio.hugeampkpnbi.org/api/raw/plot/dataset/GWAS/SysBio_Nalls2025_ADvPD_EU/SysBio_ADvPD/manhattan.png" />
                </div>
                <div style="flex:1">
                    <img src="https://sysbio.hugeampkpnbi.org/api/raw/plot/dataset/GWAS/SysBio_Nalls2025_ADvPD_EU/SysBio_ADvPD/qq.png" />
                </div>
            </div>
            <div v-if="$parent.tableData" class="f-col" style="gap:10px">
                <h4>Top single-variant association signals for AD versus PD: European Ancestry</h4>
                <!-- FILTERS GO HERE -->
                <criterion-function-group>
                    <filter-enumeration-control
                        class="filter-col-md"
                        field="nearest"
                        :options="$parent.nearestGenes"
                        :multiple="true"
                        :inclusive="true"
                        @input-change="event => $parent.processInput(event)"
                    >
                        <div>
                            <strong>Closest genes</strong>
                        </div>
                    </filter-enumeration-control>
                    <filter-pvalue-control
                        class="filter-col-md"
                        :field="'pValue'"
                    >
                        <div>
                            <strong>pValue (&le;)</strong>
                        </div>
                    </filter-pvalue-control>
                    <filter-greater-less
                            key="beta"
                            field="beta"
                            label="Beta"
                        >
                            <div class="label"><strong>Beta</strong></div>
                        </filter-greater-less>
                    <filter-enumeration-control
                        class="filter-col-md"
                        field="chromosome"
                        :options="$parent.chromosomes"
                        :disableSort="true"
                        :multiple="true"
                        :inclusive="true"
                        @input-change="$event => $parent.filterChromosome($event)"
                    >
                        <div>
                            <strong>Chromosome</strong>
                        </div>
                    </filter-enumeration-control>
                    <filter-position>
                        <div>
                            <strong>Position (start-end)</strong>
                        </div>
                    </filter-position>
                    
                    <template #filtered="{filter}">
                        <b-table
                            small
                            hover
                            responsive="sm"
                            :items="$parent.tableData.filter(filter)"
                            :fields="$parent.tableFields"
                            :per-page="10"
                            :current-page="$parent.currPage"
                            :sortBy="$parent.currSort.sortBy"
                            :sortDesc="$parent.currSort.sortDesc"
                            :sort-icon-left="true"
                        >
                            <template #thead-top>
                                <tr>
                                <th colspan="5" style="background: none; border: 0; font-weight: normal;">Total Rows: {{ $parent.totalRows }}</th>
                                <th colspan="2" style="border:0; text-align: center;">{{ $parent.tablePhenotype }}</th>
                                </tr>
                            </template>
                            <template #cell(allele)="data">
                                {{ data.item.reference }}/{{ data.item.alt }}
                            </template>
                            <template #cell(beta)="data">
                            <span>
                                <span v-if="data.item.beta > 0" style="color:#ff00c7">▲</span>
                                <span v-else-if="data.item.beta < 0" style="color:#12bdfe">▼</span>
                                {{ data.item.beta }}
                            </span>
                        </template>
                        </b-table>
                        <div class="f-row fill-width align-v-center align-h-center">
                            <b-pagination
                                v-model="$parent.currPage"
                                class="pagination-sm justify-content-center"
                                style="justify-self:center; margin: 0 !important"
                                :total-rows="$parent.tableData.filter(filter).length"
                                :per-page="10"
                            />
                        </div>
                    </template>
                </criterion-function-group>
            </div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
    </div>
</template>
<style scoped>
.gwas-plots img {
  width: 100%;
  height: auto;
  display: block;
}
</style>