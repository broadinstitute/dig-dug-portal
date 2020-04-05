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
                        <span>Variant Info</span>
                    </div>
                    <!-- change this class to variantInfo -->
                    <div class="col-md-4 gene-page-header-body variantInfo">
                        <div
                            id="variantSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >
                            <div class="variant-search">
                                <div class="col-md-3 input-wrapper">
                                    <input
                                        v-model="$store.state.variant"
                                        type="text"
                                        class="form-control input-default"
                                        style="margin-left: 15px;padding-left: 30px;"
                                        placeholder="Search Variant"
                                    />
                                </div>
                                <div class="col-md-2 input-wrapper">
                                    <button
                                        id="variantSearchGo"
                                        class="btn btn-primary"
                                        type="button"
                                        @click="$store.dispatch('queryVariant')"
                                    >GO</button>
                                </div>
                            </div>
                            {{$store.state.variant}}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
