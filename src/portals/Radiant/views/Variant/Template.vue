<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <!-- Wrap page level searchs with "pageSearchParameters" div -->

                <div class="col filter-col-md">
                    <div class="label">Variant</div>
                    <input
                        id="variant_search_input"
                        v-model="$store.state.newVariantId"
                        type="text"
                        class="form-control"
                        placeholder="Search Variant"
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

            <div v-if="!$parent.varId" class="card">
                <div class="row card-body">
                    <div class="col-12 text-center">
                        <b-alert show variant="warning">
                            <b-icon icon="exclamation-triangle"></b-icon> No
                            variant information found.
                        </b-alert>
                    </div>
                </div>
            </div>

            <div v-else class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-9 gene-page-header-title">
                        Variant
                        <tooltip-documentation
                            name="variant.alleles.tooltip.hover"
                            :is-hover="true"
                        ></tooltip-documentation>
                    </div>
                    <!--  <div class="col-md-3 gene-page-header-title">Navigate</div> -->

                    <div class="col-md-9 gene-page-header-body">
                        <span>
                            {{ $parent.varId }}
                            <span v-if="$parent.dbSNP">
                                <span style="color: gray">/</span>
                                {{ $parent.dbSNP }}
                            </span>
                        </span>
                    </div>
                    <!-- <div class="col-md-3 gene-page-header-body">
                        <button
                            class="btn btn-primary explore-region-btn"
                            @click="$parent.exploreRegion()"
                        >
                            Explore region
                        </button>
                    </div> -->
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
                            Phenotypes of variant carriers in NephKP
                        </h4>
                        <variant-phenotype-table
                            :variant-id="$store.state.pageVariant.varId"
                        ></variant-phenotype-table>
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
                                :is-hover="true"
                                :no-icon="false"
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="variant.effect.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <transcript-consequence-table
                            :transcript-consequences="
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

            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="
                            $store.state.transcriptConsequences.data.length > 0
                        "
                    >
                        <h4 class="card-title">
                            gnomAD Population Frequencies
                        </h4>
                        <gnominfo-card
                            :variant-id="$store.state.pageVariant.varId"
                        >
                        </gnominfo-card>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
