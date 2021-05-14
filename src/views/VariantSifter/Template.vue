<template>
    <div id="variant-finder">
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="variantsifter.header.info"
                    ></documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Variant Sifter</h1>

                    <documentation
                        name="tools.variantsifter.subheader"
                    ></documentation>

                    <h4 class="card-title">Build search criteria</h4>
                    <b-container fluid class="filtering-ui-wrapper add-search">
                        <b-row class="filtering-ui-content">
                            <div>
                                <div class="col filter-col-md">
                                    <div class="label">Search gene</div>
                                    <gene-selectpicker
                                        @onGeneChange="
                                            $parent.onGeneChange($event)
                                        "
                                    ></gene-selectpicker>
                                </div>
                                <div
                                    class="col divider"
                                    style="background: none"
                                >
                                    <span class="or-text">or</span>
                                </div>
                                <div class="col filter-col-md">
                                    <div class="label">Set Region</div>
                                    <input
                                        v-model="$parent.region"
                                        type="text"
                                        class="form-control input-default"
                                        placeholder="Chr:Start-End"
                                    />
                                </div>
                                <div class="col divider"></div>
                                <div class="col filter-col-md">
                                    <div class="label">Select Phenotypes</div>
                                    <phenotype-selectpicker
                                        :phenotypes="$parent.phenotypeList"
                                        :placeholder="'Select phenotype'"
                                        :clearOnSelected="true"
                                    >
                                    </phenotype-selectpicker>
                                </div>
                                <div class="col filter-col-sm">
                                    <div class="label">
                                        Get credible sets list
                                    </div>
                                    <button
                                        id="regionSearchGo"
                                        class="btn btn-light btn-sm go"
                                        type="button"
                                    >
                                        GO
                                    </button>
                                </div>
                            </div>
                        </b-row>
                    </b-container>
                    {{ $parent.chr + ":" + $parent.start + "-" + $parent.end }}
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
</style>
