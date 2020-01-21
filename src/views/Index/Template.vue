<template>
    <div>
        <!-- Header -->
        <page-header></page-header>

        <!-- Body -->
        <div class="fluid front-top-banner-mdkp front-top-banner">
            <div class="row">
                <div class="col-md-12">
                    <div class="front-logo-wrapper">
                        <img class="front-logo-img" src="images/MDKP_front_logo.svg">
                        <span class="front-logo-tagline front-logo-tagline-mdkp">Providing data and tools to promote understanding of cardiometabolic disorders and their complications
                        </span>
                    </div>
                </div>
                <div class="col-md-6 offset-md-3" style="text-align: center; padding-top: 30px;">
                    <a href="http://www.kp4cd.org/new_features/mdkp" target="_blank" class="btn btn-lg btn-default front-banner-btn">Learn about the portal</a>
                </div>

                <div class="col-md-12">
                    <h2 class="front-banner-ui-tabs" style="font-size: 45px; padding-bottom: 15px;">Explore by region</h2>
                    <phenotype-selectpicker v-bind:phenotypes="$parent.phenotypes"></phenotype-selectpicker>
                    <dataset-selectpicker v-bind:datasets="$parent.datasetList"></dataset-selectpicker>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer></page-footer>
    </div>
</template>
