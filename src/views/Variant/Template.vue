<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Variant
                        <tooltip-documentation name="variant.alleles.tooltip.hover" :isHover="true"></tooltip-documentation>
                        <a
                            class="edit-btn"
                            v-on:click="$parent.showHideElement('variantSearchHolder','variant_search_input')"
                        >Set variant</a>
                    </div>

                    <div class="col-md-12 gene-page-header-body">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder hidden">
                            <div class="col-md-5">
                                <input
                                    v-model="$store.state.newVariantId"
                                    type="text"
                                    class="form-control input-default"
                                    placeholder="Search Variant"
                                    id="variant_search_input"
                                />
                            </div>
                            <div class="col-md-1 input-wrapper">
                                <button
                                    id="variantSearchGo"
                                    class="btn btn-primary"
                                    type="button"
                                    @click="$store.dispatch('queryVariant', $store.state.newVariantId)"
                                >GO</button>
                            </div>
                            <div class="col-md-6 search-example">
                                <strong>Search format examples</strong>
                                <br />rs11716727, chr3:12489012_C_T, 3_12489012:C/T, chr3_12489012-C-T
                            </div>
                        </div>
                        <span>
                            {{$parent.varId}}
                            <span v-if="$parent.dbSNP">
                                <span style="color: gray">/</span>
                                {{$parent.dbSNP}}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Closests Genes</h4>
                    <documentation
                        name="variant.genes.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                    <div v-if="$store.state.variant && $store.state.variant.nearest">
                        <div
                            v-for="gene in $store.state.variant.nearest"
                            class="gene-with-signal protein_coding"
                        >
                            <a :href="`/gene.html?gene=${gene}`">{{gene}}</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$store.state.transcriptConsequences.data.length > 0">
                        <h4 class="card-title">Predicted Transcript Consequences</h4>
                        <documentation
                            name="variant.effect.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <transcript-consequence-table
                            v-bind:transcriptConsequences="$store.state.transcriptConsequences.data"
                        ></transcript-consequence-table>
                    </div>
                    <div v-else-if="$store.state.variant">
                        <h4 class="card-title">Most Severe Consequence</h4>
                        {{$parent.consequenceFormatter($store.state.variant.consequence)}} &mdash; {{$parent.consequenceMeaning($store.state.variant.consequence)}}
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">PheWAS Visualization</h4>

                    <locuszoom
                        ref="locuszoom"
                        :chr="$store.state.chr"
                        :start="$store.state.start"
                        :end="$store.state.end"
                        :refSeq="false"
                    >
                        <lz-phewas-panel
                            v-if="$store.state.variant"
                            :varId="$store.state.variant.varId"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                        ></lz-phewas-panel>
                    </locuszoom>

                    <h4 class="card-title">
                        <documentation
                            name="variant.phewas.table.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>
                    </h4>
                    <phewas-table
                        v-if="$store.state.phewas.data"
                        :associations="$store.state.phewas.data"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                    ></phewas-table>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4
                        class="card-title"
                    >Transcription factor binding motifs altered by {{$parent.variantName}}</h4>
                    <documentation
                        name="variant.tfbinding.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>

                    <div v-if="$store.state.transcriptionFactors.data">
                        <transcription-factors-table
                            v-bind:transcriptionFactors="$store.state.transcriptionFactors.data"
                        ></transcription-factors-table>
                    </div>
                    <div v-else class="card-body">
                        <h4>None found</h4>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Annotated regions overlapping {{$parent.variantName}}</h4>
                    <documentation
                        name="variant.annotated.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                    <regions-table :regions="$parent.regions"></regions-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
