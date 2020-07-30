<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-7 gene-page-header-title">
                        Gene
                        <a
                            class="edit-btn"
                            @click="$parent.showHideElement('variantSearchHolder','gene_search_input')"
                        >Search gene</a>
                    </div>

                    <div class="col-md-7 gene-page-header-body">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder hidden">
                            <div class="col-md-10">
                                <input
                                    v-model="$store.state.geneName"
                                    type="text"
                                    class="form-control input-default"
                                    placeholder="Search gene"
                                    id="gene_search_input"
                                />
                            </div>
                            <div class="col-md-2 input-wrapper">
                                <button
                                    id="variantSearchGo"
                                    class="btn btn-primary"
                                    type="button btn-lg"
                                    @click="$store.dispatch('queryGeneName')"
                                >GO</button>
                            </div>
                        </div>
                        <div v-if="$parent.symbolName">
                            <span>
                                {{$parent.symbolName}}
                                <span
                                    v-if="$parent.symbolName.toLowerCase() !== $store.state.geneName.toLowerCase()"
                                >({{$store.state.geneName}})</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HuGeCalculator -->
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4
                        v-if="$store.state.phenotype"
                        class="card-title"
                    >Associations for {{$store.state.phenotype.name}} in {{$parent.symbolName}}</h4>

                    <locuszoom
                        v-if="$parent.region"
                        ref="locuszoom"
                        :chr="$parent.region.chromosome"
                        :start="$parent.region.start"
                        :end="$parent.region.end"
                        :refSeq="true"
                    >
                        <lz-associations-panel
                            :phenotype="$store.state.phenotype.name"
                            :finishHandler="$parent.updateAssociationsTable"
                        ></lz-associations-panel>
                    </locuszoom>
                    <associations-table
                        :phenotypes="$parent.phenotypes"
                        :associations="$parent.associationsData"
                        :showFilters="false"
                    ></associations-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
