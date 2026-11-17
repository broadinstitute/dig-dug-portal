<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <search-header-wrapper>

                <div class="col filter-col-md">
                    <div class="label">Variant</div>
                    <input
                        v-model="$store.state.newVariantId"
                        type="text"
                        class="form-control"
                        placeholder="Search Variant"
                        id="variant_search_input"
                    />
                </div>
                <div class="col filter-col-sm">
                    <button
                        id="variantSearchGo"
                        class="btn btn-light btn-sm go"
                        type="button"
                        @click="
                            $store.dispatch(
                                'queryVariant',
                                $store.state.newVariantId
                            )
                        "
                    >
                        GO
                    </button>
                </div>
                <div class="col divider"></div>
                <div class="col filter-col-md search-example">
                    <div class="label">Search format examples</div>
                    <div>
                        rs11716727, chr3:12489012_C_T, 3_12489012:C/T,
                        chr3_12489012-C-T
                    </div>
                </div>
            </search-header-wrapper>

            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-9 gene-page-header-title">
                        Variant
                        <tooltip-documentation
                            name="variant.alleles.tooltip.hover"
                            :isHover="true"
                        ></tooltip-documentation>
                    </div>
                   
                    <div class="col-md-9 gene-page-header-body">
                        <span>
                            {{ $parent.varId }}
                            <span v-if="$parent.dbSNP">
                                <span style="color: gray">/</span>
                                {{ $parent.dbSNP }}
                            </span>
                            <span v-if="$store.state.variant.existing_variation != '-' ">
                                <span style="color: gray">/</span>
                                {{ $store.state.variant.existing_variation}}
                            </span>
                        </span>
                    </div>
                </div>
            </div> 
            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="
                            $store.state.variant.varId
                        "
                    >
                        <h4 class="card-title">
                            Phenotypes observed for variant carriers in the BCH Aggregator
                        </h4>
                        <h6>To view information about cohorts in the BCH Aggregator, visit the <href a="research.html?pageid=bch_datasets_n127">dataset page</href></h6>
                        <variant-phenotype-table
                            v-bind:variantId="
                                $store.state.variant.varId
                            "
                        ></variant-phenotype-table>
                        
                    </div>
                    
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="$store.state.samples.data.length>0"
                    >
                        <h4 class="card-title">
                            Samples
                        </h4>
                        <variant-sample-table
                            v-bind:samples="
                                $store.state.samples.data
                            ">
                        </variant-sample-table>
                        
                    </div>
                    
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="$store.state.variant.varId"
                    >
                        <h4 class="card-title">
                            Carrier counts within gnomAD ancestries
                        </h4>
                        <gnominfo-card
                            v-bind:variantId="
                                $store.state.variant.varId
                            ">
                        </gnominfo-card>
                        
                    </div>
                    
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                            v-if="
                                $store.state.gqualitymetrics.data.length > 0
                            "
                        >
                        <genotypequalitymetrics-tab v-bind:chartdata="
                                        $store.state.gqualitymetrics.data[0]
                                    ">
                            
                        </genotypequalitymetrics-tab>
                        
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                            v-if="
                                $store.state.gqualitymetrics.data.length > 0
                            "
                        >
                        <allgenoqualitymetrics-tab v-bind:chartdata="
                                        $store.state.gqualitymetrics.data[0]
                                    ">
                            
                        </allgenoqualitymetrics-tab>
                        
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                            v-if="
                                $store.state.squalitymetrics.data.length > 0
                            "
                        >
                        <sitequalitymetrics-tab v-bind:vardata="
                                        $store.state.squalitymetrics.data[0]
                                    "></sitequalitymetrics-tab>
                    </div>
                </div>
            </div>

            <div v-if="$store.state.variant && $store.state.variant.nearest">

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">Closest genes</h4>
                        <documentation
                            name="variant.genes.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>
                        <div
                            v-if="
                                $store.state.variant && $store.state.variant.nearest
                            "
                        >
                            <div
                                class="gene-with-signal protein_coding"
                            >
                                <a :href="`/gene.html?gene=${$store.state.variant.nearest}`">{{ $store.state.variant.nearest }}</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <div
                            v-if="
                                $store.state.transcriptConsequences.data.length > 0
                            "
                        >
                            <h4 class="card-title">
                                Predicted variant consequences
                                <tooltip-documentation
                                    name="variant.consequences.tooltip"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h4>
                            <documentation
                                name="variant.effect.subheader"
                                :content-fill="$parent.documentationMap"
                            ></documentation>

                            <transcript-consequence-table
                                v-bind:transcriptConsequences="
                                    $store.state.transcriptConsequences.data
                                "
                            ></transcript-consequence-table>
                        </div>
                        <div v-else-if="$store.state.variant">
                            <h4 class="card-title">
                                Most severe variant consequence
                            </h4>
                            {{
                                $parent.consequenceFormatter(
                                    $store.state.variant.consequence
                                )
                            }}
                            &mdash;
                            {{
                                $parent.consequenceMeaning(
                                    $store.state.variant.consequence
                                )
                            }}
                        </div>
                    </div>
                </div>
                

            </div> 
        </div> 

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
