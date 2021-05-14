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
                        style="margin-bottom: 30px"
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
                                            $store.dispatch(
                                                'onGeneChange',
                                                $event
                                            )
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
                    {{ $parent.region }}
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
.selected-phenotype {
    position: relative;
    padding: 0 15px 0 15px;
    margin-bottom: 0.5rem;
    border: 1px solid transparent;
    border-radius: 1.5rem;
    /* min-height: 50px; */
    /* min-width: -webkit-fit-content; */
    min-width: -moz-fit-content;
    min-width: fit-content;
    white-space: nowrap;
    height: 40px;
}
#variant-finder div.col .label {
    display: inline-block;
}
.selected-phenotype div.filtering-ui-content {
    display: inline-block;
}
.selected-phenotype div.filtering-ui-content input {
    /*background: transparent;*/
    background-color: #ffffff60;
    border: 1px solid #aaa;
}
.selected-phenotype div.filtering-ui-content input::placeholder {
    color: #666;
    opacity: 1; /* Firefox */
}
.selected-phenotype:not(:first-child) {
    margin-left: 2rem;
}

.selected-phenotype:not(:first-child) div.lead {
    width: 310px !important;
}
/* .selected-phenotype > div {
    display: table-cell;
} */
#variant-finder .selected-phenotype div.filtering-ui-wrapper {
    border: none;
    background-color: transparent;
    margin: auto;
    padding: 0;
    width: 240px;
    transition: all 2s;
    /* overflow: hidden; */
    /* white-space: nowrap; */
    display: inline-block;
}
.filter-pill-collection {
    margin-right: 15px;
    /* width: 300px; */
    white-space: nowrap;
    float: right;
}

.filter-options {
    width: 240px;
    display: inline-block;
}
.filter-options > span > div {
    display: inline-block;
}
.selected-phenotype .close {
    position: absolute;
    right: 0.1rem;
    top: 0.6rem;
    font-size: 1.15rem;
    opacity: 1 !important;
    /*float: unset;*/
}
div.lead {
    display: inline-block;
    vertical-align: top;
    margin-top: 0.2rem;
    width: 342px !important;
    overflow: hidden;
    text-overflow: ellipsis;
}
.selected-phenotype:first-child div.lead {
    /*margin-left: 0.75rem;*/
}
div.lead .lead-icon {
    /*position: absolute;
    left: 0.6rem;
    top: 0.3rem;*/
    font-size: 1.4rem;
}
.filters-wrapper {
    border: solid 1px #ddd;
    border-radius: 5px;
    padding: 10px 15px;
    font-size: 16px;
    font-family: Arial, Helvetica, sans-serif;
}
.filters-wrapper div,
.filters-wrapper span {
    display: inline-block;
}
#sliding_filters_wrapper {
    width: 50%;
    overflow: hidden;
    white-space: nowrap;
    border: solid 1px #ddd;
    transition: all 2s;
}
#sliding_filters_wrapper.hidden {
    width: 0 !important;
    border: solid 0px #fff;
}

.slide-fade-enter-active,
.slide-fade-leave-active,
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.5s;
}

.slide-fade-enter {
    transform: translateX(-20%);
    /* width: auto; */
}
.slide-fade-leave-to {
    transform: translateX(-10%);
    /* transform: translateY(-100%); */
}
.slide-down-enter {
    transform: translateY(-20%);
    /* width: auto; */
}
.slide-down-leave-to {
    transform: translateY(-10%);
    /* transform: translateY(-100%); */
}
button:focus {
    outline: none !important;
}
</style>
