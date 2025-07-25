<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="variantsearch.header.info"
                        :contentMap="$store.state.bioPortal.documentations"
                    ></documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Variant Search</h1>
                    <documentation
                        name="variantsearch.subheader"
                        :contentMap="$store.state.bioPortal.documentations"
                    ></documentation>

                    <transition name="fade"
                        ><b-alert show v-if="$parent.selectedGene.length === 0"
                            >Please select a gene.</b-alert
                        >
                        <!--
                        <b-alert
                            show
                            v-else-if="$parent.selectedDataset.length === 0"
                            >Please select a dataset.</b-alert
                        > -->
                    </transition>
                    <criterion-list-group
                        v-model="$parent.searchCriteria"
                        :header="'Search Criteria'"
                    >
                        <filter-enumeration-control
                            ref="gene"
                            :field="'gene'"
                            placeholder="Select a gene ..."
                            :options="$parent.matchingGenes"
                            @input-change="$parent.lookupGenes($event)"
                        >
                            <div class="label">Gene</div>
                        </filter-enumeration-control>
                        <!-- <b-col class="divider"></b-col>
                        <filter-enumeration-control
                            ref="dataset"
                            :field="'dataset'"
                            placeholder="Select a dataset ..."
                            :options="$parent.datasets"
                            :multiple="true"
                        >
                            <div class="label">
                                Dataset
                            </div></filter-enumeration-control
                        > -->
                    </criterion-list-group>

                    <variant-search
                        :gene="$parent.selectedGene"
                    ></variant-search>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
</style>
