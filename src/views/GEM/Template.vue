<template>
    <div id="gem">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <documentation name="region.lz.subheader"></documentation>
                    <documentation name="region.igv.subheader"></documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="filtering-ui-wrapper container-fluid">
                        <div class="row filtering-ui-content">filters</div>
                    </div>
                    <b-tabs content-class="mt-3">
                        <b-tab title="Score View" active>
                            <b-table
                                hover
                                small
                                responsive="sm"
                                :items="groupedAssociations"
                                :fields="fields"
                                :per-page="perPage"
                                :current-page="currentPage"
                                :sort-null-last="true"
                                :sortable="true"
                            ></b-table>
                        </b-tab>
                        <b-tab title="Evidence View">
                            <locuszoom
                                v-if="$parent.selectedPhenotypes.length > 0"
                                ref="locuszoom"
                                :chr="$store.state.chr"
                                :start="$store.state.start"
                                :end="$store.state.end"
                                :filterAssociations="$parent.associationsFilter"
                                :filterAnnotations="$parent.annotationsFilter"
                                @regionchanged="
                                    ($event) => {
                                        $parent.requestCredibleSets(
                                            $event.data
                                        );
                                    }
                                "
                                :ldpop="true"
                                :refSeq="true"
                            >
                                <p
                                    v-for="phenotype in $parent.selectedPhenotypes"
                                    :key="phenotype.name"
                                >
                                    <lz-associations-panel
                                        :phenotype="phenotype.name"
                                        :title="phenotype.description"
                                        @input="
                                            $parent.updatePageAssociations({
                                                phenotype: phenotype.name,
                                                data: $event,
                                            })
                                        "
                                    ></lz-associations-panel>
                                    <lz-catalog-annotations-panel
                                        :phenotype="phenotype.name"
                                        :title="phenotype.description"
                                    ></lz-catalog-annotations-panel>
                                </p>
                            </locuszoom>
                        </b-tab>
                    </b-tabs>
                </div>
            </div>
        </div>

        <b-button v-b-toggle.sidebar-1>Show Criteria</b-button>
        <b-sidebar id="sidebar-1" title="Criteria" shadow>
            <div class="px-3 py-2">
                <p class="border-left">
                    Cras mattis consectetur purus sit amet fermentum. Cras justo
                    odio, dapibus ac facilisis in, egestas eget quam. Morbi leo
                    risus, porta ac consectetur ac, vestibulum at eros.
                </p>
                <gene-selectpicker
                    @onGeneChange="$store.dispatch('onGeneChange', $event)"
                ></gene-selectpicker>
            </div>
        </b-sidebar>
    </div>
</template>
