<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-4 gene-page-header-title"></div>
                    <!-- change this to variantSearchHolder 
                    mdkp.utility.showHideElement('phenotypeSearchHolder')
                    -->
                    <div class="col-md-4 gene-page-header-title">
                        Variant
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('variantSearchHolder');"
                        >Set variant ID</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title"></div>
                    <div class="col-md-4 gene-page-header-body">
                        <span>
                            Variant Info
                            {{$store.state.chr}}:{{$store.state.pos}}:{{$store.state.ref}}:{{$store.state.alt}}
                        </span>
                    </div>
                    <!-- change this class to variantInfo -->
                    <div class="col-md-4 gene-page-header-body variantInfo">
                        <div
                            id="variantSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >
                            <div class="variant-search">
                                <div class="col-md-10 input-wrapper">
                                    <input
                                        v-model="$store.state.variantID"
                                        type="text"
                                        class="form-control input-default"
                                        style="margin-left: 15px;padding-top: 30px;padding-left:30px"
                                        placeholder="Search Variant"
                                    />

                                    <div class="col-md-2 input-wrapper">
                                        <button
                                            id="regionSearchGo"
                                            class="btn btn-primary"
                                            type="button"
                                            @click="$store.dispatch('onVariantIDChange')"
                                        >GO</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 gene-page-header-body">
                <tr v-for="row in $store.state.variant.data">
                    <td>amino_acids {{row.transcriptConsequence.amino_acids}}</td>
                    <td>biotype {{row.transcriptConsequence.biotype}}</td>
                    <td>cadd_phred {{row.transcriptConsequence.cadd_phred}}</td>

                    <!-- <td>consequence_terms {{row.transcriptConsequence.consequence_terms}</td> -->
                </tr>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
